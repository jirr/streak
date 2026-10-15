import { buildBackup } from '../domain/backup.ts'
import { parseDayKey, periodKeyOf } from '../domain/periods.ts'
import { DEFAULT_SETTINGS, type Profile, type ReminderLog, type Settings } from '../domain/types.ts'
import type { SeriesDB } from './db.ts'
import type { Repositories } from './repositories.ts'

export function createDexieRepositories(db: SeriesDB): Repositories {
  const getMeta = async <T>(key: 'profile' | 'settings' | 'reminderLog'): Promise<T | undefined> =>
    (await db.meta.get(key))?.value as T | undefined

  const getSettings = async (): Promise<Settings> => ({
    ...DEFAULT_SETTINGS,
    ...(await getMeta<Partial<Settings>>('settings')),
  })

  return {
    series: {
      list: () => db.series.toArray(),
      put: async (s) => {
        await db.series.put(s)
      },
      updatePeriodicity: (s) =>
        db.transaction('rw', db.series, db.checkIns, async () => {
          await db.series.put(s)
          const own = await db.checkIns.where('seriesId').equals(s.id).toArray()
          await db.checkIns.bulkPut(
            own.map((c) => ({ ...c, periodKey: periodKeyOf(s.periodicity, parseDayKey(c.dayKey)) })),
          )
        }),
      delete: (id) =>
        db.transaction('rw', db.series, db.checkIns, async () => {
          await db.checkIns.where('seriesId').equals(id).delete()
          await db.series.delete(id)
        }),
    },

    checkIns: {
      list: () => db.checkIns.toArray(),
      add: async (c) => {
        await db.checkIns.add(c)
      },
      delete: (id) => db.checkIns.delete(id),
    },

    profile: {
      get: async () => (await getMeta<Profile>('profile')) ?? null,
      save: async (p) => {
        await db.meta.put({ key: 'profile', value: p })
      },
    },

    settings: {
      get: getSettings,
      save: async (s) => {
        await db.meta.put({ key: 'settings', value: s })
      },
    },

    reminderLog: {
      get: async () => (await getMeta<ReminderLog>('reminderLog')) ?? {},
      markSent: (ids, dayKey) =>
        db.transaction('rw', db.meta, async () => {
          const log = (await getMeta<ReminderLog>('reminderLog')) ?? {}
          for (const id of ids) log[id] = dayKey
          await db.meta.put({ key: 'reminderLog', value: log })
        }),
    },

    backup: {
      exportAll: async (now) =>
        buildBackup(
          {
            profile: (await getMeta<Profile>('profile')) ?? null,
            settings: await getSettings(),
            series: await db.series.toArray(),
            checkIns: await db.checkIns.toArray(),
          },
          now,
        ),
      replaceAll: (b) =>
        db.transaction('rw', db.series, db.checkIns, db.meta, async () => {
          await Promise.all([db.series.clear(), db.checkIns.clear(), db.meta.clear()])
          await db.series.bulkAdd(b.series)
          await db.checkIns.bulkAdd(b.checkIns)
          await db.meta.put({ key: 'settings', value: b.settings })
          if (b.profile) await db.meta.put({ key: 'profile', value: b.profile })
        }),
      clearAll: () =>
        db.transaction('rw', db.series, db.checkIns, db.meta, async () => {
          await Promise.all([db.series.clear(), db.checkIns.clear(), db.meta.clear()])
        }),
    },
  }
}
