import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import '../styles/ResetPasswordComponent.css'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function ResetPasswordComponent({ onResetSuccess }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [validSession, setValidSession] = useState(false)

  useEffect(() => {
    // Check if user has a valid password reset session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setValidSession(true)
      } else {
        setError('Invalid or expired reset link. Please request a new password reset.')
      }
    }

    checkSession()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate passwords
      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters')
        setLoading(false)
        return
      }

      if (newPassword !== confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      // Success - redirect to login
      onResetSuccess()
    } catch (err) {
      console.error('Error:', err)
      setError(err.message || 'There was an error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!validSession && !error) {
    return (
      <div className="reset-password-component">
        <div className="reset-password-card">
          <p className="loading-text">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="reset-password-component">
      <div className="reset-password-card">
        <h2>Create New Password</h2>
        <p>Enter your new password below</p>

        {error && <div className="error-message">{error}</div>}

        {validSession && (
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="New Password (6+ characters)"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                setError(null)
              }}
              disabled={loading}
              required
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                setError(null)
              }}
              disabled={loading}
              required
            />

            <button
              type="submit"
              className="submit-btn"
              disabled={loading || !newPassword.trim() || !confirmPassword.trim()}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
