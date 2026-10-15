import { beforeEach, describe, expect, it } from 'vitest'
import { checks, makeSeries, range } from '../test/fixtures.ts'
import { buildBackup } from '../domain/backup.ts'
import { DEFAULT_SETTINGS } from '../domain/types.ts'
import { SeriesDB } from './db.ts'
import { createDexieRepositories } from './dexieRepositories.ts'

const db = new SeriesDB('series-app-test')
const repos = createDexieRepositories(db)

beforeEach(async () => {
  await repos.backup.clearAll()
})

describe('dexie repositories', () => {
  it('supprimer une série supprime ses check-ins (et pas ceux des autres)', async () => {
    await repos.series.put(makeSeries({ id: 'a' }))
    await repos.series.put(makeSeries({ id: 'b' }))
    for (const c of [...checks('a', range('2026-10-01', 3)), ...checks('b', range('2026-10-01', 2))]) {
      await repos.checkIns.add(c)
    }
    await repos.series.delete('a')
    expect((await repos.series.list()).map((s) => s.id)).toEqual(['b'])
    expect((await repos.checkIns.list()).map((c) => c.seriesId)).toEqual(['b', 'b'])
  })

  it('rejette un check-in en doublon', async () => {
    const [c] = checks('a', ['2026-10-01'])
    await repos.checkIns.add(c)
    await expect(repos.checkIns.add(c)).rejects.toMatchObject({ name: 'ConstraintError' })
    expect(await repos.checkIns.list()).toHaveLength(1)
  })

  it('settings.get() sans données renvoie les défauts, et fusionne les champs manquants', async () => {
    expect(await repos.settings.get()).toEqual(DEFAULT_SETTINGS)
    await db.meta.put({ key: 'settings', value: { graceHour: 2 } })
    expect(await repos.settings.get()).toEqual({ ...DEFAULT_SETTINGS, graceHour: 2 })
  })

  it('replaceAll puis exportAll restitue les mêmes données, en écrasant l’existant', async () => {
    await repos.series.put(makeSeries({ id: 'old' }))
    const profile = { id: 'p', pseudo: 'Baptiste', authProvider: 'local' as const, createdAt: '2026-01-01T00:00:00.000Z' }
    const data = buildBackup(
      {
        profile,
        settings: { ...DEFAULT_SETTINGS, viewMode: 'list' },
        series: [makeSeries({ id: 'a' }), makeSeries({ id: 'b', periodicity: 'weekly', target: 3 })],
        checkIns: checks('a', range('2026-10-01', 3)),
      },
      new Date(2026, 9, 15),
    )
    await repos.backup.replaceAll(data)
    const out = await repos.backup.exportAll(new Date(2026, 9, 15))
    expect(out).toEqual(data)
  })

  it('updatePeriodicity daily → weekly réécrit les periodKey en RRRR-\'W\'II', async () => {
    const s = makeSeries({ id: 'a' })
    await repos.series.put(s)
    for (const c of checks('a', ['2026-10-12', '2026-10-15'])) await repos.checkIns.add(c)
    await repos.series.updatePeriodicity({ ...s, periodicity: 'weekly', target: 3 })
    expect((await repos.checkIns.list()).map((c) => c.periodKey)).toEqual(['2026-W42', '2026-W42'])
    expect((await repos.series.list())[0]).toMatchObject({ periodicity: 'weekly', target: 3 })
  })

  it('journal de rappels : markSent cumule par série', async () => {
    await repos.reminderLog.markSent(['a'], '2026-10-14')
    await repos.reminderLog.markSent(['b'], '2026-10-15')
    expect(await repos.reminderLog.get()).toEqual({ a: '2026-10-14', b: '2026-10-15' })
  })

  it('profil : null puis sauvegardé', async () => {
    expect(await repos.profile.get()).toBeNull()
    const profile = { id: 'p', pseudo: 'B', authProvider: 'local' as const, createdAt: '2026-01-01T00:00:00.000Z' }
    await repos.profile.save(profile)
    expect(await repos.profile.get()).toEqual(profile)
  })
})
