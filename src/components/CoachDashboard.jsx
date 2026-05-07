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

// Each protocol's "graduation" target — finish this many weeks consistently
// and we suggest moving to the next priority. Tunable per protocol later.
const TARGET_WEEKS_PER_PROTOCOL = 8

/**
 * CoachDashboard — single-active-protocol coaching home.
 *
 * Shows ONE active protocol at a time (the user's chosen first priority).
 * Two progress bars:
 *   - Weekly: how the current week is going (avg days completed across the
 *     3 weekly tasks / 7).
 *   - Overall: weeks completed across all of the user's protocols, divided
 *     by total target weeks across their plan.
 *
 * When current_week passes TARGET_WEEKS_PER_PROTOCOL the user is offered
 * "Pick another area to work on next" — for now this just routes back to
 * a retake; a future revision will pull the user's prior assessment and
 * present the unstarted concerns.
 */
export default function CoachDashboard({ userEmail, userName, onRetakeQuiz, onLogout }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeProtocol, setActiveProtocol] = useState(null)
  const [allProtocols, setAllProtocols] = useState([])
  const [latestQuiz, setLatestQuiz] = useState(null)
  const [latestCheckin, setLatestCheckin] = useState(null)
  const [activeCheckin, setActiveCheckin] = useState(null)
  // Promoted optional stretch goals — user has marked them "part of my routine."
  // Stored in localStorage keyed by user_protocol id. Migrating to a real
  // user_protocols.promoted_additions column is a v1.1 follow-up.
  const [promotedSet, setPromotedSet] = useState(new Set())
  const [showStretches, setShowStretches] = useState(false)
  // Add-another-area inline expansion. Defaults closed; opens to show
  // the "master current first" coaching recommendation before letting
  // the user route to retake the assessment for a new area.
  const [showAddConcern, setShowAddConcern] = useState(false)

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

      // All assigned protocols (active + graduated) for overall progress
      const { data: rows, error: rowsError } = await supabase
        .from('user_protocols')
        .select('id, protocol_key, category, current_week, status, difficulty_tier, assigned_at, updated_at')
        .eq('user_id', user.id)
        .order('assigned_at', { ascending: false })

      if (rowsError) {
        setError('Could not load your protocols. ' + rowsError.message)
        setLoading(false)
        return
      }

      const hydrated = (rows || [])
        .map((row) => {
          const content = COACHING_PROTOCOLS[row.protocol_key]
          if (!content) return null
          return { ...row, content }
        })
        .filter(Boolean)

      setAllProtocols(hydrated)

      // Pick the single active protocol — most recently assigned active row
      const active = hydrated.find(p => p.status === 'active') || null
      setActiveProtocol(active)

      // Latest check-in for the active protocol drives the weekly progress
      if (active) {
        const { data: checkin } = await supabase
          .from('protocol_checkins')
          .select('week_number, days_completed, goal_target, outcome')
          .eq('user_protocol_id', active.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        setLatestCheckin(checkin)

        // Load promoted stretch goals from localStorage for this protocol
        try {
          const key = `tha_promoted_${active.id}`
          const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
          setPromotedSet(new Set(raw ? JSON.parse(raw) : []))
        } catch (_) {
          setPromotedSet(new Set())
        }
      } else {
        setLatestCheckin(null)
        setPromotedSet(new Set())
      }
    } catch (err) {
      setError('Unexpected error: ' + (err.message || String(err)))
    } finally {
      setLoading(false)
    }
  }

  const handleCheckinComplete = async () => {
    setActiveCheckin(null)
    await loadDashboard()
  }

  const handleTogglePromote = (idx) => {
    if (!activeProtocol) return
    const next = new Set(promotedSet)
    if (next.has(idx)) next.delete(idx)
    else next.add(idx)
    setPromotedSet(next)
    try {
      const key = `tha_promoted_${activeProtocol.id}`
      localStorage.setItem(key, JSON.stringify([...next]))
    } catch (_) { /* private mode etc. */ }
  }

  const firstName = (userName || userEmail || '').split(/[\s@]/)[0] || 'there'

  // Weekly progress: based on the latest check-in's days_completed.
  // If no check-in yet this week, show the in-progress state (0%) with helpful copy.
  const weeklyProgress = (() => {
    if (!activeProtocol || !latestCheckin) return { pct: 0, hasCheckin: false }
    if (latestCheckin.week_number !== activeProtocol.current_week - 1) {
      // Latest check-in is for a prior week — current week hasn't been checked in yet
      return { pct: 0, hasCheckin: false }
    }
    const target = latestCheckin.goal_target || 7
    const pct = Math.round(Math.min(100, (latestCheckin.days_completed / target) * 100))
    return { pct, hasCheckin: true, days: latestCheckin.days_completed, target }
  })()

  // Overall progress: weeks completed across all protocols / total expected weeks.
  // Each protocol contributes up to TARGET_WEEKS_PER_PROTOCOL weeks; once
  // graduated, full credit. Active protocols contribute their current_week-1
  // (since current_week is the week they're in, not yet completed).
  const overallProgress = (() => {
    if (allProtocols.length === 0) return { pct: 0, completed: 0, total: 0 }
    const total = allProtocols.length * TARGET_WEEKS_PER_PROTOCOL
    const completed = allProtocols.reduce((sum, p) => {
      if (p.status === 'graduated') return sum + TARGET_WEEKS_PER_PROTOCOL
      // current_week starts at 1, so weeks completed = current_week - 1
      return sum + Math.max(0, p.current_week - 1)
    }, 0)
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
    return { pct, completed, total }
  })()

  if (loading) {
    return (
      <div className="coach-dashboard">
        <div className="dashboard-loading">
          <p>Loading your coaching plan…</p>
        </div>
      </div>
    )
  }

  // No active protocol — empty state
  if (!error && !activeProtocol) {
    return (
      <div className="coach-dashboard">
        <div className="empty-state">
          <h2>Ready when you are.</h2>
          <p>
            Take the assessment so I can see where you are, then pick the area
            you want to work on first. We start with one thing — small wins,
            repeated.
          </p>
          <button className="primary-btn" onClick={onRetakeQuiz}>
            Start the assessment
          </button>
        </div>
      </div>
    )
  }

  const category = activeProtocol
    ? PHASE2_CATEGORIES.find(c => c.id === activeProtocol.category)
    : null

  const isGraduating = activeProtocol && activeProtocol.current_week > TARGET_WEEKS_PER_PROTOCOL

  return (
    <div className="coach-dashboard">
      {activeCheckin && (
        <WeeklyCheckin
          userProtocol={activeCheckin}
          onComplete={handleCheckinComplete}
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
        <div className="dashboard-error">⚠️ {error}</div>
      )}

      {/* Active protocol focus card — single, deep, no other distractions */}
      {activeProtocol && (
        <div className="active-protocol-card">
          <div className="active-protocol-header">
            <span className="category-icon">{category?.icon || '🎯'}</span>
            <div>
              <span className="active-label">This Week</span>
              <h2>{activeProtocol.content.theme || activeProtocol.protocol_key.replace(/_/g, ' ').toLowerCase()}</h2>
              <p className="active-meta">
                Week {activeProtocol.current_week} of {TARGET_WEEKS_PER_PROTOCOL} · {category?.name || activeProtocol.category}
              </p>
            </div>
          </div>

          {/* Weekly progress bar */}
          <div className="progress-block">
            <div className="progress-label">
              <span>This Week</span>
              <span className="progress-value">
                {weeklyProgress.hasCheckin
                  ? `${weeklyProgress.days} of ${weeklyProgress.target} days`
                  : 'Check in at end of week'}
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill weekly"
                style={{ width: `${weeklyProgress.pct}%` }}
              />
            </div>
          </div>

          {/* This week's instruction */}
          <div className="this-week-block">
            <h4>What to do this week</h4>
            <p className="this-week-text">{activeProtocol.content.this_week}</p>
            <ul className="weekly-tasks">
              {(activeProtocol.content.daily_micro_wins || []).map((task, idx) => (
                <li key={idx}>
                  <span className="task-num">{idx + 1}.</span> {task}
                </li>
              ))}
            </ul>

          </div>

          {/* Stretch goals — accumulate week over week. The 3 core habits above
              are mandatory; these are bonus. User can promote any to "part of
              my routine" with the star button — visual reward only for now,
              localStorage-tracked. */}
          {(() => {
            const additions = activeProtocol.content.weekly_additions || []
            // Show only additions unlocked through the user's current week.
            // additions[i] unlocks when current_week >= i+1.
            const unlocked = additions
              .map((text, idx) => ({ text, idx }))
              .filter(a => a.text && a.idx < activeProtocol.current_week)

            if (unlocked.length === 0) return null
            const promotedCount = unlocked.filter(a => promotedSet.has(a.idx)).length

            return (
              <div className="stretches-block">
                <button
                  type="button"
                  className="stretches-header"
                  onClick={() => setShowStretches(!showStretches)}
                >
                  <span className="stretches-title">
                    Stretch Goals · <em>optional</em>
                    {promotedCount > 0 && (
                      <span className="stretches-promoted-count">
                        {' '}🌟 {promotedCount} in your routine
                      </span>
                    )}
                  </span>
                  <span className="stretches-toggle">
                    {showStretches ? '−' : `+ ${unlocked.length}`}
                  </span>
                </button>

                {showStretches && (
                  <>
                    <p className="stretches-intro">
                      Bonus habits I'd add if you've nailed the basics. Try them out — and if one becomes part of your daily routine, mark it. That's how stacking real change works.
                    </p>
                    <ul className="stretches-list">
                      {unlocked.map(({ text, idx }) => {
                        const isPromoted = promotedSet.has(idx)
                        return (
                          <li
                            key={idx}
                            className={`stretch-item ${isPromoted ? 'promoted' : ''}`}
                          >
                            <p className="stretch-text">{text}</p>
                            <button
                              type="button"
                              className={`stretch-promote-btn ${isPromoted ? 'is-on' : ''}`}
                              onClick={() => handleTogglePromote(idx)}
                              aria-pressed={isPromoted}
                            >
                              {isPromoted ? '🌟 In my routine' : 'Add to my routine'}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </>
                )}
              </div>
            )
          })()}

          <button
            className="checkin-btn"
            onClick={() => setActiveCheckin(activeProtocol)}
          >
            {isGraduating ? 'Final Check-in →' : 'Weekly Check-in →'}
          </button>

          {isGraduating && (
            <div className="graduation-block">
              <h4>🎉 You've made it 8 weeks.</h4>
              <p>
                That's a real change — most people don't get this far. Time to reassess where your health stands now and see how far you've come. The numbers tell a story; let's look at them again together.
              </p>
              <button className="reassess-btn" onClick={onRetakeQuiz}>
                Reassess my health →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add another area — Keith's coaching philosophy: recommend mastering
          one area first, but never block. Defaults closed; expands to show
          the recommendation + a clear "yes, add anyway" route. */}
      {activeProtocol && (
        <div className="add-concern-block">
          <button
            type="button"
            className="add-concern-toggle"
            onClick={() => setShowAddConcern(!showAddConcern)}
          >
            {showAddConcern ? '−' : '+'} Want to work on another area too?
          </button>

          {showAddConcern && (
            <div className="add-concern-body">
              <p>
                <strong>Honest take from me:</strong> you're on week {activeProtocol.current_week} of {TARGET_WEEKS_PER_PROTOCOL} with {category?.name || 'your current focus'}. Real change happens when you build one habit until it becomes automatic — usually 6–8 weeks. Spreading yourself across two areas at once almost always means neither one sticks.
              </p>
              <p>
                That said — your life, your call. If something else is feeling urgent, retake the assessment and we'll add it to your plan.
              </p>
              <div className="add-concern-actions">
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => setShowAddConcern(false)}
                >
                  Stay focused on this one
                </button>
                <button
                  type="button"
                  className="add-concern-confirm-btn"
                  onClick={onRetakeQuiz}
                >
                  Add another area anyway →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overall progress — softer, lower in the hierarchy */}
      <div className="overall-progress-card">
        <div className="progress-label">
          <span>Overall Plan Progress</span>
          <span className="progress-value">
            {overallProgress.completed} of {overallProgress.total} weeks
          </span>
        </div>
        <div className="progress-track">
          <div
            className="progress-fill overall"
            style={{ width: `${overallProgress.pct}%` }}
          />
        </div>
        <p className="progress-detail">
          You're working on {allProtocols.filter(p => p.status === 'active').length} protocol
          {allProtocols.filter(p => p.status === 'active').length === 1 ? '' : 's'}
          {allProtocols.filter(p => p.status === 'graduated').length > 0
            ? ` · ${allProtocols.filter(p => p.status === 'graduated').length} graduated`
            : ''}.
        </p>
      </div>

      <div className="dashboard-footer">
        <button className="secondary-btn" onClick={onRetakeQuiz}>
          Retake Assessment
        </button>
        <button className="text-btn" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </div>
  )
}
