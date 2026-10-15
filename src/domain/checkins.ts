import { addDays, isSameDay } from 'date-fns'
import { isInGraceWindow, parseDayKey, periodKeyOf, targetOf, toDayKey } from './periods.ts'
import type { CheckIn, Series } from './types.ts'

export interface CheckTarget {
  dayKey: string
  isYesterday: boolean
}

export type CheckValidation =
  | { ok: true }
  | { ok: false; reason: 'archived' | 'already-checked' | 'out-of-window' | 'target-reached' }

function countInPeriodOf(series: Series, checkIns: CheckIn[], dayKey: string): number {
  const key = periodKeyOf(series.periodicity, parseDayKey(dayKey))
  let n = 0
  for (const c of checkIns) {
    if (c.seriesId === series.id && periodKeyOf(series.periodicity, parseDayKey(c.dayKey)) === key) n++
  }
  return n
}

function isOpen(series: Series, checkIns: CheckIn[], dayKey: string): boolean {
  const alreadyChecked = checkIns.some((c) => c.seriesId === series.id && c.dayKey === dayKey)
  return !alreadyChecked && countInPeriodOf(series, checkIns, dayKey) < targetOf(series)
}

/** Prochain jour à cocher : hier (fenêtre de grâce) puis aujourd'hui, sinon null. */
export function nextCheckTarget(
  series: Series,
  checkIns: CheckIn[],
  now: Date,
  graceHour: number,
): CheckTarget | null {
  if (series.archivedAt) return null
  if (isInGraceWindow(now, graceHour)) {
    const yesterday = toDayKey(addDays(now, -1))
    if (isOpen(series, checkIns, yesterday)) return { dayKey: yesterday, isYesterday: true }
  }
  const today = toDayKey(now)
  if (isOpen(series, checkIns, today)) return { dayKey: today, isYesterday: false }
  return null
}

export function validateCheckIn(
  series: Series,
  checkIns: CheckIn[],
  dayKey: string,
  now: Date,
  graceHour: number,
): CheckValidation {
  if (series.archivedAt) return { ok: false, reason: 'archived' }
  const isToday = dayKey === toDayKey(now)
  const isYesterdayInGrace =
    isInGraceWindow(now, graceHour) && dayKey === toDayKey(addDays(now, -1))
  if (!isToday && !isYesterdayInGrace) return { ok: false, reason: 'out-of-window' }
  if (checkIns.some((c) => c.seriesId === series.id && c.dayKey === dayKey)) {
    return { ok: false, reason: 'already-checked' }
  }
  if (countInPeriodOf(series, checkIns, dayKey) >= targetOf(series)) {
    return { ok: false, reason: 'target-reached' }
  }
  return { ok: true }
}

export function checkInId(seriesId: string, dayKey: string): string {
  return `${seriesId}|${dayKey}`
}

export function makeCheckIn(series: Series, dayKey: string, now: Date): CheckIn {
  return {
    id: checkInId(series.id, dayKey),
    seriesId: series.id,
    dayKey,
    periodKey: periodKeyOf(series.periodicity, parseDayKey(dayKey)),
    confirmedAt: now.toISOString(),
  }
}

/** Annulable le jour calendaire local de la confirmation. */
export function canUndo(checkIn: CheckIn, now: Date): boolean {
  return isSameDay(new Date(checkIn.confirmedAt), now)
}
