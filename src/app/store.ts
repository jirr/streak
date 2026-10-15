import { create } from 'zustand'
import { repos } from '../data/index.ts'
import { makeCheckIn, validateCheckIn } from '../domain/checkins.ts'
import { computeStats } from '../domain/streaks.ts'
import {
  DEFAULT_SETTINGS,
  type BackupV1,
  type CheckIn,
  type Gender,
  type Profile,
  type Series,
  type SeriesStats,
  type Settings,
} from '../domain/types.ts'
import { canUndo } from '../domain/checkins.ts'

export type SeriesDraft = Pick<
  Series,
  'title' | 'icon' | 'color' | 'kind' | 'periodicity' | 'target' | 'reminder' | 'presetId'
>

export interface CheckInResult {
  stats: SeriesStats
  recordBroken: boolean
}

interface AppState {
  status: 'loading' | 'onboarding' | 'ready'
  profile: Profile | null
  settings: Settings
  series: Series[]
  checkIns: CheckIn[]
  /** Invite de notifications à montrer au retour sur l'accueil (après la 1re série). */
  notificationPromptPending: boolean
  /** Bandeau « pas encore coché » fermé pour ce jour (état de session). */
  bannerDismissedDayKey: string | null

  init(): Promise<void>
  completeOnboarding(pseudo: string, gender?: Gender): Promise<void>
  updateProfile(p: Partial<Pick<Profile, 'pseudo' | 'gender'>>): Promise<void>
  updateSettings(p: Partial<Settings>): Promise<void>
  createSeries(draft: SeriesDraft): Promise<Series>
  updateSeries(id: string, draft: SeriesDraft): Promise<void>
  archiveSeries(id: string): Promise<void>
  unarchiveSeries(id: string): Promise<void>
  deleteSeries(id: string): Promise<void>
  checkIn(seriesId: string, dayKey: string): Promise<CheckInResult>
  undoCheckIn(seriesId: string): Promise<void>
  exportData(): Promise<BackupV1>
  importData(b: BackupV1): Promise<void>
  resetAll(): Promise<void>
  clearNotificationPrompt(): Promise<void>
  dismissBanner(dayKey: string): void
}

