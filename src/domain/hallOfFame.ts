import type { Run, Series, SeriesStats } from './types.ts'

export interface HallRun {
  series: Series
  run: Run
}

export interface HallCurrent {
  series: Series
  current: number
}

export interface HallOfFame {
  top: HallRun[]
  current: HallCurrent[]
  past: HallRun[]
  archived: Series[]
}

export const TOP_LIMIT = 10
export const PAST_LIMIT = 20

/** Records, séries en cours et runs terminés, archivées incluses. */
export function buildHallOfFame(series: Series[], statsById: ReadonlyMap<string, SeriesStats>): HallOfFame {
  const runs: HallRun[] = series.flatMap((s) => (statsById.get(s.id)?.runs ?? []).map((run) => ({ series: s, run })))

  const top = [...runs]
    .sort((a, b) => b.run.length - a.run.length || b.run.endDayKey.localeCompare(a.run.endDayKey))
    .slice(0, TOP_LIMIT)

  const current = series
    .filter((s) => !s.archivedAt)
    .map((s) => ({ series: s, current: statsById.get(s.id)?.current ?? 0 }))
    .filter((c) => c.current > 0)
    .sort((a, b) => b.current - a.current)

  const past = runs
    .filter((r) => !r.run.active)
    .sort((a, b) => b.run.endDayKey.localeCompare(a.run.endDayKey))
    .slice(0, PAST_LIMIT)

  return { top, current, past, archived: series.filter((s) => s.archivedAt) }
}
