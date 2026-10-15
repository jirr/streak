import { repos } from '../data/index.ts'
import { nextReminderAt, uncheckedToday } from '../domain/reminders.ts'
import type { NotificationScheduler, PermissionState, ReminderSnapshot } from './NotificationScheduler.ts'
import { notificationOptions, runReminderCheck } from './reminderRunner.ts'

const MAX_TIMEOUT = 2 ** 31 - 1
const PERIODIC_TAG = 'series-reminder'
const PERIODIC_MIN_INTERVAL = 60 * 60 * 1000

type BadgeNavigator = Navigator & {
  setAppBadge?: (n?: number) => Promise<void>
  clearAppBadge?: () => Promise<void>
}

/** Rappels web « best effort » : timer tant que la page vit, Periodic Background Sync sur Chromium installé. */
export class WebNotificationScheduler implements NotificationScheduler {
  private timer: ReturnType<typeof setTimeout> | undefined
  private periodicRegistered = false

  getPermission(): PermissionState {
    return 'Notification' in window ? Notification.permission : 'unsupported'
  }

  async requestPermission(): Promise<PermissionState> {
    if (!('Notification' in window)) return 'unsupported'
    const result = await Notification.requestPermission()
    if (result === 'granted') await this.registerPeriodicSync()
    return result
  }

  async sync(snapshot: ReminderSnapshot): Promise<void> {
    const { series, checkIns, settings, now } = snapshot
    const unchecked = uncheckedToday(series, checkIns, now, settings.graceHour).length
    const nav = navigator as BadgeNavigator
    try {
      if (unchecked > 0) await nav.setAppBadge?.(unchecked)
      else await nav.clearAppBadge?.()
    } catch {
      /* badge non supporté : ignoré */
    }
    document.title = unchecked > 0 ? `(${unchecked}) Séries` : 'Séries'

    clearTimeout(this.timer)
    if (this.getPermission() !== 'granted') return
    void this.registerPeriodicSync()
    const at = nextReminderAt(series, now, settings.remindersEnabled)
    if (at) {
      const delay = Math.min(at.getTime() - now.getTime() + 500, MAX_TIMEOUT)
      this.timer = setTimeout(() => void this.fire(), delay)
    }
  }

  dispose(): void {
    clearTimeout(this.timer)
  }

  private async fire(): Promise<void> {
    try {
      const registration = await navigator.serviceWorker?.getRegistration()
      await runReminderCheck(repos, new Date(), async (n) => {
        if (registration) await registration.showNotification(n.title, notificationOptions(n, registration.scope))
        else new Notification(n.title, { body: n.body, tag: n.tag })
      })
    } catch (e) {
      console.warn('Rappel non affiché', e)
    }
    // Se reprogramme avec des données fraîches.
    const [series, checkIns, settings] = await Promise.all([repos.series.list(), repos.checkIns.list(), repos.settings.get()])
    await this.sync({ series, checkIns, settings, now: new Date() })
  }

  private async registerPeriodicSync(): Promise<void> {
    if (this.periodicRegistered) return
    try {
      const registration = await navigator.serviceWorker?.getRegistration()
      if (!registration?.periodicSync) return
      const status = await navigator.permissions.query({ name: 'periodic-background-sync' as PermissionName })
      if (status.state !== 'granted') return
      await registration.periodicSync.register(PERIODIC_TAG, { minInterval: PERIODIC_MIN_INTERVAL })
      this.periodicRegistered = true
    } catch {
      /* best effort */
    }
  }
}
