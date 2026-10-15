import { describe, expect, it } from 'vitest'
import { at, checks, makeSeries, range } from '../test/fixtures.ts'
import { buildHallOfFame, PAST_LIMIT, TOP_LIMIT } from './hallOfFame.ts'
import { computeStats } from './streaks.ts'

const now = at(2026, 10, 15, 10)

function build(...specs: Array<[ReturnType<typeof makeSeries>, string[]]>) {
  const stats = new Map(specs.map(([s, days]) => [s.id, computeStats(s, checks(s.id, days), now, 4)]))
  return buildHallOfFame(specs.map(([s]) => s), stats)
}

describe('buildHallOfFame', () => {
  const a = makeSeries({ id: 'a', title: 'A' })
  const b = makeSeries({ id: 'b', title: 'B' })

  it('top : plus longs runs d’abord, égalité → fin la plus récente ; « en cours » trié par compteur', () => {
    const hall = build(
      [a, [...range('2026-05-01', 33), ...range('2026-10-08', 8)]],
      [b, [...range('2026-01-01', 33), ...range('2026-10-13', 3)]],
    )
    expect(hall.top.map((r) => [r.series.id, r.run.length])).toEqual([
      ['a', 33],
      ['b', 33],
      ['a', 8],
      ['b', 3],
    ])
    expect(hall.current.map((c) => [c.series.id, c.current])).toEqual([
      ['a', 8],
      ['b', 3],
    ])
  })

  it('« passées » exclut les runs actifs, plus récents d’abord', () => {
    const hall = build([a, [...range('2026-05-01', 33), ...range('2026-07-01', 5), ...range('2026-10-08', 8)]])
    expect(hall.past.map((r) => r.run.length)).toEqual([5, 33])
  })

  it('séries archivées : runs conservés, jamais « en cours », listées pour relance', () => {
    const archived = makeSeries({ id: 'z', archivedAt: '2026-10-10T12:00:00.000Z' })
    const hall = build([archived, range('2026-10-05', 5)])
    expect(hall.current).toEqual([])
    expect(hall.past).toHaveLength(1)
    expect(hall.archived.map((s) => s.id)).toEqual(['z'])
  })

  it('plafonds : 10 records, 20 passées', () => {
    // un jour sur deux pendant 60 jours = 30 runs d'un jour
    const everyOther = range('2025-01-01', 60).filter((_, i) => i % 2 === 0)
    const hall = build([a, everyOther])
    expect(hall.top).toHaveLength(TOP_LIMIT)
    expect(hall.past).toHaveLength(PAST_LIMIT)
  })

  it('vide', () => {
    expect(build()).toEqual({ top: [], current: [], past: [], archived: [] })
  })
})
