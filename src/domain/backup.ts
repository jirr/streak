import {
  DEFAULT_SETTINGS,
  TINT_KEYS,
  type BackupV1,
  type CheckIn,
  type Gender,
  type Periodicity,
  type Profile,
  type Series,
  type SeriesKind,
  type Settings,
  type TintKey,
} from './types.ts'

export type BackupErrorCode = 'not-series' | 'unsupported-version' | 'corrupt'

export type ParseBackupResult =
  | { ok: true; backup: BackupV1 }
  | { ok: false; error: BackupErrorCode; /** chemin du champ fautif (error = 'corrupt') */ field?: string }

export function buildBackup(
  data: Pick<BackupV1, 'profile' | 'settings' | 'series' | 'checkIns'>,
  now: Date,
): BackupV1 {
  return {
    app: 'series',
    schemaVersion: 1,
    exportedAt: now.toISOString(),
    profile: data.profile,
    settings: data.settings,
    series: data.series,
    checkIns: data.checkIns,
  }
}

class BackupError extends Error {}

/** `field` : chemin du champ invalide, ex. `checkIns[0].dayKey`. */
function fail(field: string): never {
  throw new BackupError(field)
}

type Obj = Record<string, unknown>

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function str(o: Obj, key: string, where: string): string {
  const v = o[key]
  if (typeof v !== 'string') fail(`${where}.${key}`)
  return v
}

function optStr(o: Obj, key: string, where: string): string | undefined {
  const v = o[key]
  if (v === undefined) return undefined
  if (typeof v !== 'string') fail(`${where}.${key}`)
  return v
}

function oneOf<T extends string>(o: Obj, key: string, allowed: readonly T[], where: string): T {
  const v = o[key]
  if (typeof v !== 'string' || !allowed.includes(v as T)) fail(`${where}.${key}`)
  return v as T
}

const KINDS: SeriesKind[] = ['abstinence', 'habit']
const PERIODICITIES: Periodicity[] = ['daily', 'weekly', 'monthly']
const GENDERS: Gender[] = ['female', 'male', 'other', 'unspecified']
const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/

function parseSeries(raw: unknown, i: number): Series {
  const where = `series[${i}]`
  if (!isObj(raw)) fail(where)
  const reminder = raw.reminder
  if (!isObj(reminder) || typeof reminder.enabled !== 'boolean' || typeof reminder.time !== 'string') {
    fail(`${where}.reminder`)
  }
  const series: Series = {
    id: str(raw, 'id', where),
    title: str(raw, 'title', where),
    icon: str(raw, 'icon', where),
    kind: oneOf(raw, 'kind', KINDS, where),
    periodicity: oneOf(raw, 'periodicity', PERIODICITIES, where),
    reminder: { enabled: reminder.enabled, time: reminder.time },
    createdAt: str(raw, 'createdAt', where),
    updatedAt: str(raw, 'updatedAt', where),
  }
  if (raw.color !== undefined) series.color = oneOf<TintKey>(raw, 'color', TINT_KEYS, where)
  if (raw.target !== undefined) {
    if (typeof raw.target !== 'number' || !Number.isInteger(raw.target) || raw.target < 1) {
      fail(`${where}.target`)
    }
    series.target = raw.target
  }
  const archivedAt = optStr(raw, 'archivedAt', where)
  if (archivedAt !== undefined) series.archivedAt = archivedAt
  const presetId = optStr(raw, 'presetId', where)
  if (presetId !== undefined) series.presetId = presetId
  return series
}

function parseCheckIn(raw: unknown, i: number): CheckIn {
  const where = `checkIns[${i}]`
  if (!isObj(raw)) fail(where)
  const dayKey = str(raw, 'dayKey', where)
  if (!DAY_KEY.test(dayKey)) fail(`${where}.dayKey`)
  return {
    id: str(raw, 'id', where),
    seriesId: str(raw, 'seriesId', where),
    dayKey,
    periodKey: str(raw, 'periodKey', where),
    confirmedAt: str(raw, 'confirmedAt', where),
  }
}

