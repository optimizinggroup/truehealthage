import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import '../styles/ForgotPasswordComponent.css'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function ForgotPasswordComponent({ onBackToLogin }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        setError('Please enter a valid email address')
        setLoading(false)
        return
      }

      // Send password reset email
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
        setLoading(false)
        return
      }

      setSuccess(true)
      setEmail('')
    } catch (err) {
      console.error('Error:', err)
      setError(err.message || 'There was an error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="forgot-password-component">
        <div className="forgot-password-card">
          <h2>Check Your Email</h2>
          <p className="success-message">
            We've sent a password reset link to your email. Please check your inbox and follow the link to reset your password.
          </p>
          <p className="success-subtext">
            If you don't see the email, check your spam folder.
          </p>
          <button className="back-btn" onClick={onBackToLogin}>
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="forgot-password-component">
      <div className="forgot-password-card">
        <h2>Reset Password</h2>
        <p>Enter your email address and we'll send you a link to reset your password</p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError(null)
            }}
            disabled={loading}
            required
          />

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="submit-btn"
            disabled={loading || !email.trim()}
          >
            {loading ? 'Sending Link...' : 'Send Reset Link'}
          </button>
        </form>

        <button className="back-link-btn" onClick={onBackToLogin} disabled={loading}>
          ← Back to Sign In
        </button>
      </div>
    </div>
  )
}