function sortSeries(list: Series[]): Series[] {
  return [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export const useAppStore = create<AppState>()((set, get) => {
  async function reload(): Promise<void> {
    const [profile, settings, series, checkIns] = await Promise.all([
      repos.profile.get(),
      repos.settings.get(),
      repos.series.list(),
      repos.checkIns.list(),
    ])
    set({
      status: profile ? 'ready' : 'onboarding',
      profile,
      settings,
      series: sortSeries(series),
      checkIns,
    })
  }

  function findSeries(id: string): Series {
    const s = get().series.find((x) => x.id === id)
    if (!s) throw new Error(`Série introuvable : ${id}`)
    return s
  }

  async function saveSeries(next: Series): Promise<void> {
    await repos.series.put(next)
    set((st) => ({ series: sortSeries(st.series.map((s) => (s.id === next.id ? next : s))) }))
  }

  return {
    status: 'loading',
    profile: null,
    settings: DEFAULT_SETTINGS,
    series: [],
    checkIns: [],
    notificationPromptPending: false,
    bannerDismissedDayKey: null,

    init: reload,

    async completeOnboarding(pseudo, gender) {
      const profile: Profile = {
        id: crypto.randomUUID(),
        pseudo: pseudo.trim().slice(0, 30),
        ...(gender ? { gender } : {}),
        authProvider: 'local',
        createdAt: new Date().toISOString(),
      }
      await repos.profile.save(profile)
      set({ profile, status: 'ready' })
      // Demande de stockage persistant : on ignore le résultat (best effort).
      try {
        await navigator.storage?.persist?.()
      } catch {
        /* ignoré */
      }
    },

    async updateProfile(p) {
      const current = get().profile
      if (!current) return
      const profile = { ...current, ...p }
      if (profile.gender === undefined) delete profile.gender
      await repos.profile.save(profile)
      set({ profile })
    },

    async updateSettings(p) {
      const settings = { ...get().settings, ...p }
      await repos.settings.save(settings)
      set({ settings })
    },

    async createSeries(draft) {
      const now = new Date().toISOString()
      const series: Series = {
        ...draft,
        title: draft.title.trim(),
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      }
      await repos.series.put(series)
      const firstSeries = get().series.length === 0 && !get().settings.notificationsPrompted
      set((st) => ({
        series: sortSeries([...st.series, series]),
        notificationPromptPending: st.notificationPromptPending || firstSeries,
      }))
      return series
    },

    async updateSeries(id, draft) {
      const prev = findSeries(id)
      const next: Series = { ...prev, ...draft, title: draft.title.trim(), updatedAt: new Date().toISOString() }
      if (draft.color === undefined) delete next.color
      if (draft.target === undefined) delete next.target
      if (draft.presetId === undefined) delete next.presetId
      const periodChanged = prev.periodicity !== next.periodicity || prev.target !== next.target
      if (periodChanged) {
        await repos.series.updatePeriodicity(next)
        const checkIns = await repos.checkIns.list()
        set((st) => ({
          series: sortSeries(st.series.map((s) => (s.id === id ? next : s))),
          checkIns,
        }))
      } else {
        await saveSeries(next)
      }
    },

    async archiveSeries(id) {
      const now = new Date().toISOString()
      await saveSeries({ ...findSeries(id), archivedAt: now, updatedAt: now })
    },

    async unarchiveSeries(id) {
      const { archivedAt: _archivedAt, ...rest } = findSeries(id)
      await saveSeries({ ...rest, updatedAt: new Date().toISOString() })
    },

    async deleteSeries(id) {
      await repos.series.delete(id)
      set((st) => ({
        series: st.series.filter((s) => s.id !== id),
        checkIns: st.checkIns.filter((c) => c.seriesId !== id),
      }))
    },

    async checkIn(seriesId, dayKey) {
      const { checkIns, settings } = get()
      const series = findSeries(seriesId)
      const now = new Date()
      const verdict = validateCheckIn(series, checkIns, dayKey, now, settings.graceHour)
      if (!verdict.ok) throw new Error(verdict.reason)
      const statsBefore = computeStats(series, checkIns, now, settings.graceHour)
      const checkIn = makeCheckIn(series, dayKey, now)
      await repos.checkIns.add(checkIn)
      const next = [...checkIns, checkIn]
      set({ checkIns: next })
      const stats = computeStats(series, next, now, settings.graceHour)
      return { stats, recordBroken: statsBefore.best > 0 && stats.current > statsBefore.best }
    },

    async undoCheckIn(seriesId) {
      const now = new Date()
      const latest = get()
        .checkIns.filter((c) => c.seriesId === seriesId && canUndo(c, now))
        .sort((a, b) => b.confirmedAt.localeCompare(a.confirmedAt))[0]
      if (!latest) return
      await repos.checkIns.delete(latest.id)
      set((st) => ({ checkIns: st.checkIns.filter((c) => c.id !== latest.id) }))
    },

    exportData: () => repos.backup.exportAll(new Date()),

    async importData(b) {
      await repos.backup.replaceAll(b)
      await reload()
    },

    async resetAll() {
      await repos.backup.clearAll()
      set({
        status: 'onboarding',
        profile: null,
        settings: DEFAULT_SETTINGS,
        series: [],
        checkIns: [],
        notificationPromptPending: false,
      })
    },

    async clearNotificationPrompt() {
      set({ notificationPromptPending: false })
      if (!get().settings.notificationsPrompted) await get().updateSettings({ notificationsPrompted: true })
    },

    dismissBanner(dayKey) {
      set({ bannerDismissedDayKey: dayKey })
    },
  }
})
