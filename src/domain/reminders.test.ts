import { describe, expect, it } from 'vitest'
import { at, checks, makeSeries } from '../test/fixtures.ts'
import { computeStats } from './streaks.ts'
import { buildReminderNotification, dueReminders, nextReminderAt, uncheckedToday } from './reminders.ts'

const s = makeSeries()
const evening = at(2026, 10, 15, 21, 30)

describe('dueReminders', () => {
  it('avant l’heure : []', () => {
    expect(dueReminders([s], [], at(2026, 10, 15, 20, 59), 4, {}, true)).toEqual([])
  })
  it('après l’heure : la série', () => {
    expect(dueReminders([s], [], evening, 4, {}, true)).toEqual([s])
  })
  it('déjà cochée : []', () => {
    expect(dueReminders([s], checks('s1', ['2026-10-15']), evening, 4, {}, true)).toEqual([])
  })
  it('déjà notifiée aujourd’hui : []', () => {
    expect(dueReminders([s], [], evening, 4, { s1: '2026-10-15' }, true)).toEqual([])
    expect(dueReminders([s], [], evening, 4, { s1: '2026-10-14' }, true)).toEqual([s])
  })
  it('rappel désactivé / archivée / interrupteur global coupé : []', () => {
    expect(dueReminders([makeSeries({ reminder: { enabled: false, time: '21:00' } })], [], evening, 4, {}, true)).toEqual([])
    expect(dueReminders([makeSeries({ archivedAt: '2026-10-01T00:00:00.000Z' })], [], evening, 4, {}, true)).toEqual([])
    expect(dueReminders([s], [], evening, 4, {}, false)).toEqual([])
  })
  it('pas de rappel pour « hier » à sauver (avant la fin de la grâce)', () => {
    const lateNight = at(2026, 10, 15, 3)
    const early = makeSeries({ reminder: { enabled: true, time: '00:30' } })
    expect(dueReminders([early], [], lateNight, 4, {}, true)).toEqual([])
  })
})

describe('uncheckedToday', () => {
  it('liste les séries avec quelque chose à cocher', () => {
    const done = makeSeries({ id: 's2' })
    const data = checks('s2', ['2026-10-15'])
    expect(uncheckedToday([s, done], data, at(2026, 10, 15, 10), 4)).toEqual([s])
  })
})

describe('nextReminderAt', () => {
  const a = makeSeries({ id: 'a', reminder: { enabled: true, time: '21:00' } })
  const b = makeSeries({ id: 'b', reminder: { enabled: true, time: '18:00' } })
  it('choisit le plus proche aujourd’hui', () => {
    expect(nextReminderAt([a, b], at(2026, 10, 15, 10), true)).toEqual(at(2026, 10, 15, 18))
  })
  it('bascule à demain si toutes passées', () => {
    expect(nextReminderAt([a, b], at(2026, 10, 15, 22), true)).toEqual(at(2026, 10, 16, 18))
  })
  it('null sans rappel actif', () => {
    expect(nextReminderAt([makeSeries({ reminder: { enabled: false, time: '21:00' } })], at(2026, 10, 15), true)).toBeNull()
    expect(nextReminderAt([a], at(2026, 10, 15), false)).toBeNull()
    expect(nextReminderAt([makeSeries({ archivedAt: '2026-01-01T00:00:00.000Z' })], at(2026, 10, 15), true)).toBeNull()
  })
})

describe('buildReminderNotification', () => {
  it('1 série : titre, corps avec compteur', () => {
    const data = checks('s1', ['2026-10-13', '2026-10-14'])
    const stats = new Map([['s1', computeStats(s, data, evening, 4)]])
    expect(buildReminderNotification([s], stats, 'fr')).toEqual({
      title: "Tu n'as pas encore coché aujourd'hui",
      body: "« Sans alcool » t'attend. 2 jours, ne lâche rien.",
      tag: 'series-reminder',
    })
  })
  it('plusieurs séries : message groupé', () => {
    const n = buildReminderNotification([s, makeSeries({ id: 's2' })], new Map(), 'fr')
    expect(n.body).toBe('2 séries t\'attendent. Deux “oui” et c\'est réglé.')
  })
  it('stats absentes : 0 jour', () => {
    expect(buildReminderNotification([s], new Map(), 'fr').body).toContain('0 jour,')
  })
  it('anglais : titre et corps', () => {
    const data = checks('s1', ['2026-10-14'])
    const stats = new Map([['s1', computeStats(s, data, evening, 4)]])
    expect(buildReminderNotification([s], stats, 'en')).toEqual({
      title: "You haven't checked in yet today",
      body: '“Sans alcool” is waiting. 1 day, don\'t let go.',
      tag: 'series-reminder',
    })
    expect(buildReminderNotification([s, s], stats, 'en').body).toBe('2 streaks are waiting. Two “yes” and you\'re done.')
  })
})
