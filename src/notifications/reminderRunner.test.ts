import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SeriesDB } from '../data/db.ts'
import { createDexieRepositories } from '../data/dexieRepositories.ts'
import { at, checks, makeSeries } from '../test/fixtures.ts'
import { notificationOptions, runReminderCheck } from './reminderRunner.ts'

const repos = createDexieRepositories(new SeriesDB('series-app-reminder-test'))
const evening = at(2026, 10, 15, 21, 30)

beforeEach(async () => {
  await repos.backup.clearAll()
  await repos.series.put(makeSeries({ id: 's1' }))
})

describe('runReminderCheck', () => {
  it('notifie une fois par jour et journalise', async () => {
    const show = vi.fn(async () => {})
    expect(await runReminderCheck(repos, evening, show, ['fr-FR'])).toEqual({ shown: 1, unchecked: 1 })
    expect(show).toHaveBeenCalledTimes(1)
    expect(show).toHaveBeenCalledWith(expect.objectContaining({ tag: 'series-reminder', body: expect.stringContaining('Sans alcool') }))
    expect(await repos.reminderLog.get()).toEqual({ s1: '2026-10-15' })

    expect(await runReminderCheck(repos, at(2026, 10, 15, 22), show, ['fr-FR'])).toEqual({ shown: 0, unchecked: 1 })
    expect(show).toHaveBeenCalledTimes(1)
  })

  it('ne notifie pas une série déjà cochée ; badge à 0', async () => {
    for (const c of checks('s1', ['2026-10-15'])) await repos.checkIns.add(c)
    const show = vi.fn(async () => {})
    expect(await runReminderCheck(repos, evening, show, ['fr-FR'])).toEqual({ shown: 0, unchecked: 0 })
    expect(show).not.toHaveBeenCalled()
  })

  it('ne journalise pas si l’affichage échoue (le rappel pourra être retenté)', async () => {
    const show = vi.fn(async () => {
      throw new Error('boom')
    })
    await expect(runReminderCheck(repos, evening, show, ['fr-FR'])).rejects.toThrow('boom')
    expect(await repos.reminderLog.get()).toEqual({})
  })

  it('langue : réglage explicite prioritaire, sinon langue système', async () => {
    const show = vi.fn(async () => {})
    await runReminderCheck(repos, evening, show, ['en-US'])
    expect(show).toHaveBeenLastCalledWith(expect.objectContaining({ title: "You haven't checked in yet today" }))

    await repos.backup.clearAll()
    await repos.series.put(makeSeries({ id: 's1' }))
    await repos.settings.save({ ...(await repos.settings.get()), language: 'fr' })
    await runReminderCheck(repos, evening, show, ['en-US'])
    expect(show).toHaveBeenLastCalledWith(expect.objectContaining({ title: "Tu n'as pas encore coché aujourd'hui" }))
  })
})

describe('notificationOptions', () => {
  it('icône et url relatives à la portée du SW', () => {
    const o = notificationOptions({ title: 't', body: 'b', tag: 'x' }, 'https://jirr.github.io/streak/')
    expect(o.icon).toBe('https://jirr.github.io/streak/pwa-192x192.png')
    expect(o.data).toEqual({ url: 'https://jirr.github.io/streak/' })
  })
})
