import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import SocialAuthButtons from './SocialAuthButtons'
import { track as phTrack, identify as phIdentify } from '../utils/posthog'
import '../styles/EmailCapture.css'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Self-contained pipeline: signUp → insert users → insert quiz_results → invoke
// Edge Function for welcome email + (optional) newsletter subscribe.
// No Make. Edge Functions hold the Resend + Beehiiv keys.
const WELCOME_EMAIL_FUNCTION = `${supabaseUrl}/functions/v1/send-welcome-email`
const SUBSCRIBE_NEWSLETTER_FUNCTION = `${supabaseUrl}/functions/v1/subscribe-newsletter`

const isDevSkipEnabled = import.meta.env.DEV

export default function EmailCapture({
  phase1Results,
  phase2Results,
  onComplete
}) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(true) // opt-out style
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  // If Supabase Auth has email-confirmation enabled, signUp returns a user
  // but no session. We can't write to user_protocols (RLS blocks it) or load
  // the dashboard — so instead show a "Check your email" intermediate screen.
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate inputs
      if (!fullName.trim()) {
        setError('Please enter your full name')
        setLoading(false)
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address')
        setLoading(false)
        return
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        setLoading(false)
        return
      }

      // 1. Create Supabase auth account
      const { data: { user, session }, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }
      if (!user) {
        setError('Failed to create account')
        setLoading(false)
        return
      }

      // If Supabase project requires email confirmation, signUp returns user
      // but no session — bail out early and prompt the user to check their
      // inbox instead of routing them to a dashboard that will reject them.
      if (!session) {
        setNeedsEmailConfirmation(true)
        setLoading(false)
        return
      }

      const params = new URLSearchParams(window.location.search)
      const utm = {
        utm_source: params.get('utm_source'),
        utm_medium: params.get('utm_medium'),
        utm_campaign: params.get('utm_campaign'),
      }

      // 2. Insert into public.users — RLS policy users_insert_self matches on
      // auth.uid() = id. Upsert because the user may retake the quiz later.
      const { error: usersError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          name: fullName,
          provider: 'email',
          opted_in: true,
          ...utm,
        }, { onConflict: 'id' })

      if (usersError) {
        console.error('users insert failed:', usersError)
      }

      // 3. Insert quiz_results row (one row per completion — retakes add rows)
      const { data: quizRow, error: quizError } = await supabase
        .from('quiz_results')
        .insert({
          user_id: user.id,
          chrono_age: phase1Results.chronoAge,
          true_health_age: phase1Results.trueHealthAge,
          age_diff: phase1Results.ageDiff,
          grade: phase1Results.grade,
          result_label: phase1Results.label,
          answers: phase1Results.answers || {},
          top_3_aging: phase1Results.top3Aging || null,
          top_3_protecting: phase1Results.top3Protecting || null,
          device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
          user_agent: navigator.userAgent,
        })
        .select()
        .single()

      if (quizError) {
        console.error('quiz_results insert failed:', quizError)
      }

      // 4. Fire welcome email (server-side via Edge Function; non-blocking).
      // Failures here must NOT block the user — we still show their results.
      if (session?.access_token) {
        fetch(WELCOME_EMAIL_FUNCTION, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': supabaseAnonKey,
          },
          body: JSON.stringify({
            user_id: user.id,
            result_id: quizRow?.id || null,
          }),
        }).catch((err) => {
          console.warn('Welcome email request failed (non-fatal):', err)
        })
      }

      // PostHog: identify the user + log the signup-completed event for funnels.
      phIdentify(user.id, { email, name: fullName, provider: 'email' })
      phTrack('auth_signup_completed', {
        provider: 'email',
        newsletter_optin: !!subscribeNewsletter,
        had_quiz_result: !!quizRow?.id,
      })

      // 5. (Optional) Subscribe to TrueHealth Protocols newsletter via Beehiiv.
      // Non-blocking; if this fails the user still gets through signup.
      if (subscribeNewsletter && session?.access_token) {
        fetch(SUBSCRIBE_NEWSLETTER_FUNCTION, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': supabaseAnonKey,
          },
          body: JSON.stringify({
            email,
            user_id: user.id,
            name: fullName,            // → split into first_name/last_name in the edge function
            utm_source: 'truehealthage_app',
            utm_medium: 'web',
            utm_campaign: 'signup_optin',
          }),
        }).catch((err) => {
          console.warn('Newsletter subscribe request failed (non-fatal):', err)
        })
      }

      onComplete(email)
    } catch (err) {
      console.error('Error:', err)
      setError(err.message || 'There was an error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Confirmation-required state: shown when Supabase Auth requires email
  // verification before a session is created. Disable in Supabase project
  // settings → Authentication → Providers → Email → Confirm email = OFF
  // to skip this step entirely (recommended for low-friction onboarding).
  if (needsEmailConfirmation) {
    return (
      <div className="email-capture">
        <div className="email-capture-card">
          <h2>Almost there.</h2>
          <p style={{ marginBottom: '16px' }}>
            I just sent a confirmation email to <strong>{email}</strong>. Click the link in that email and you'll be signed in. Once you're confirmed, come back here and I'll show you your results and your first coaching focus.
          </p>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            Don't see it? Check your spam folder. The first email from a new domain often gets flagged — click "Not Spam" and future ones land in your inbox.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="email-capture">
      <div className="email-capture-card">
        <h2>Save Your Results</h2>
        <p>Create your account to unlock your True Health Age, track changes, and complete new modules in the future.</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value)
              setError(null)
            }}
            disabled={loading}
            autoFocus
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError(null)
            }}
            disabled={loading}
            required
          />

          <input
            type="password"
            placeholder="Create Password (6+ characters)"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError(null)
            }}
            disabled={loading}
            required
          />

          <label className="newsletter-optin">
            <input
              type="checkbox"
              checked={subscribeNewsletter}
              onChange={(e) => setSubscribeNewsletter(e.target.checked)}
              disabled={loading}
            />
            <span>
              <strong>Send me Coach K's newsletter</strong> — practical longevity coaching, 1-2x per week. You can unsubscribe anytime.
            </span>
          </label>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="submit-btn full-width"
            disabled={loading || !fullName.trim() || !email.trim() || !password.trim()}
          >
            {loading ? 'Creating Account...' : 'See My Health Age'}
          </button>

          {isDevSkipEnabled && (
            <button
              type="button"
              onClick={() => onComplete('test@example.com')}
              className="skip-btn"
              style={{
                width: '100%',
                padding: '12px',
                marginTop: '12px',
                background: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem',
                cursor: 'pointer',
                color: '#666',
                fontWeight: '500'
              }}
            >
              Skip for Now (Dev only)
            </button>
          )}
        </form>

        <SocialAuthButtons disabled={loading} />

        <p className="privacy-note">
          Your results are saved securely. You can log in anytime to review, edit, or retake assessments.
        </p>
      </div>
    </div>
  )
}
