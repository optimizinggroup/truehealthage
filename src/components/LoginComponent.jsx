import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import '../styles/LoginComponent.css'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function LoginComponent({ onLoginSuccess, onForgotPassword, onSignUp }) {
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

      // Sign in with email and password
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (!user) {
        setError('Failed to sign in')
        setLoading(false)
        return
      }

      // Successful login
      onLoginSuccess(email, user.id)
    } catch (err) {
      console.error('Error:', err)
      setError(err.message || 'There was an error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-component">
      <div className="login-card">
        <h2>Welcome Back</h2>
        <p>Sign in to view your results and track your health progress</p>

        <form onSubmit={handleSubmit}>
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
            placeholder="Password"
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
            className="submit-btn"
            disabled={loading || !email.trim() || !password.trim()}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <button className="link-btn" onClick={onForgotPassword} disabled={loading}>
            Forgot Password?
          </button>
          <button className="link-btn" onClick={onSignUp} disabled={loading}>
            New User? Start Assessment
          </button>
        </div>
      </div>
    </div>
  )
}