function parseProfile(raw: unknown): Profile | null {
  if (raw === null || raw === undefined) return null
  if (!isObj(raw)) fail('profile')
  const profile: Profile = {
    id: str(raw, 'id', 'profile'),
    pseudo: str(raw, 'pseudo', 'profile'),
    authProvider: 'local',
    createdAt: str(raw, 'createdAt', 'profile'),
  }
  if (raw.gender !== undefined) profile.gender = oneOf<Gender>(raw, 'gender', GENDERS, 'profile')
  return profile
}

function parseSettings(raw: unknown): Settings {
  const settings: Settings = { ...DEFAULT_SETTINGS }
  if (raw === undefined || raw === null) return settings
  if (!isObj(raw)) fail('settings')
  if (typeof raw.graceHour === 'number' && raw.graceHour >= 0 && raw.graceHour <= 6) {
    settings.graceHour = Math.floor(raw.graceHour)
  }
  if (typeof raw.remindersEnabled === 'boolean') settings.remindersEnabled = raw.remindersEnabled
  if (typeof raw.notificationsPrompted === 'boolean') settings.notificationsPrompted = raw.notificationsPrompted
  if (raw.viewMode === 'grid' || raw.viewMode === 'list') settings.viewMode = raw.viewMode
  if (typeof raw.installNudgeDismissed === 'boolean') settings.installNudgeDismissed = raw.installNudgeDismissed
  if (typeof raw.lastBackupAt === 'string') settings.lastBackupAt = raw.lastBackupAt
  if (typeof raw.backupNudgeDismissedAt === 'string') settings.backupNudgeDismissedAt = raw.backupNudgeDismissedAt
  if (raw.language === 'system' || raw.language === 'fr' || raw.language === 'en') settings.language = raw.language
  return settings
}

export function parseBackup(text: string): ParseBackupResult {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false, error: 'not-series' }
  }
  if (!isObj(json) || json.app !== 'series') {
    return { ok: false, error: 'not-series' }
  }
  if (json.schemaVersion !== 1) return { ok: false, error: 'unsupported-version' }
  try {
    if (!Array.isArray(json.series)) fail('series')
    if (!Array.isArray(json.checkIns)) fail('checkIns')
    const series = json.series.map(parseSeries)
    const checkIns = json.checkIns.map(parseCheckIn)
    return {
      ok: true,
      backup: {
        app: 'series',
        schemaVersion: 1,
        exportedAt: typeof json.exportedAt === 'string' ? json.exportedAt : new Date(0).toISOString(),
        profile: parseProfile(json.profile),
        settings: parseSettings(json.settings),
        series,
        checkIns,
      },
    }
  } catch (e) {
    if (e instanceof BackupError) return { ok: false, error: 'corrupt', field: e.message }
    throw e
  }
}

export const BACKUP_NUDGE_MIN_CHECKINS = 7
export const BACKUP_NUDGE_DAYS = 14

const MS_PER_DAY = 24 * 60 * 60 * 1000

function olderThanDays(iso: string | undefined, days: number, now: Date): boolean {
  return iso === undefined || now.getTime() - new Date(iso).getTime() > days * MS_PER_DAY
}

/** Rappel de sauvegarde sur l'accueil : assez de données, pas de sauvegarde récente, pas déjà écarté. */
export function shouldNudgeBackup(checkInCount: number, settings: Settings, now: Date): boolean {
  return (
    checkInCount >= BACKUP_NUDGE_MIN_CHECKINS &&
    olderThanDays(settings.lastBackupAt, BACKUP_NUDGE_DAYS, now) &&
    olderThanDays(settings.backupNudgeDismissedAt, BACKUP_NUDGE_DAYS, now)
  )
}
