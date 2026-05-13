import { useState } from 'react'
import { Share } from '@capacitor/share'
import { Capacitor } from '@capacitor/core'
import { track as phTrack } from '../utils/posthog'
import '../styles/ShareApp.css'

/**
 * ShareApp — invite-a-friend share card.
 *
 * Different from ShareComponent (which shares the user's results). This
 * shares the APP itself, with no personal data, so users can recommend
 * TrueHealth Age without exposing their health information.
 *
 * Uses the native iOS / Android share sheet via @capacitor/share when running
 * inside the Capacitor app — that gives the user every social/messaging app
 * installed on their device (Messages, WhatsApp, Instagram, Facebook, X,
 * email, Slack, etc.). Falls back to the Web Share API on supported browsers,
 * and a copy-to-clipboard button as the final fallback.
 */
export default function ShareApp({ variant = 'card' }) {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)

  const shareUrl = 'https://truehealthage.com'
  const shareTitle = 'TrueHealth Age — find out how your habits are aging you'
  const shareText = `I tried TrueHealth Age — it's a free app that gave me a clear, honest read on how my daily habits are aging me, plus a simple plan to do something about it. No fluff, no upsells. Try it: ${shareUrl}`

  const handleShare = async () => {
    setError(null)

    try {
      // Native Capacitor share — best UX on iOS / Android
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
          dialogTitle: 'Share TrueHealth Age',
        })
        phTrack('share_clicked', { method: 'native', source: 'share_app_card' })
        return
      }

      // Web Share API — supported on most mobile browsers and Safari on Mac
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
        phTrack('share_clicked', { method: 'web_share_api', source: 'share_app_card' })
        return
      }

      // Final fallback — copy to clipboard
      await navigator.clipboard.writeText(`${shareText}`)
      setCopied(true)
      phTrack('share_clicked', { method: 'clipboard_auto', source: 'share_app_card' })
      setTimeout(() => setCopied(false), 2200)
    } catch (err) {
      // User cancelling the share sheet throws AbortError on web — ignore that
      if (err?.name === 'AbortError') return
      setError('Could not open the share menu. You can copy the link instead.')
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      phTrack('share_clicked', { method: 'clipboard_button', source: 'share_app_card' })
      setTimeout(() => setCopied(false), 2200)
    } catch (_) {
      setError('Clipboard is blocked in this browser. Long-press the link to copy.')
    }
  }

  return (
    <div className={`share-app share-app--${variant}`}>
      <div className="share-app-content">
        <h3>Know someone who'd benefit from this?</h3>
        <p className="share-app-pitch">
          TrueHealth Age is a free app that gave me a clear, honest read on how my daily habits are aging me — plus a simple plan to do something about it. If you have a friend, family member, or teammate who's been meaning to take their health seriously, send it their way. It might be the nudge they need.
        </p>

        <div className="share-app-actions">
          <button
            type="button"
            className="share-app-btn primary"
            onClick={handleShare}
          >
            📤 Share with a friend
          </button>
          <button
            type="button"
            className="share-app-btn secondary"
            onClick={handleCopy}
          >
            {copied ? '✓ Copied!' : 'Copy link'}
          </button>
        </div>

        {error && <p className="share-app-error">{error}</p>}

        <p className="share-app-note">
          Sharing the app — not your results. No personal health information is shared.
        </p>
      </div>
    </div>
  )
}
