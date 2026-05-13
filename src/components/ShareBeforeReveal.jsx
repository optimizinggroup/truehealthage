import { useEffect, useState } from 'react'
import { Share } from '@capacitor/share'
import { Capacitor } from '@capacitor/core'
import { track as phTrack } from '../utils/posthog'
import '../styles/ShareBeforeReveal.css'

/**
 * ShareBeforeReveal — gentle pre-reveal share prompt.
 *
 * Shown ONE time, for first-time signups only, between EmailCapture and
 * Phase1Results. The user has just created an account — their number is the
 * next click. The single highest-leverage thing they can do with this
 * assessment is forward it to one person who'd benefit; this screen makes
 * that ask without forcing it.
 *
 *   • Headline: "One ask before you see your number."
 *   • Share uses the same native share / Web Share API / clipboard fallback
 *     as ShareApp, with copy framed BEFORE results are revealed (so we don't
 *     reference "my True Health Age was X" since the user hasn't seen it).
 *   • Skip is always one tap away — no friction, no guilt.
 *
 * PostHog: fires three events so we can measure conversion uplift later.
 *   share_before_reveal_shown    — every time the screen renders
 *   share_before_reveal_shared   — user actually completed a share action
 *   share_before_reveal_skipped  — user clicked Skip
 */
export default function ShareBeforeReveal({ onContinue }) {
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(null)

  const shareUrl = 'https://truehealthage.com'
  const shareTitle = 'TrueHealth Age — find out how your habits are aging you'
  const shareText = `TrueHealth Age — free assessment, 5 minutes, a real read on how your habits are actually aging you. From Coach K (40 years coaching health and longevity). Take yours: ${shareUrl}`

  // Fire the "shown" event exactly once on mount
  useEffect(() => {
    phTrack('share_before_reveal_shown')
  }, [])

  const advance = (action, method = null) => {
    if (action === 'shared') phTrack('share_before_reveal_shared', { method })
    if (action === 'skipped') phTrack('share_before_reveal_skipped')
    onContinue()
  }

  const handleShare = async () => {
    setError(null)
    setBusy(true)
    try {
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
          dialogTitle: 'Share TrueHealth Age',
        })
        advance('shared', 'native')
        return
      }
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl })
        advance('shared', 'web_share_api')
        return
      }
      // Final fallback — copy to clipboard, show toast, advance after a beat
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => advance('shared', 'clipboard_auto'), 1100)
    } catch (err) {
      // User cancelled the OS share sheet → don't advance, let them try again or skip
      if (err?.name === 'AbortError') {
        setBusy(false)
        return
      }
      setError('Could not open the share menu — but you can skip and see your number.')
      setBusy(false)
    }
  }

  return (
    <div className="share-before-reveal">
      <div className="sbr-card">
        <p className="sbr-eyebrow">From Coach K</p>
        <h2 className="sbr-headline">One ask before you see your number.</h2>

        <p className="sbr-body">
          The most useful thing you can do with this assessment — right now, before you see your own number — is send it to <strong>one person</strong> who'd benefit. A parent. A partner. A friend who keeps saying "I really need to get a checkup."
        </p>
        <p className="sbr-body">
          They take it in 5 minutes. You see your number on the next screen no matter what you do.
        </p>

        <div className="sbr-actions">
          <button
            type="button"
            className="sbr-btn primary"
            onClick={handleShare}
            disabled={busy}
          >
            {copied ? '✓ Copied' : (busy ? 'Opening…' : '📤 Send to a friend')}
          </button>
          <button
            type="button"
            className="sbr-btn skip"
            onClick={() => advance('skipped')}
            disabled={busy}
          >
            Skip — show me my number
          </button>
        </div>

        {error && <p className="sbr-error">{error}</p>}

        <p className="sbr-note">
          We don't share your number, your name, or your email. Just the assessment link.
        </p>
      </div>
    </div>
  )
}
