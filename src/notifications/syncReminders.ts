import { useAppStore } from '../app/store.ts'
import { scheduler } from './index.ts'

/** Pousse l'état courant vers le scheduler (badge + programmation). */
export function syncReminders(): Promise<void> {
  const { status, series, checkIns, settings } = useAppStore.getState()
  if (status === 'loading') return Promise.resolve()
  return scheduler.sync({ series, checkIns, settings, now: new Date() })
}

/** À appeler une fois au démarrage : après init, après chaque mutation, au retour au premier plan. */
export function startReminderSync(): void {
  useAppStore.subscribe((state, prev) => {
    if (
      state.status !== prev.status ||
      state.series !== prev.series ||
      state.checkIns !== prev.checkIns ||
      state.settings !== prev.settings
    ) {
      void syncReminders()
    }
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncReminders()
  })
}
