import { useMemo } from 'react'
import { computeStats } from '../domain/streaks.ts'
import type { SeriesStats } from '../domain/types.ts'
import { useAppStore } from './store.ts'
import { useNow } from './useNow.ts'

export function useSeriesStats(): { now: Date; stats: Map<string, SeriesStats> } {
  const now = useNow()
  const series = useAppStore((s) => s.series)
  const checkIns = useAppStore((s) => s.checkIns)
  const graceHour = useAppStore((s) => s.settings.graceHour)
  const stats = useMemo(
    () => new Map(series.map((s) => [s.id, computeStats(s, checkIns, now, graceHour)])),
    [series, checkIns, now, graceHour],
  )
  return { now, stats }
}
