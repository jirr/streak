import { describe, expect, it } from 'vitest'
import { at, checks, makeSeries, range } from '../test/fixtures.ts'
import { computeStats } from './streaks.ts'

const NOW = at(2026, 10, 15, 10)
const daily = makeSeries()

describe('computeStats — daily', () => {
  it('sans check-in : 0 / 0 / pending', () => {
    const s = computeStats(daily, [], NOW, 4)
    expect(s).toMatchObject({ current: 0, best: 0, status: 'pending', checkedToday: false })
    expect(s.runs).toEqual([])
  })

  it('8 jours consécutifs jusqu’à aujourd’hui : 8, done', () => {
    const s = computeStats(daily, checks('s1', range('2026-10-08', 8)), NOW, 4)
    expect(s).toMatchObject({ current: 8, best: 8, status: 'done', checkedToday: true })
    expect(s.runs[0].active).toBe(true)
  })

  it('aujourd’hui non coché, 5 jours jusqu’à hier : 5, pending', () => {
    const s = computeStats(daily, checks('s1', range('2026-10-10', 5)), NOW, 4)
    expect(s).toMatchObject({ current: 5, status: 'pending', checkedToday: false })
  })

  it('hier manquant : la série retombe à 0 mais best est conservé', () => {
    const s = computeStats(daily, checks('s1', range('2026-10-11', 3)), NOW, 4)
    expect(s).toMatchObject({ current: 0, best: 3, status: 'pending' })
    expect(s.runs[0].active).toBe(false)
  })

  it('fenêtre de grâce : 02:00 → atRisk, 04:00 → perdu, graceHour 0 → perdu', () => {
    const data = checks('s1', range('2026-10-10', 4)) // jusqu'au 13
    expect(computeStats(daily, data, at(2026, 10, 15, 2), 4)).toMatchObject({ current: 4, status: 'atRisk' })
    expect(computeStats(daily, data, at(2026, 10, 15, 4), 4)).toMatchObject({ current: 0, status: 'pending' })
    expect(computeStats(daily, data, at(2026, 10, 15, 2), 0)).toMatchObject({ current: 0, status: 'pending' })
  })

  it('grâce : hier coché → la série continue normalement', () => {
    const data = checks('s1', range('2026-10-10', 5)) // jusqu'au 14
    expect(computeStats(daily, data, at(2026, 10, 15, 2), 4)).toMatchObject({ current: 5, status: 'pending' })
  })

  it('best = plus longue suite historique', () => {
    const data = checks('s1', [...range('2026-05-01', 33), ...range('2026-10-08', 8)])
    const s = computeStats(daily, data, NOW, 4)
    expect(s).toMatchObject({ best: 33, current: 8 })
    expect(s.runs).toHaveLength(2)
    expect(s.runs[0]).toMatchObject({ length: 33, startDayKey: '2026-05-01', endDayKey: '2026-06-02', active: false })
    expect(s.runs[1].active).toBe(true)
  })

  it('ignore les check-ins des autres séries', () => {
    const s = computeStats(daily, checks('autre', range('2026-10-08', 8)), NOW, 4)
    expect(s.current).toBe(0)
  })

  it('DST Paris : aucune rupture autour des changements d’heure', () => {
    const spring = computeStats(daily, checks('s1', range('2026-03-27', 5)), at(2026, 3, 31), 4)
    expect(spring.current).toBe(5)
    const autumn = computeStats(daily, checks('s1', range('2026-10-23', 5)), at(2026, 10, 27), 4)
    expect(autumn.current).toBe(5)
  })
})

