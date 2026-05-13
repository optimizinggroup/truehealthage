// ═══════════════════════════════════════════════════════════════════════════
// PostHog product-analytics wrapper
//
// One place that knows how to talk to PostHog. Other modules call
//   import { track, identify, reset } from '../utils/posthog'
// and never touch the SDK directly. Makes it easy to swap providers, disable
// in tests, and not crash if the SDK fails to load.
//
// Init policy:
//   • Skip entirely inside the Capacitor native shell (file:// origin). Native
//     gets its own analytics path later if we ever want it.
//   • autocapture: false — quiz answers + auth forms have sensitive content.
//     Every event we care about is fired explicitly from code.
//   • capture_heatmaps: false — quiz screens are predictable; not useful.
//   • capture_pageview: false — SPA route changes are state-based, so we
//     fire $pageview manually from App.jsx's phase effect (mirrors GA).
//   • Session replay stays ON (PostHog default) until we have ~1k DAU.
// ═══════════════════════════════════════════════════════════════════════════

import posthog from 'posthog-js'
import { Capacitor } from '@capacitor/core'

const POSTHOG_KEY = 'phc_rUF7RwcRusZapZtbJE8rBsND6rHd8LnsWVWsMhHVm7Sa'
const POSTHOG_HOST = 'https://us.i.posthog.com'

let initialized = false

export function initPostHog() {
  if (initialized) return
  if (typeof window === 'undefined') return
  // Don't run PostHog inside the iOS/Android Capacitor shell.
  if (Capacitor.isNativePlatform()) return

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    defaults: '2026-01-30',
    person_profiles: 'identified_only',
    autocapture: false,
    capture_pageview: false,
    capture_heatmaps: false,
    persistence: 'localStorage+cookie',
    loaded: (ph) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('[PostHog] initialised, distinct_id =', ph.get_distinct_id())
      }
    },
  })
  initialized = true
}

// Tiny safe wrappers — all no-ops if PostHog never initialized
// (Capacitor native, ad-blockers, browser without JS, etc.)

export function track(event, properties = {}) {
  if (!initialized) return
  try { posthog.capture(event, properties) } catch (_) { /* never crash on analytics */ }
}

export function pageview(phase) {
  if (!initialized) return
  try {
    posthog.capture('$pageview', {
      $current_url: typeof window !== 'undefined'
        ? `${window.location.origin}/${phase}`
        : `/${phase}`,
      phase,
    })
  } catch (_) { /* swallow */ }
}

// Attach a Supabase user ID + email to PostHog so anonymous quiz events
// and the signed-in coaching events merge into a single person.
export function identify(userId, traits = {}) {
  if (!initialized || !userId) return
  try { posthog.identify(userId, traits) } catch (_) { /* swallow */ }
}

// Call on sign-out so the next user on the same device starts a new identity.
export function resetIdentity() {
  if (!initialized) return
  try { posthog.reset() } catch (_) { /* swallow */ }
}
