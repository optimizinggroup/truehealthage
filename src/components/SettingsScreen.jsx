import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { track as phTrack, resetIdentity as phReset } from '../utils/posthog'
import '../styles/SettingsScreen.css'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const DELETE_FUNCTION = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`

/**
 * SettingsScreen — account management.
 *
 * Apple App Store Review Guideline 5.1.1(v) requires that any app letting
 * users create accounts also lets them DELETE those accounts from inside
 * the app. The delete flow lives here.
 *
 * Flow:
 *   1. User taps Delete account
 *   2. Modal explains what gets deleted + asks them to type DELETE to confirm
 *   3. On confirm, POST to the delete-account edge function with their JWT
 *   4. On success, sign out + reset PostHog identity + return to landing
 */
export default function SettingsScreen({ userEmail, onBack, onLogout }) {
  const [stage, setStage] = useState('main') // 'main' | 'confirm' | 'deleting' | 'done' | 'error'
  const [typed, setTyped] = useState('')
  const [error, setError] = useState(null)

  const handleDelete = async () => {
    setStage('deleting')
    setError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('Your session has expired. Please sign in again.')
        setStage('error')
        return
      }

      const res = await fetch(DELETE_FUNCTION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(body?.error || `Could not delete account (HTTP ${res.status}). Please email privacy@optimizinggroup.com.`)
        setStage('error')
        return
      }

      phTrack('account_deleted', { had_email: !!userEmail })
      phReset()

      // Local sign-out so the next view doesn't try to use the dead session
      await supabase.auth.signOut().catch(() => {})

      setStage('done')
      setTimeout(() => onLogout(), 1800)
    } catch (err) {
      setError(err?.message || 'Unexpected error. Please try again or email privacy@optimizinggroup.com.')
      setStage('error')
    }
  }

  return (
    <div className="settings-screen">
      <div className="settings-card">
        <button type="button" className="settings-back" onClick={onBack}>← Back to dashboard</button>

        <h2>Settings</h2>

        <section className="settings-section">
          <h3>Account</h3>
          <p className="settings-row">
            <span className="settings-label">Signed in as</span>
            <span className="settings-value">{userEmail || '(not signed in)'}</span>
          </p>
          <button type="button" className="settings-action" onClick={onLogout}>
            Sign out
          </button>
        </section>

        <section className="settings-section danger">
          <h3>Delete my account</h3>
          <p className="settings-help">
            This permanently deletes your account and everything tied to it: your assessment results, coaching protocols, weekly check-ins, and email subscription. <strong>It cannot be undone.</strong>
          </p>

          {stage === 'main' && (
            <button
              type="button"
              className="settings-action danger"
              onClick={() => setStage('confirm')}
            >
              Delete account
            </button>
          )}

          {stage === 'confirm' && (
            <div className="settings-confirm">
              <p>
                Type <code>DELETE</code> to confirm. The next button will permanently remove your account.
              </p>
              <input
                type="text"
                className="settings-input"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="Type DELETE here"
                autoFocus
                autoComplete="off"
                autoCapitalize="characters"
              />
              <div className="settings-confirm-actions">
                <button
                  type="button"
                  className="settings-action"
                  onClick={() => { setStage('main'); setTyped('') }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="settings-action danger"
                  onClick={handleDelete}
                  disabled={typed.trim().toUpperCase() !== 'DELETE'}
                >
                  Permanently delete
                </button>
              </div>
            </div>
          )}

          {stage === 'deleting' && (
            <p className="settings-status">Deleting your account…</p>
          )}

          {stage === 'done' && (
            <p className="settings-status ok">
              Your account has been deleted. Signing you out…
            </p>
          )}

          {stage === 'error' && (
            <>
              <p className="settings-status error">⚠ {error}</p>
              <button
                type="button"
                className="settings-action"
                onClick={() => { setStage('main'); setTyped(''); setError(null) }}
              >
                Cancel
              </button>
            </>
          )}
        </section>

        <p className="settings-footer-note">
          Questions or trouble deleting? Email <a href="mailto:privacy@optimizinggroup.com">privacy@optimizinggroup.com</a> — we'll respond within 7 days.
        </p>
      </div>
    </div>
  )
}