describe('computeStats — weekly / monthly', () => {
  it('weekly cible 1 à travers l’année ISO (2026-W52 → W53 → 2027-W01)', () => {
    const weekly = makeSeries({ periodicity: 'weekly' })
    const data = checks('s1', ['2026-12-23', '2026-12-30', '2027-01-05'], 'weekly')
    const s = computeStats(weekly, data, at(2027, 1, 6), 4)
    expect(s).toMatchObject({ current: 3, status: 'done' })
    expect(s.runs[0]).toMatchObject({ startPeriodKey: '2026-W52', endPeriodKey: '2027-W01' })
  })

  const weekly3 = makeSeries({ periodicity: 'weekly', target: 3 })
  const prevWeeks = [
    ...['2026-09-21', '2026-09-23', '2026-09-25'], // W39
    ...['2026-09-28', '2026-09-30', '2026-10-02'], // W40
    ...['2026-10-05', '2026-10-07', '2026-10-09'], // W41
  ]

  it('weekly cible 3 : 3 semaines validées, 2/3 cette semaine → pending', () => {
    const data = checks('s1', [...prevWeeks, '2026-10-12', '2026-10-13'], 'weekly')
    const s = computeStats(weekly3, data, NOW, 4)
    expect(s).toMatchObject({ current: 3, status: 'pending', progress: { count: 2, target: 3 } })
  })

  it('weekly cible 3 : une semaine à 2/3 casse la suite', () => {
    const broken = prevWeeks.filter((d) => d !== '2026-10-02') // W40 à 2/3
    const s = computeStats(weekly3, checks('s1', broken, 'weekly'), NOW, 4)
    expect(s).toMatchObject({ current: 1, best: 1 })
  })

  it('weekly : cible atteinte cette semaine → done', () => {
    const data = checks('s1', [...prevWeeks, '2026-10-12', '2026-10-13', '2026-10-14'], 'weekly')
    expect(computeStats(weekly3, data, NOW, 4)).toMatchObject({ current: 4, status: 'done' })
  })

  it('weekly : lundi avant l’heure de grâce, semaine précédente non validée → atRisk', () => {
    const data = checks('s1', ['2026-09-30', '2026-10-02', '2026-10-04', '2026-10-05'], 'weekly')
    // lundi 12 oct 02:00 ; W41 à 1/3 (Oct 5), W40 validée (3 jours)
    const s = computeStats(weekly3, data, at(2026, 10, 12, 2), 4)
    expect(s).toMatchObject({ current: 1, status: 'atRisk' })
  })

  it('daily : target ignoré', () => {
    const d = makeSeries({ target: 5 })
    expect(computeStats(d, checks('s1', ['2026-10-15']), NOW, 4)).toMatchObject({
      current: 1,
      progress: { count: 1, target: 1 },
    })
  })

  it('monthly cible 1 : 2026-11, 2026-12, 2027-01 → 3', () => {
    const monthly = makeSeries({ periodicity: 'monthly' })
    const data = checks('s1', ['2026-11-10', '2026-12-03', '2027-01-15'], 'monthly')
    expect(computeStats(monthly, data, at(2027, 1, 20), 4)).toMatchObject({ current: 3, status: 'done' })
  })

  it('monthly : le 1er avant la grâce, mois précédent non validé → atRisk', () => {
    const monthly = makeSeries({ periodicity: 'monthly' })
    const data = checks('s1', ['2026-08-10', '2026-09-03'], 'monthly')
    expect(computeStats(monthly, data, at(2026, 11, 1, 2), 4)).toMatchObject({ current: 2, status: 'atRisk' })
  })

  it('monthly : le 2 du mois, le mois précédent manque → perdu', () => {
    const monthly = makeSeries({ periodicity: 'monthly' })
    const data = checks('s1', ['2026-08-10', '2026-09-03'], 'monthly')
    expect(computeStats(monthly, data, at(2026, 11, 2, 2), 4)).toMatchObject({ current: 0 })
  })
})

describe('computeStats — archivée', () => {
  it('runs conservés, current 0, aucun run actif', () => {
    const archived = makeSeries({ archivedAt: '2026-10-10T12:00:00.000Z' })
    const data = checks('s1', [...range('2026-01-01', 10), ...range('2026-10-05', 5)])
    const s = computeStats(archived, data, NOW, 4)
    expect(s).toMatchObject({ current: 0, best: 10, status: 'pending' })
    expect(s.runs).toHaveLength(2)
    expect(s.runs.every((r) => !r.active)).toBe(true)
  })
})
