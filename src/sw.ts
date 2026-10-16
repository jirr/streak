/// <reference lib="webworker" />
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { db } from './data/db.ts'
import { createDexieRepositories } from './data/dexieRepositories.ts'
import { notificationOptions, runReminderCheck } from './notifications/reminderRunner.ts'

declare let self: ServiceWorkerGlobalScope

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

self.addEventListener('message', (e) => {
  if (e.data?.type === 'SKIP_WAITING') void self.skipWaiting()
})

async function checkReminders(): Promise<void> {
  const { unchecked } = await runReminderCheck(createDexieRepositories(db), new Date(), (n) =>
    self.registration.showNotification(n.title, notificationOptions(n, self.registration.scope)),
    self.navigator.languages?.length ? self.navigator.languages : [self.navigator.language],
  )
  const nav = self.navigator as WorkerNavigator & {
    setAppBadge?: (n?: number) => Promise<void>
    clearAppBadge?: () => Promise<void>
  }
  if (unchecked > 0) await nav.setAppBadge?.(unchecked)
  else await nav.clearAppBadge?.()
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'series-reminder') event.waitUntil(checkReminders())
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const existing = windows.find((c) => c.url.startsWith(self.registration.scope))
      if (existing) await existing.focus()
      else await self.clients.openWindow(self.registration.scope)
    })(),
  )
})
