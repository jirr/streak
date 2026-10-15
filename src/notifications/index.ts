import type { NotificationScheduler } from './NotificationScheduler.ts'
import { WebNotificationScheduler } from './WebNotificationScheduler.ts'

export const scheduler: NotificationScheduler = new WebNotificationScheduler()
