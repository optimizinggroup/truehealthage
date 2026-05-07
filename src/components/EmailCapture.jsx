import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import '../styles/EmailCapture.css'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Self-contained pipeline: signUp → insert users → insert quiz_results → invoke
// Edge Function for welcome email. No Make. The Edge Function holds the Resend
// API key and sends from truehealthage.com once the domain is verified in Resend.
const WELCOME_EMAIL_FUNCTION = `${supabaseUrl}/functions/v1/send-welcome-email`

const isDevSkipEnabled = import.meta.env.DEV

export default function EmailCapture({
  phase1Results,
  phase2Results,
  onComplete
}) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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

      onComplete(email)
    } catch (err) {
      console.error('Error:', err)
      setError(err.message || 'There was an error. Please try again.')
    } finally {
      setLoading(false)
    }
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

        <p className="privacy-note">
          Your results are saved securely. You can log in anytime to review, edit, or retake assessments.
        </p>
      </div>
    </div>
  )
}
