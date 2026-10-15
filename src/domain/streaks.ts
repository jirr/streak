import { addDays } from 'date-fns'
import {
  isInGraceWindow,
  parseDayKey,
  periodKeyOf,
  periodStart,
  shiftPeriod,
  targetOf,
  toDayKey,
} from './periods.ts'
import type { CheckIn, Run, Series, SeriesStats } from './types.ts'

interface ValidPeriod {
  key: string
  start: Date
  dayKeys: string[]
}

/** Périodes validées (count >= cible), triées chronologiquement. */
function validatedPeriods(series: Series, checkIns: CheckIn[]): ValidPeriod[] {
  const groups = new Map<string, ValidPeriod>()
  for (const c of checkIns) {
    if (c.seriesId !== series.id) continue
    const day = parseDayKey(c.dayKey)
    const key = periodKeyOf(series.periodicity, day)
    let g = groups.get(key)
    if (!g) {
      g = { key, start: periodStart(series.periodicity, day), dayKeys: [] }
      groups.set(key, g)
    }
    g.dayKeys.push(c.dayKey)
  }
  const target = targetOf(series)
  return [...groups.values()]
    .filter((g) => g.dayKeys.length >= target)
    .sort((a, b) => a.start.getTime() - b.start.getTime())
}

function buildRuns(series: Series, periods: ValidPeriod[]): Run[] {
  const runs: Run[] = []
  let chunk: ValidPeriod[] = []
  const flush = () => {
    if (chunk.length === 0) return
    const days = chunk.flatMap((p) => p.dayKeys).sort()
    runs.push({
      seriesId: series.id,
      startPeriodKey: chunk[0].key,
      endPeriodKey: chunk[chunk.length - 1].key,
      startDayKey: days[0],
      endDayKey: days[days.length - 1],
      length: chunk.length,
      active: false,
    })
    chunk = []
  }
  for (const p of periods) {
    const prev = chunk[chunk.length - 1]
    const consecutive =
      prev !== undefined &&
      periodKeyOf(series.periodicity, shiftPeriod(series.periodicity, prev.start, 1)) === p.key
    if (!consecutive) flush()
    chunk.push(p)
  }
  flush()
  return runs
}

export function computeStats(
  series: Series,
  checkIns: CheckIn[],
  now: Date,
  graceHour: number,
): SeriesStats {
  const periodicity = series.periodicity
  const target = targetOf(series)
  const runs = buildRuns(series, validatedPeriods(series, checkIns))
  const best = runs.reduce((m, r) => Math.max(m, r.length), 0)

  if (series.archivedAt) {
    return {
      current: 0,
      best,
      status: 'pending',
      progress: { count: 0, target },
      checkedToday: false,
      runs,
    }
  }

  const p0 = periodKeyOf(periodicity, now)
  const p1 = periodKeyOf(periodicity, shiftPeriod(periodicity, now, -1))
  const p2 = periodKeyOf(periodicity, shiftPeriod(periodicity, now, -2))
  const runEndingAt = (key: string) => runs.find((r) => r.endPeriodKey === key)

  let run: Run | undefined
  let status: SeriesStats['status'] = 'pending'
  if (runEndingAt(p0)) {
    run = runEndingAt(p0)
    status = 'done'
  } else if (runEndingAt(p1)) {
    run = runEndingAt(p1)
  } else if (
    isInGraceWindow(now, graceHour) &&
    periodKeyOf(periodicity, addDays(now, -1)) === p1
  ) {
    run = runEndingAt(p2)
    status = 'atRisk'
  }
  if (run) run.active = true

  const today = toDayKey(now)
  let count = 0
  let checkedToday = false
  for (const c of checkIns) {
    if (c.seriesId !== series.id) continue
    if (c.dayKey === today) checkedToday = true
    if (periodKeyOf(periodicity, parseDayKey(c.dayKey)) === p0) count++
  }

  return {
    current: run?.length ?? 0,
    best,
    status,
    progress: { count, target },
    checkedToday,
    runs,
  }
}
