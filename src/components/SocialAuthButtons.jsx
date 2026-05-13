import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import '../styles/SocialAuthButtons.css'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

/**
 * SocialAuthButtons — Google + Apple sign-in via Supabase OAuth.
 *
 * Used in both LoginComponent (returning users) and EmailCapture (new signups
 * from the quiz completion flow). The OAuth provider configuration lives in
 * the Supabase project dashboard (Auth → Providers).
 *
 * - Web: redirects to provider, callback hits the site URL, Supabase JS
 *   client auto-detects the session in the URL hash on next page load.
 * - Capacitor native (iOS / Android): same flow uses the system browser via
 *   the OS URL handler. For a polished native experience, see the runbook
 *   under docs/MOBILE_RELEASE.md — adding @capacitor/browser + custom
 *   URI scheme will keep the OAuth flow in-app.
 *
 * Apple is required by App Store Review when any 3rd-party login is offered
 * (Google in this case). Both buttons present together to stay compliant.
 */
export default function SocialAuthButtons({ disabled = false }) {
  const [busy, setBusy] = useState(null)  // 'google' | 'apple' | null
  const [error, setError] = useState(null)

  const handleOAuth = async (provider) => {
    setError(null)
    setBusy(provider)
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      })
      if (oauthError) {
        setError(oauthError.message)
        setBusy(null)
      }
      // On success the browser redirects — no further action needed here.
    } catch (err) {
      setError(err.message || 'Could not start sign-in. Please try again.')
      setBusy(null)
    }
  }

  return (
    <div className="social-auth">
      <div className="social-auth-divider">
        <span>or continue with</span>
      </div>

      <div className="social-auth-buttons">
        <button
          type="button"
          className="social-btn google"
          onClick={() => handleOAuth('google')}
          disabled={disabled || busy !== null}
        >
          <svg className="social-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.61z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
          </svg>
          {busy === 'google' ? 'Opening Google…' : 'Continue with Google'}
        </button>

        <button
          type="button"
          className="social-btn apple"
          onClick={() => handleOAuth('apple')}
          disabled={disabled || busy !== null}
        >
          <svg className="social-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
          </svg>
          {busy === 'apple' ? 'Opening Apple…' : 'Continue with Apple'}
        </button>
      </div>

      {error && <p className="social-auth-error">{error}</p>}
    </div>
  )
}
