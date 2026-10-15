import Dexie, { type EntityTable } from 'dexie'
import { DB_NAME } from '../../app.config.ts'
import type { CheckIn, Series } from '../domain/types.ts'

export interface MetaRow {
  key: 'profile' | 'settings' | 'reminderLog'
  value: unknown
}

/** Aucune dépendance React/DOM : réutilisé par le service worker. */
export class SeriesDB extends Dexie {
  series!: EntityTable<Series, 'id'>
  checkIns!: EntityTable<CheckIn, 'id'>
  meta!: EntityTable<MetaRow, 'key'>

  constructor(name: string) {
    super(name)
    this.version(1).stores({
      series: 'id, createdAt, archivedAt',
      checkIns: 'id, seriesId, dayKey',
      meta: 'key',
    })
  }
}

export const db = new SeriesDB(DB_NAME)
