import { addDays } from 'date-fns'
import { parseDayKey, periodKeyOf, toDayKey } from '../domain/periods.ts'
import type { CheckIn, Series } from '../domain/types.ts'

export function makeSeries(overrides: Partial<Series> = {}): Series {
  return {
    id: 's1',
    title: 'Sans alcool',
    icon: '🍸',
    color: 'orange',
    kind: 'abstinence',
    periodicity: 'daily',
    reminder: { enabled: true, time: '21:00' },
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-01-01T08:00:00.000Z',
    ...overrides,
  }
}

/** Check-ins quotidiens pour une liste de dayKeys ; periodKey calculée selon la périodicité. */
export function checks(
  seriesId: string,
  dayKeys: string[],
  periodicity: Series['periodicity'] = 'daily',
): CheckIn[] {
  return dayKeys.map((dayKey) => ({
    id: `${seriesId}|${dayKey}`,
    seriesId,
    dayKey,
    periodKey: periodKeyOf(periodicity, parseDayKey(dayKey)),
    confirmedAt: `${dayKey}T12:00:00.000Z`,
  }))
}

/** n jours consécutifs à partir de start (inclus). */
export function range(start: string, n: number): string[] {
  const first = parseDayKey(start)
  return Array.from({ length: n }, (_, i) => toDayKey(addDays(first, i)))
}

/** Date locale (mois 1-12). */
export function at(y: number, m: number, d: number, h = 10, min = 0): Date {
  return new Date(y, m - 1, d, h, min)
}
