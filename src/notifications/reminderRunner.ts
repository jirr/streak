import { computeStats } from '../domain/streaks.ts'
import { resolveLocale } from '../domain/locale.ts'
import { toDayKey } from '../domain/periods.ts'
import { buildReminderNotification, dueReminders, uncheckedToday, type ReminderNotification } from '../domain/reminders.ts'
import type { Repositories } from '../data/repositories.ts'

export interface ReminderRunResult {
  /** Nombre de séries notifiées. */
  shown: number
  /** Nombre de séries restant à cocher (pour le badge). */
  unchecked: number
}

/**
 * Logique partagée page / service worker : relit les données, notifie les rappels dus, journalise.
 * `systemLanguages` : `navigator.languages` du contexte appelant (langue « système »).
 */
export async function runReminderCheck(
  repos: Repositories,
  now: Date,
  show: (n: ReminderNotification) => Promise<void>,
  systemLanguages: readonly string[],
): Promise<ReminderRunResult> {
  const [series, checkIns, settings, log] = await Promise.all([
    repos.series.list(),
    repos.checkIns.list(),
    repos.settings.get(),
    repos.reminderLog.get(),
  ])
  const due = dueReminders(series, checkIns, now, settings.graceHour, log, settings.remindersEnabled)
  if (due.length > 0) {
    const stats = new Map(due.map((s) => [s.id, computeStats(s, checkIns, now, settings.graceHour)]))
    await show(buildReminderNotification(due, stats, resolveLocale(settings.language, systemLanguages)))
    await repos.reminderLog.markSent(
      due.map((s) => s.id),
      toDayKey(now),
    )
  }
  return { shown: due.length, unchecked: uncheckedToday(series, checkIns, now, settings.graceHour).length }
}

/** Options `showNotification` ; `scope` = portée du service worker (fonctionne quel que soit le chemin de base). */
export function notificationOptions(n: ReminderNotification, scope: string): NotificationOptions {
  return {
    body: n.body,
    tag: n.tag,
    icon: new URL('pwa-192x192.png', scope).href,
    data: { url: scope },
  }
}
