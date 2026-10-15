import type { CheckIn, Series, Settings } from '../domain/types.ts'

export type PermissionState = 'granted' | 'denied' | 'default' | 'unsupported'

export interface ReminderSnapshot {
  series: Series[]
  checkIns: CheckIn[]
  settings: Settings
  now: Date
}

/**
 * Contrat de planification des rappels. L'implémentation web est best effort ;
 * une implémentation Capacitor (notifications locales) pourra la remplacer sans toucher l'UI.
 */
export interface NotificationScheduler {
  getPermission(): PermissionState
  requestPermission(): Promise<PermissionState>
  /** Met à jour le badge et (re)programme les rappels. */
  sync(snapshot: ReminderSnapshot): Promise<void>
  /** Affiche tout de suite une notification de test ; lève une erreur si impossible. */
  sendTest(): Promise<void>
  dispose(): void
}
