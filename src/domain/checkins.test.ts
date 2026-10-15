import { describe, expect, it } from 'vitest'
import { at, checks, makeSeries } from '../test/fixtures.ts'
import { canUndo, checkInId, makeCheckIn, nextCheckTarget, validateCheckIn } from './checkins.ts'

const daily = makeSeries()
const weekly3 = makeSeries({ periodicity: 'weekly', target: 3 })

describe('nextCheckTarget', () => {
  it('journée : aujourd’hui', () => {
    expect(nextCheckTarget(daily, [], at(2026, 10, 15, 10), 4)).toEqual({ dayKey: '2026-10-15', isYesterday: false })
  })

  it('02:00 avec hier libre : hier', () => {
    expect(nextCheckTarget(daily, [], at(2026, 10, 15, 2), 4)).toEqual({ dayKey: '2026-10-14', isYesterday: true })
  })

  it('02:00, hier déjà coché : aujourd’hui', () => {
    expect(nextCheckTarget(daily, checks('s1', ['2026-10-14']), at(2026, 10, 15, 2), 4)).toEqual({
      dayKey: '2026-10-15',
      isYesterday: false,
    })
  })

  it('aujourd’hui coché : null', () => {
    expect(nextCheckTarget(daily, checks('s1', ['2026-10-15']), at(2026, 10, 15, 10), 4)).toBeNull()
  })

  it('weekly cible atteinte : null', () => {
    const data = checks('s1', ['2026-10-12', '2026-10-13', '2026-10-14'], 'weekly')
    expect(nextCheckTarget(weekly3, data, at(2026, 10, 15, 10), 4)).toBeNull()
  })

  it('archivée : null', () => {
    expect(nextCheckTarget(makeSeries({ archivedAt: '2026-10-01T00:00:00.000Z' }), [], at(2026, 10, 15), 4)).toBeNull()
  })
})

describe('validateCheckIn', () => {
  const now = at(2026, 10, 15, 10)

  it('ok pour aujourd’hui', () => {
    expect(validateCheckIn(daily, [], '2026-10-15', now, 4)).toEqual({ ok: true })
  })

  it('ok pour hier pendant la grâce, refusé hors grâce', () => {
    expect(validateCheckIn(daily, [], '2026-10-14', at(2026, 10, 15, 2), 4)).toEqual({ ok: true })
    expect(validateCheckIn(daily, [], '2026-10-14', now, 4)).toEqual({ ok: false, reason: 'out-of-window' })
  })

  it('avant-hier et futur : out-of-window', () => {
    expect(validateCheckIn(daily, [], '2026-10-13', at(2026, 10, 15, 2), 4)).toEqual({ ok: false, reason: 'out-of-window' })
    expect(validateCheckIn(daily, [], '2026-10-16', now, 4)).toEqual({ ok: false, reason: 'out-of-window' })
  })

  it('doublon : already-checked', () => {
    expect(validateCheckIn(daily, checks('s1', ['2026-10-15']), '2026-10-15', now, 4)).toEqual({
      ok: false,
      reason: 'already-checked',
    })
  })

  it('weekly cible atteinte : target-reached', () => {
    const data = checks('s1', ['2026-10-12', '2026-10-13', '2026-10-14'], 'weekly')
    expect(validateCheckIn(weekly3, data, '2026-10-15', now, 4)).toEqual({ ok: false, reason: 'target-reached' })
  })

  it('archivée : archived', () => {
    const archived = makeSeries({ archivedAt: '2026-10-01T00:00:00.000Z' })
    expect(validateCheckIn(archived, [], '2026-10-15', now, 4)).toEqual({ ok: false, reason: 'archived' })
  })
})

describe('makeCheckIn / canUndo', () => {
  it('id déterministe et periodKey selon la périodicité', () => {
    const now = at(2026, 10, 15, 10)
    const c = makeCheckIn(weekly3, '2026-10-15', now)
    expect(c).toEqual({
      id: checkInId('s1', '2026-10-15'),
      seriesId: 's1',
      dayKey: '2026-10-15',
      periodKey: '2026-W42',
      confirmedAt: now.toISOString(),
    })
  })

  it('annulable le jour même, plus le lendemain à 00:01', () => {
    const c = makeCheckIn(daily, '2026-10-15', at(2026, 10, 15, 22, 30))
    expect(canUndo(c, at(2026, 10, 15, 23, 59))).toBe(true)
    expect(canUndo(c, at(2026, 10, 16, 0, 1))).toBe(false)
  })
})
