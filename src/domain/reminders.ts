import { addDays } from 'date-fns'
import { nextCheckTarget } from './checkins.ts'
import { unitLabel } from './labels.ts'
import { toDayKey } from './periods.ts'
import type { CheckIn, Locale, ReminderLog, Series, SeriesStats } from './types.ts'

/** Séries actives dont il reste quelque chose à cocher (bandeau, badge, titre). */
export function uncheckedToday(
  series: Series[],
  checkIns: CheckIn[],
  now: Date,
  graceHour: number,
): Series[] {
  return series.filter((s) => nextCheckTarget(s, checkIns, now, graceHour) !== null)
}

function atTime(day: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number)
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m, 0, 0)
}

export function dueReminders(
  series: Series[],
  checkIns: CheckIn[],
  now: Date,
  graceHour: number,
  log: ReminderLog,
  remindersEnabled: boolean,
): Series[] {
  if (!remindersEnabled) return []
  const today = toDayKey(now)
  return series.filter((s) => {
    if (s.archivedAt || !s.reminder.enabled) return false
    if (now < atTime(now, s.reminder.time)) return false
    if (log[s.id] === today) return false
    const target = nextCheckTarget(s, checkIns, now, graceHour)
    return target !== null && !target.isYesterday
  })
}

/** Plus proche horaire futur de rappel (aujourd'hui s'il n'est pas passé, sinon demain). */
export function nextReminderAt(series: Series[], now: Date, remindersEnabled: boolean): Date | null {
  if (!remindersEnabled) return null
  let best: Date | null = null
  for (const s of series) {
    if (s.archivedAt || !s.reminder.enabled) continue
    let at = atTime(now, s.reminder.time)
    if (at <= now) at = atTime(addDays(now, 1), s.reminder.time)
    if (!best || at < best) best = at
  }
  return best
}

export interface ReminderNotification {
  title: string
  body: string
  tag: string
}

/** Contenu partagé entre la page et le service worker. */
export function buildReminderNotification(
  due: Series[],
  statsById: ReadonlyMap<string, SeriesStats>,
  locale: Locale,
): ReminderNotification {
  const tag = 'series-reminder'
  const title = locale === 'fr' ? "Tu n'as pas encore coché aujourd'hui" : "You haven't checked in yet today"
  if (due.length === 1) {
    const s = due[0]
    const current = statsById.get(s.id)?.current ?? 0
    const unit = unitLabel(s.periodicity, current, locale)
    const body =
      locale === 'fr'
        ? `« ${s.title} » t'attend. ${current} ${unit}, ne lâche rien.`
        : `“${s.title}” is waiting. ${current} ${unit}, don't let go.`
    return { title, body, tag }
  }
  const body =
    locale === 'fr'
      ? `${due.length} séries t'attendent. Deux “oui” et c'est réglé.`
      : `${due.length} streaks are waiting. Two “yes” and you're done.`
  return { title, body, tag }
}
