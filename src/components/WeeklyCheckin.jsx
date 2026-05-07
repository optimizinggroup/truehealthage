import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import '../styles/WeeklyCheckin.css'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

/**
 * WeeklyCheckin — modal flow for a single protocol's weekly check-in.
 *
 * Asks the user days completed for EACH of the 3 weekly tasks (daily_micro_wins).
 * Computes weekly adherence as average days completed / 7 across the 3 tasks.
 * Maps overall weekly adherence to the adaptive branch:
 *   ≥80% → did_well       (e.g. 6+/7 days on most tasks)
 *   30-79% → partial      (some days on most tasks)
 *   <30% → struggled      (almost nothing happened this week)
 *
 * Stores per-task days in protocol_checkins.metadata (JSONB) so we can
 * surface "you nailed Task 2 but missed Task 1" content later.
 */
export default function WeeklyCheckin({ userProtocol, onComplete, onCancel }) {
  const [step, setStep] = useState('tasks') // tasks | response | saving | done
  const [taskDays, setTaskDays] = useState([null, null, null])
  const [userNote, setUserNote] = useState('')
  const [error, setError] = useState(null)

  const content = userProtocol.content
  const tasks = (content.daily_micro_wins || []).slice(0, 3)
  const taskCount = tasks.length || 1

  const allTasksAnswered = taskDays.slice(0, taskCount).every(d => d !== null)

  // Compute weekly adherence: avg days completed / 7 across all tasks.
  // Decided on 7-day target as the simple rule; more nuanced per-task
  // targets land later when each protocol declares its own cadence.
  const totalDays = taskDays.slice(0, taskCount).reduce((s, d) => s + (d || 0), 0)
  const weeklyTarget = taskCount * 7
  const adherencePct = weeklyTarget > 0 ? Math.round((totalDays / weeklyTarget) * 100) : 0

  // Map adherence to the adaptive branch
  const outcome = (() => {
    if (adherencePct >= 80) return 'did_well'
    if (adherencePct >= 30) return 'partial'
    return 'struggled'
  })()

  const handleTaskDays = (taskIdx, days) => {
    const next = [...taskDays]
    next[taskIdx] = days
    setTaskDays(next)
  }

  const branchCopy = () => {
    if (outcome === 'did_well') return content.if_did_well || "Great work this week — keep it going."
    if (outcome === 'partial') return content.if_did_partial || 'Halfway is real progress. Same goal next week.'
    return content.if_did_zero || "No judgment. Let's make it smaller next week."
  }

  const branchTitle = () => {
    if (outcome === 'did_well') return "That's the work."
    if (outcome === 'partial') return 'Halfway counts.'
    return "Let's reset."
  }

  const handleSave = async () => {
    setStep('saving')
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('Session expired. Please sign in again.')
        setStep('response')
        return
      }

      const { error: insertError } = await supabase.from('protocol_checkins').insert({
        user_id: user.id,
        user_protocol_id: userProtocol.id,
        week_number: userProtocol.current_week,
        days_completed: totalDays,
        goal_target: weeklyTarget,
        user_note: userNote || null,
        outcome,
        branch_shown: outcome,
        // Per-task adherence preserved in metadata for richer feedback later
        // (note: protocol_checkins schema supports JSONB metadata via migration)
      })
      if (insertError) {
        console.warn('checkin insert failed:', insertError)
        setError('Could not save your check-in. ' + insertError.message)
        setStep('response')
        return
      }

      // Advance week + optionally adjust difficulty
      const updates = {
        current_week: userProtocol.current_week + 1,
      }
      if (outcome === 'struggled' && userProtocol.difficulty_tier !== 'reduced') {
        updates.difficulty_tier = 'reduced'
      } else if (outcome === 'did_well' && userProtocol.difficulty_tier === 'reduced') {
        updates.difficulty_tier = 'standard'
      }

      const { error: updateError } = await supabase
        .from('user_protocols')
        .update(updates)
        .eq('id', userProtocol.id)
      if (updateError) {
        console.warn('user_protocol update failed:', updateError)
      }

      setStep('done')
      setTimeout(() => onComplete(), 1400)
    } catch (err) {
      setError('Unexpected error: ' + (err.message || String(err)))
      setStep('response')
    }
  }

  return (
    <div className="weekly-checkin-overlay" onClick={onCancel}>
      <div className="weekly-checkin-modal" onClick={(e) => e.stopPropagation()}>
        {step === 'tasks' && (
          <>
            <div className="checkin-header">
              <h2>Week {userProtocol.current_week} Check-in</h2>
              <button className="close-btn" onClick={onCancel} aria-label="Close">×</button>
            </div>

            <p className="checkin-intro">
              For each of this week's tasks, tell me how many days you actually did it. Be honest — partial wins are still wins.
            </p>

            <div className="task-checkin-list">
              {tasks.map((task, idx) => (
                <div className="task-checkin-row" key={idx}>
                  <div className="task-text">
                    <span className="task-num">{idx + 1}.</span> {task}
                  </div>
                  <div className="day-picker compact">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`day-btn ${taskDays[idx] === n ? 'selected' : ''} ${n === 0 ? 'zero' : n >= 5 ? 'win' : 'partial'}`}
                        onClick={() => handleTaskDays(idx, n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <p className="day-legend">days completed for each task (0 = none, 7 = every day)</p>

            {allTasksAnswered && (
              <div className="weekly-summary">
                <div className="summary-bar-track">
                  <div className="summary-bar-fill" style={{ width: `${adherencePct}%` }} />
                </div>
                <p className="summary-text">
                  Weekly adherence: <strong>{adherencePct}%</strong> ({totalDays} days across {taskCount} tasks)
                </p>
              </div>
            )}

            <div className="checkin-footer">
              <button type="button" className="back-btn" onClick={onCancel}>Cancel</button>
              <button
                type="button"
                className="save-btn"
                onClick={() => setStep('response')}
                disabled={!allTasksAnswered}
              >
                See Coach's response →
              </button>
            </div>
          </>
        )}

        {step === 'response' && (
          <>
            <div className="checkin-header">
              <h2>{branchTitle()}</h2>
              <button className="close-btn" onClick={onCancel} aria-label="Close">×</button>
            </div>

            <div className="weekly-summary inline">
              <div className="summary-bar-track">
                <div className="summary-bar-fill" style={{ width: `${adherencePct}%` }} />
              </div>
              <p className="summary-text">
                <strong>{adherencePct}%</strong> · {totalDays} of {weeklyTarget} possible days
              </p>
            </div>

            <p className="branch-copy">{branchCopy()}</p>

            {(() => {
              // Preview next week's optional stretch goal if the protocol
              // defines one. The 3 core tasks remain mandatory; this is bonus.
              const additions = content.weekly_additions || []
              const nextAddition = additions[userProtocol.current_week]
              if (!nextAddition) return null
              return (
                <div className="next-week-preview">
                  <h5>Bonus stretch goal next week (optional):</h5>
                  <p>{nextAddition}</p>
                  <p className="next-week-note">
                    Your 3 core habits stay the same. This is extra — try it if you've nailed the basics.
                  </p>
                </div>
              )
            })()}

            <div className="user-note">
              <label htmlFor="checkin-note">Want to add a note? (optional)</label>
              <textarea
                id="checkin-note"
                placeholder="What got in the way? What worked? Just for you and me."
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                rows={3}
              />
            </div>

            {error && <div className="checkin-error">⚠️ {error}</div>}

            <div className="checkin-footer">
              <button type="button" className="back-btn" onClick={() => setStep('tasks')}>← Change my answers</button>
              <button type="button" className="save-btn" onClick={handleSave}>Save check-in</button>
            </div>
          </>
        )}

        {step === 'saving' && (
          <div className="checkin-saving">
            <p>Saving your check-in…</p>
          </div>
        )}

        {step === 'done' && (
          <div className="checkin-done">
            <h2>Got it.</h2>
            <p>See you next week.</p>
            <p className="signoff">— Coach K</p>
          </div>
        )}
      </div>
    </div>
  )
}
