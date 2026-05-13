import { useEffect, useState } from 'react'
import { Share } from '@capacitor/share'
import { Capacitor } from '@capacitor/core'
import { track as phTrack } from '../utils/posthog'
import '../styles/ShareAfterReveal.css'

/**
 * ShareAfterReveal — post-reveal viral share, positioned at peak emotional moment.
 *
 * Shown DIRECTLY UNDER the True Health Age number block on the results page,
 * before the user has scrolled to category breakdowns. The window of highest
 * intent to share is the first 5-10 seconds after seeing the number — so the
 * prompt is sitting there waiting, not buried at the bottom of the page.
 *
 * Critical design choices:
 *   • Does NOT reveal the user's score. The share message says "I just found
 *     out my TrueHealth Age" — curiosity gap, not embarrassment.
 *   • Same copy works for everyone regardless of their result (good or bad).
 *   • Native share sheet on mobile (gives access to FB / Messenger / IG /
 *     iMessage / WhatsApp / X / Email / etc. — every app installed).
 *   • On desktop, expands inline platform buttons (Facebook, X, Copy, Email)
 *     since the Web Share API isn't always available there.
 *
 * PostHog:
 *   share_after_reveal_shown    — render
 *   share_after_reveal_shared   — { method }
 */
export default function ShareAfterReveal() {
  const [showFallback, setShowFallback] = useState(false)
  const [copied, setCopied] = useState(false)

  const shareUrl = 'https://truehealthage.com'
  const shareTitle = 'I just found out my TrueHealth Age — you can too'
  const shareText = `I just found out my TrueHealth Age. It's a free 5-minute assessment from Coach K — a real read on how your habits are actually aging you. Take yours: ${shareUrl}`

  useEffect(() => { phTrack('share_after_reveal_shown') }, [])

  const log = (method) => phTrack('share_after_reveal_shared', { method })

  const handleNativeShare = async () => {
    try {
      // Capacitor native shell (iOS/Android)
      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
          dialogTitle: 'Share TrueHealth Age',
        })
        log('native')
        return
      }
      // Web Share API (mobile browsers + Safari Mac)
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl })
        log('web_share_api')
        return
      }
      // Desktop fallback — expand the platform-button row
      setShowFallback(true)
    } catch (err) {
      if (err?.name === 'AbortError') return
      // If the OS share sheet failed for some other reason, fall back to inline buttons
      setShowFallback(true)
    }
  }

  const openFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=520')
    log('facebook')
  }
  const openTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=520')
    log('x')
  }
  const openEmail = () => {
    const subject = encodeURIComponent('You should take this — TrueHealth Age')
    const body = encodeURIComponent(shareText)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
    log('email')
  }
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      log('copy_link')
      setTimeout(() => setCopied(false), 2200)
    } catch (_) { /* ignore */ }
  }

  return (
    <div className="sar-card">
      <div className="sar-content">
        <p className="sar-eyebrow">From Coach K</p>
        <h3 className="sar-headline">Just got your number? Send this to one person.</h3>
        <p className="sar-body">
          The number you just saw is more useful when one person you care about sees theirs too. Same 5-minute assessment. Free. We don't share your result — just the link.
        </p>

        <div className="sar-actions">
          <button type="button" className="sar-btn primary" onClick={handleNativeShare}>
            📤 Share with a friend
          </button>
          {!showFallback && (
            <button type="button" className="sar-btn ghost" onClick={() => setShowFallback(true)}>
              Or pick a platform →
            </button>
          )}
        </div>

        {showFallback && (
          <div className="sar-platforms">
            <button type="button" className="sar-platform fb" onClick={openFacebook}>
              <span className="sar-platform-icon" aria-hidden>f</span>
              Facebook
            </button>
            <button type="button" className="sar-platform x" onClick={openTwitter}>
              <span className="sar-platform-icon" aria-hidden>𝕏</span>
              X
            </button>
            <button type="button" className="sar-platform mail" onClick={openEmail}>
              <span className="sar-platform-icon" aria-hidden>✉</span>
              Email
            </button>
            <button type="button" className="sar-platform copy" onClick={copyLink}>
              <span className="sar-platform-icon" aria-hidden>{copied ? '✓' : '🔗'}</span>
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
