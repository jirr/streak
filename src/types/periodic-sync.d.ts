// Periodic Background Sync (Chromium) : absent des lib.dom / lib.webworker de TypeScript.

interface PeriodicSyncManager {
  register(tag: string, options?: { minInterval?: number }): Promise<void>
  unregister(tag: string): Promise<void>
  getTags(): Promise<string[]>
}

interface ServiceWorkerRegistration {
  periodicSync?: PeriodicSyncManager
}

interface PeriodicSyncEvent extends ExtendableEvent {
  readonly tag: string
}

interface ServiceWorkerGlobalScopeEventMap {
  periodicsync: PeriodicSyncEvent
}
