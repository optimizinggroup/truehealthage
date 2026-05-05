import { useState } from 'react'
import axios from 'axios'
import { createClient } from '@supabase/supabase-js'
import '../styles/EmailCapture.css'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

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

      // Create Supabase account
      const { data: { user }, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
          }
        }
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

      // Send results to Make webhook with user info
      const payload = {
        name: fullName,
        email: email,
        user_id: user.id,
        chrono_age: phase1Results.chronoAge,
        true_health_age: phase1Results.trueHealthAge,
        age_diff: phase1Results.ageDiff,
        grade: phase1Results.grade,
        result_label: phase1Results.label,
        top_3_aging: phase1Results.top3Aging,
        top_3_protecting: phase1Results.top3Protecting,
        phase2_selected: !!phase2Results,
        ...(phase2Results && {
          area_scores: phase2Results.areaScores,
          recommendations: phase2Results.recommendations,
        }),
        utm_source: new URLSearchParams(window.location.search).get('utm_source') || null,
        utm_medium: new URLSearchParams(window.location.search).get('utm_medium') || null,
        utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign') || null,
      }

      // Call Make webhook
      const webhookUrl = import.meta.env.VITE_MAKE_WEBHOOK_PHASE1
      if (webhookUrl) {
        await axios.post(webhookUrl, payload)
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
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            Skip for Now (Testing)
          </button>
        </form>

        <p className="privacy-note">
          Your results are saved securely. You can log in anytime to review, edit, or retake assessments.
        </p>
      </div>
    </div>
  )
}
