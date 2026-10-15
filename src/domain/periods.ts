import {
  addDays,
  addMonths,
  addWeeks,
  format,
  startOfDay,
  startOfISOWeek,
  startOfMonth,
} from 'date-fns'
import type { Periodicity, Series } from './types.ts'

export function toDayKey(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

/** 'yyyy-MM-dd' → minuit LOCAL (jamais new Date('yyyy-MM-dd'), qui est UTC). */
export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function periodStart(p: Periodicity, d: Date): Date {
  switch (p) {
    case 'daily':
      return startOfDay(d)
    case 'weekly':
      return startOfISOWeek(d)
    case 'monthly':
      return startOfMonth(d)
  }
}

export function periodKeyOf(p: Periodicity, d: Date): string {
  switch (p) {
    case 'daily':
      return format(d, 'yyyy-MM-dd')
    case 'weekly':
      return format(d, "RRRR-'W'II")
    case 'monthly':
      return format(d, 'yyyy-MM')
  }
}

export function shiftPeriod(p: Periodicity, d: Date, n: number): Date {
  const start = periodStart(p, d)
  switch (p) {
    case 'daily':
      return addDays(start, n)
    case 'weekly':
      return addWeeks(start, n)
    case 'monthly':
      return addMonths(start, n)
  }
}

export function targetOf(series: Pick<Series, 'periodicity' | 'target'>): number {
  return series.periodicity === 'daily' ? 1 : Math.max(1, series.target ?? 1)
}

export function isInGraceWindow(now: Date, graceHour: number): boolean {
  return graceHour > 0 && now.getHours() < graceHour
}
