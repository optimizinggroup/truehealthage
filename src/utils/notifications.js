// ═══════════════════════════════════════════════════════════════════════════
// TrueHealthAge — Local notifications (Capacitor native only)
//
// Schedules weekly check-in reminders + daily nudges on the user's device.
// Uses @capacitor/local-notifications, which only works inside the iOS or
// Android app — on the web this module is a no-op.
//
// Notification IDs:
//   - 1000+: weekly check-in reminders, one per active protocol
//   - 2000+: daily nudges (morning, anchor habit) — single repeating
//
// Usage:
//   import { ensureNotificationPermission, scheduleWeeklyCheckin,
//            scheduleDailyNudge, clearAllScheduled }
//     from '../utils/notifications'
// ═══════════════════════════════════════════════════════════════════════════

import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'

const isNative = () => Capacitor.isNativePlatform()

export async function ensureNotificationPermission() {
  if (!isNative()) return { granted: false, reason: 'web' }
  const status = await LocalNotifications.checkPermissions()
  if (status.display === 'granted') return { granted: true }
  const ask = await LocalNotifications.requestPermissions()
  return { granted: ask.display === 'granted', display: ask.display }
}

// Schedule a weekly check-in reminder for an active protocol.
// Fires every 7 days at the user's chosen local time (default 9am).
//   protocolId: numeric — used to derive a stable notification id
//   protocolName: e.g. "Sleep & Recovery" — appears in the notification body
//   hour: 0-23, default 9
export async function scheduleWeeklyCheckin({ protocolId, protocolName, hour = 9 }) {
  if (!isNative()) return
  const id = 1000 + (protocolId % 1000)

  // Cancel any previous schedule for this id so we don't stack duplicates
  await LocalNotifications.cancel({ notifications: [{ id }] }).catch(() => {})

  const now = new Date()
  // First fire: next occurrence of the chosen hour, then +7 days each.
  const firstFire = new Date(now)
  firstFire.setHours(hour, 0, 0, 0)
  if (firstFire <= now) firstFire.setDate(firstFire.getDate() + 1)

  await LocalNotifications.schedule({
    notifications: [{
      id,
      title: 'Weekly check-in time',
      body: `How did this week go with ${protocolName}? It only takes 30 seconds.`,
      schedule: {
        at: firstFire,
        every: 'week',
        allowWhileIdle: true,
      },
      sound: undefined,
      smallIcon: 'ic_stat_notify',
    }],
  })
}

// A daily nudge — fires once per day at the chosen hour.
// Stays generic so we don't need to know which task they're working on today.
export async function scheduleDailyNudge({ hour = 8 }) {
  if (!isNative()) return
  const id = 2000

  await LocalNotifications.cancel({ notifications: [{ id }] }).catch(() => {})

  const firstFire = new Date()
  firstFire.setHours(hour, 0, 0, 0)
  if (firstFire <= new Date()) firstFire.setDate(firstFire.getDate() + 1)

  await LocalNotifications.schedule({
    notifications: [{
      id,
      title: 'One small thing today',
      body: 'Open TrueHealth Age — your three actions take 5 minutes.',
      schedule: {
        at: firstFire,
        every: 'day',
        allowWhileIdle: true,
      },
      smallIcon: 'ic_stat_notify',
    }],
  })
}

export async function clearAllScheduled() {
  if (!isNative()) return
  const { notifications } = await LocalNotifications.getPending()
  if (notifications.length === 0) return
  await LocalNotifications.cancel({
    notifications: notifications.map(n => ({ id: n.id })),
  })
}
