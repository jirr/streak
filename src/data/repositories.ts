import type { BackupV1, CheckIn, Profile, ReminderLog, Series, Settings } from '../domain/types.ts'

/**
 * Contrat de persistance : seul point d'entrée de l'UI/du store vers les données.
 * Un futur `httpRepositories.ts` pourra le remplacer sans toucher l'UI.
 */
export interface SeriesRepository {
  list(): Promise<Series[]>
  put(s: Series): Promise<void>
  /** put + réécrit le periodKey de ses check-ins (transaction). */
  updatePeriodicity(s: Series): Promise<void>
  /** Supprime aussi ses check-ins (transaction). */
  delete(id: string): Promise<void>
}

export interface CheckInRepository {
  list(): Promise<CheckIn[]>
  /** Rejette si l'id existe déjà. */
  add(c: CheckIn): Promise<void>
  delete(id: string): Promise<void>
}

export interface ProfileRepository {
  get(): Promise<Profile | null>
  save(p: Profile): Promise<void>
}

export interface SettingsRepository {
  /** Fusionné avec DEFAULT_SETTINGS. */
  get(): Promise<Settings>
  save(s: Settings): Promise<void>
}

export interface ReminderLogRepository {
  get(): Promise<ReminderLog>
  markSent(ids: string[], dayKey: string): Promise<void>
}

export interface BackupRepository {
  exportAll(now: Date): Promise<BackupV1>
  replaceAll(b: BackupV1): Promise<void>
  clearAll(): Promise<void>
}

export interface Repositories {
  series: SeriesRepository
  checkIns: CheckInRepository
  profile: ProfileRepository
  settings: SettingsRepository
  reminderLog: ReminderLogRepository
  backup: BackupRepository
}
