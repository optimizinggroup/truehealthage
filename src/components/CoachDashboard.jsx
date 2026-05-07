import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { COACHING_PROTOCOLS } from '../utils/coachingProtocols.js'
import { PHASE2_CATEGORIES } from '../utils/phase2Data'
import WeeklyCheckin from './WeeklyCheckin'
import '../styles/CoachDashboard.css'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

/**
 * CoachDashboard — the "this is your coach" home screen.
 *
 * Loads the user's active assigned protocols from user_protocols, shows each as
 * a card with the current week, the "this week" micro-win, and a check-in CTA.
 * Tapping check-in opens the WeeklyCheckin modal which writes to protocol_checkins
 * and shows the adaptive branch.
 */
export default function CoachDashboard({ userEmail, userName, onRetakeQuiz, onLogout }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [assignedProtocols, setAssignedProtocols] = useState([])
  const [latestQuiz, setLatestQuiz] = useState(null)
  const [activeCheckin, setActiveCheckin] = useState(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Please sign in to see your coaching dashboard.')
        setLoading(false)
        return
      }

      // Latest quiz result for the True Health Age display
      const { data: quizRow } = await supabase
        .from('quiz_results')
        .select('true_health_age, chrono_age, age_diff, grade, result_label, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setLatestQuiz(quizRow)

      // Active assigned protocols
      const { data: rows, error: rowsError } = await supabase
        .from('user_protocols')
        .select('id, protocol_key, category, current_week, status, difficulty_tier, assigned_at, updated_at')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('assigned_at', { ascending: true })

      if (rowsError) {
        setError('Could not load your protocols. ' + rowsError.message)
        setLoading(false)
        return
      }

      // Hydrate each row with its content from COACHING_PROTOCOLS
      const hydrated = (rows || [])
        .map((row) => {
          const content = COACHING_PROTOCOLS[row.protocol_key]
          if (!content) return null
          return { ...row, content }
        })
        .filter(Boolean)

      setAssignedProtocols(hydrated)
    } catch (err) {
      setError('Unexpected error: ' + (err.message || String(err)))
    } finally {
      setLoading(false)
    }
  }

  const handleCheckinComplete = async (userProtocolId) => {
    setActiveCheckin(null)
    await loadDashboard()
  }

  const firstName = (userName || userEmail || '').split(/[\s@]/)[0] || 'there'

  if (loading) {
    return (
      <div className="coach-dashboard">
        <div className="dashboard-loading">
          <p>Loading your coaching plan…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="coach-dashboard">
      {activeCheckin && (
        <WeeklyCheckin
          userProtocol={activeCheckin}
          onComplete={() => handleCheckinComplete(activeCheckin.id)}
          onCancel={() => setActiveCheckin(null)}
        />
      )}

      <div className="dashboard-header">
        <div>
          <p className="greeting">Hey {firstName} —</p>
          <h1>Your Coaching Plan</h1>
          <p className="subhead">From Coach K</p>
        </div>
        {latestQuiz && (
          <div className="age-badge">
            <span className="age-label">True Health Age</span>
            <span className="age-value">{latestQuiz.true_health_age}</span>
            <span className="age-diff">
              {latestQuiz.age_diff < 0 ? `${Math.abs(latestQuiz.age_diff)} yrs younger` :
               latestQuiz.age_diff > 0 ? `${latestQuiz.age_diff} yrs older` : 'matches your age'}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="dashboard-error">
          ⚠️ {error}
        </div>
      )}

      {!error && assignedProtocols.length === 0 && (
        <div className="empty-state">
          <h2>No active protocols yet.</h2>
          <p>Take the assessment and pick the areas you want to work on. I'll assign you protocols and we'll start building from there.</p>
          <button className="primary-btn" onClick={onRetakeQuiz}>
            Take the assessment
          </button>
        </div>
      )}

      {assignedProtocols.length > 0 && (
        <>
          <div className="dashboard-intro">
            <p>
              Here's what we're working on right now. Each protocol has a specific focus this week. When you're ready to check in, click the button at the bottom of the card. No judgment — just tell me what actually happened.
            </p>
          </div>

          <div className="protocols-list">
            {assignedProtocols.map((p) => {
              const category = PHASE2_CATEGORIES.find(c => c.id === p.category)
              return (
                <div key={p.id} className="dashboard-protocol-card">
                  <div className="protocol-card-header">
                    <span className="category-icon">{category?.icon || '🎯'}</span>
                    <div>
                      <h3>{(p.content.theme) || p.protocol_key.replace(/_/g, ' ').toLowerCase()}</h3>
                      <p className="protocol-meta">
                        Week {p.current_week} · {category?.name || p.category}
                        {p.difficulty_tier === 'reduced' && <span className="tier-tag">scaled back</span>}
                        {p.difficulty_tier === 'advanced' && <span className="tier-tag advanced">advanced</span>}
                      </p>
                    </div>
                  </div>

                  <div className="this-week">
                    <p className="this-week-label">This week:</p>
                    <p className="this-week-text">{p.content.this_week}</p>
                  </div>

                  <div className="daily-actions">
                    <p className="actions-label">Daily micro-wins:</p>
                    <ul>
                      {(p.content.daily_micro_wins || []).map((action, idx) => (
                        <li key={idx}>{action}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    className="checkin-btn"
                    onClick={() => setActiveCheckin(p)}
                  >
                    Weekly Check-in →
                  </button>
                </div>
              )
            })}
          </div>

          <div className="dashboard-footer">
            <button className="secondary-btn" onClick={onRetakeQuiz}>
              Retake Assessment
            </button>
            <button className="text-btn" onClick={onLogout}>
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  )
}
