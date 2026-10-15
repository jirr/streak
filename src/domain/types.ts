export type SeriesKind = 'abstinence' | 'habit'
export type Periodicity = 'daily' | 'weekly' | 'monthly'
export type TintKey = 'orange' | 'beige' | 'blue' | 'green' | 'purple' | 'yellow'
export type Gender = 'female' | 'male' | 'other' | 'unspecified'

export const TINT_KEYS: TintKey[] = ['orange', 'beige', 'blue', 'green', 'purple', 'yellow']

export interface Reminder {
  enabled: boolean
  /** 'HH:mm', défaut '21:00' */
  time: string
}

export interface Series {
  id: string
  /** 1–60 caractères après trim */
  title: string
  /** un seul emoji (graphème) */
  icon: string
  /** défaut 'orange' */
  color?: TintKey
  kind: SeriesKind
  periodicity: Periodicity
  /** nb de JOURS cochés requis par période ; ignoré pour daily (=1) ; défaut 1 */
  target?: number
  reminder: Reminder
  /** ISO */
  createdAt: string
  /** ISO (future sync) */
  updatedAt: string
  /** ISO */
  archivedAt?: string
  presetId?: string
}

export interface CheckIn {
  /** `${seriesId}|${dayKey}` */
  id: string
  seriesId: string
  /** 'yyyy-MM-dd' local — SOURCE DE VÉRITÉ du calcul */
  dayKey: string
  /** '2026-10-15' | '2026-W42' | '2026-10' (dénormalisé) */
  periodKey: string
  /** ISO */
  confirmedAt: string
}

export interface Profile {
  id: string
  /** 1–30 après trim */
  pseudo: string
  gender?: Gender
  /** facultatif : sert à s'envoyer ses sauvegardes par mail */
  email?: string
  /** futur : 'apple' | 'google' | 'email' */
  authProvider: 'local'
  createdAt: string
}

export interface Settings {
  /** 0 (désactivé) à 6 ; défaut 4 */
  graceHour: number
  /** interrupteur global ; défaut true */
  remindersEnabled: boolean
  /** invite post-1re-série déjà montrée ; défaut false */
  notificationsPrompted: boolean
  /** défaut 'grid' */
  viewMode: 'grid' | 'list'
  lastBackupAt?: string
  backupNudgeDismissedAt?: string
  /** défaut false */
  installNudgeDismissed: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  graceHour: 4,
  remindersEnabled: true,
  notificationsPrompted: false,
  viewMode: 'grid',
  installNudgeDismissed: false,
}

export interface Run {
  seriesId: string
  startPeriodKey: string
  endPeriodKey: string
  startDayKey: string
  endDayKey: string
  length: number
  active: boolean
}

export type StreakStatus = 'done' | 'pending' | 'atRisk'

export interface SeriesStats {
  current: number
  best: number
  status: StreakStatus
  /** période en cours */
  progress: { count: number; target: number }
  checkedToday: boolean
  /** ordre chronologique */
  runs: Run[]
}

export interface BackupV1 {
  app: 'series'
  schemaVersion: 1
  exportedAt: string
  profile: Profile | null
  settings: Settings
  series: Series[]
  checkIns: CheckIn[]
}

/** Journal des rappels envoyés : seriesId → dernier dayKey notifié. */
export type ReminderLog = Record<string, string>
