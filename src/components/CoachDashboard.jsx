import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { COACHING_PROTOCOLS, resolveProtocol, stageForCategoryFromAnswers, cardioStageFromAnswer, cancerStageFromAnswer } from '../utils/coachingProtocols.js'
import { PHASE2_CATEGORIES } from '../utils/phase2Data'
import { pickTipsForUser, buildProfileFromUser, balanceTasksByMode } from '../utils/tipPicker.js'
import WeeklyCheckin from './WeeklyCheckin'
import OptionalAddOns from './OptionalAddOns'
import ShareApp from './ShareApp'
import { normalizeSex } from '../utils/optionalAddOns'
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
export default function CoachDashboard({ userEmail, userName, onRetakeQuiz, onAddAnotherArea, onLogout, onOpenSettings }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeProtocol, setActiveProtocol] = useState(null)
  const [activeProtocols, setActiveProtocols] = useState([])
  const [allProtocols, setAllProtocols] = useState([])
  const [latestQuiz, setLatestQuiz] = useState(null)
  const [latestCheckin, setLatestCheckin] = useState(null)
  const [activeCheckin, setActiveCheckin] = useState(null)
  // Promoted optional stretch goals — user has marked them "part of my routine."
  // Stored in localStorage keyed by user_protocol id. Migrating to a real
  // user_protocols.promoted_additions column is a v1.1 follow-up.
  const [promotedSet, setPromotedSet] = useState(new Set())
  const [showStretches, setShowStretches] = useState(false)
  // Tasks the user marked "I already do this" — globally scoped (not per
  // protocol) since universals like "walk 10 min" recur across categories.
  // Persisted in localStorage so the swap survives reloads + protocol switches.
  const [excludedTips, setExcludedTips] = useState([])
  // Cached Phase 2 results (risk tags, raw responses, severity) used by the
  // tip picker to personalize daily actions per user. Loaded from localStorage.
  const [cachedPhase2, setCachedPhase2] = useState(null)
  // Phase 1 answers from latest quiz_results — used for chronotype/fitness
  // signals in the picker profile.
  const [phase1Answers, setPhase1Answers] = useState(null)
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

      // Latest quiz result for the True Health Age display + raw answers
      // (used for chronotype/fitness signals in the tip picker profile)
      const { data: quizRow } = await supabase
        .from('quiz_results')
        .select('true_health_age, chrono_age, age_diff, grade, result_label, answers, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setLatestQuiz(quizRow)
      setPhase1Answers(quizRow?.answers || null)

      // Pull cached Phase 2 results (risk tags, severity, raw responses) for
      // the picker. Falls back gracefully if the cache is missing.
      try {
        const raw = typeof localStorage !== 'undefined'
          ? localStorage.getItem(`tha_last_phase2_results_${user.id}`)
          : null
        setCachedPhase2(raw ? JSON.parse(raw) : null)
      } catch (_) { setCachedPhase2(null) }

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

      // Resolve protocol content for this user's context — sex AND stage.
      //   - Sex variants: hormone protocol etc. (women shouldn't see TRT, men
      //     shouldn't see "vaginal bleeding" red flags)
      //   - Stage variants: CARDIOVASCULAR_PROTOCOL and CANCER_PROTOCOL change
      //     completely based on Q23 (cardio severity) and Q24 (cancer severity).
      //     Prevention guidance ≠ during-treatment guidance.
      const userSex = normalizeSex(quizRow?.answers?.[2]?.text)
      const hydrated = (rows || [])
        .map((row) => {
          const baseContent = COACHING_PROTOCOLS[row.protocol_key]
          if (!baseContent) return null
          // Stage takes priority for the two big disease-arc protocols; for
          // other protocols, derive stage from category as a hook for future
          // additions (returns null today for categories without mapping).
          let stage = null
          if (row.protocol_key === 'CARDIOVASCULAR_PROTOCOL') {
            stage = cardioStageFromAnswer(quizRow?.answers?.[23]?.text)
          } else if (row.protocol_key === 'CANCER_PROTOCOL') {
            stage = cancerStageFromAnswer(quizRow?.answers?.[24]?.text)
          } else {
            stage = stageForCategoryFromAnswers(baseContent.category, quizRow?.answers)
          }
          const content = resolveProtocol(baseContent, { sex: userSex, stage })
          return { ...row, content }
        })
        .filter(Boolean)

      setAllProtocols(hydrated)

      // Get ALL active protocols. If user added a second area, both should
      // be visible — previously we only rendered the most recently assigned
      // and the first one disappeared. Order them oldest-first so primary
      // focus stays consistent (the one they picked first).
      const actives = hydrated
        .filter(p => p.status === 'active')
        .sort((a, b) => new Date(a.assigned_at) - new Date(b.assigned_at))
      const active = actives[0] || null
      setActiveProtocol(active)
      setActiveProtocols(actives)

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

        // Load excluded ("I already do this") tips — global per user
        try {
          const ekey = `tha_excluded_tips_${user.id}`
          const eraw = typeof localStorage !== 'undefined' ? localStorage.getItem(ekey) : null
          setExcludedTips(eraw ? JSON.parse(eraw) : [])
        } catch (_) {
          setExcludedTips([])
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

  const handleAlreadyDoThis = async (taskText) => {
    if (!taskText) return
    const next = [...new Set([...excludedTips, taskText])]
    setExcludedTips(next)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        localStorage.setItem(`tha_excluded_tips_${user.id}`, JSON.stringify(next))
      }
    } catch (_) { /* non-fatal */ }
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

  // ── Weekly tip selection ───────────────────────────────────────────────
  // Always run the picker — it handles missing-profile cases gracefully and
  // returns 3 mode-diverse tips (1 physical / 1 nutrition / 1 behavioral)
  // anchored on Coach K's foundation universals (walking/breathing, water
  // before meals, sleep priority). Profile data, when present, biases
  // category-specific tips up via risk-tag / chronotype / fitness signals.
  //
  // Static fallback (the protocol's daily_micro_wins) only fires if the
  // picker returns nothing — and even then we run them through
  // balanceTasksByMode to enforce the same 1-of-each rule.
  const personalizedTasks = (() => {
    if (!activeProtocol) return null
    const profile = cachedPhase2
      ? buildProfileFromUser({
          phase1Answers,
          phase2Answers: cachedPhase2.phase2Responses,
          rankedCategories: cachedPhase2.rankedCategories,
          activeCategoryId: activeProtocol.category,
          promotedTips: [],
          excludedTips,
        })
      : { excludedTips }
    const picks = pickTipsForUser(activeProtocol.category, activeProtocol.current_week, profile)
    return picks.length >= 3 ? picks : null
  })()

  const displayTasks = personalizedTasks
    ? personalizedTasks.map(p => p.tip)
    : balanceTasksByMode(
        (activeProtocol?.content?.daily_micro_wins || [])
          .filter(t => !excludedTips.includes(t))
      )
  const tasksAreFromTipBank = !!personalizedTasks

  return (
    <div className="coach-dashboard">
      {activeCheckin && (
        <WeeklyCheckin
          userProtocol={activeCheckin}
          tasksOverride={displayTasks}
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

      {/* If user has more than one active protocol (added another area
          via the dashboard prompt), show a switcher tab strip so they can
          flip between protocols. Default selection = the first-assigned. */}
      {activeProtocols.length > 1 && (
        <div className="active-protocol-tabs">
          <p className="tabs-label">You're working on {activeProtocols.length} areas:</p>
          <div className="tabs-row">
            {activeProtocols.map((p) => {
              const cat = PHASE2_CATEGORIES.find(c => c.id === p.category)
              const isCurrent = activeProtocol && activeProtocol.id === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`protocol-tab ${isCurrent ? 'is-current' : ''}`}
                  onClick={() => setActiveProtocol(p)}
                >
                  <span className="tab-icon">{cat?.icon || '🎯'}</span>
                  <span className="tab-label">{cat?.name || p.category}</span>
                  <span className="tab-week">W{p.current_week}</span>
                </button>
              )
            })}
          </div>
        </div>
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

          {/* This week's instruction — the headline assignment from Coach K.
              Designed to be the visual focal point of the dashboard so users
              read it before the numbered tasks underneath. */}
          <div className="this-week-block">
            <div className="coach-callout">
              <div className="coach-callout-label">
                <span className="coach-callout-icon">🎯</span>
                <span>This week's assignment from Coach K</span>
              </div>
              <p className="this-week-text">{activeProtocol.content.this_week}</p>
            </div>

            <h4 className="weekly-tasks-heading">
              Daily actions to support this
              {tasksAreFromTipBank && (
                <span className="personalized-badge" title="These actions are picked from the 700-tip library based on your profile">
                  · personalized for you
                </span>
              )}
            </h4>
            <ul className="weekly-tasks">
              {displayTasks.map((task, idx) => (
                <li key={idx}>
                  <span className="task-num">{idx + 1}.</span>
                  <span className="task-text">{task}</span>
                  <button
                    type="button"
                    className="task-swap-btn"
                    onClick={() => handleAlreadyDoThis(task)}
                    title="Swap this task for a different one"
                  >
                    SWAP for Different Task →
                  </button>
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

          <OptionalAddOns
            categoryId={activeProtocol.category}
            userSex={normalizeSex(phase1Answers?.[2]?.text)}
          />

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
                  onClick={onAddAnotherArea || onRetakeQuiz}
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

      <ShareApp />

      <div className="dashboard-footer">
        <button className="secondary-btn" onClick={onRetakeQuiz}>
          Retake Assessment
        </button>
        {onOpenSettings && (
          <button className="text-btn" onClick={onOpenSettings}>
            Settings
          </button>
        )}
        <button className="text-btn" onClick={onLogout}>
          Sign out
        </button>
      </div>
    </div>
  )
}
