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
 * Three steps:
 *   1. Asks the protocol's weekly_check_in question, user picks 0 / partial / well
 *   2. Shows the adaptive branch copy in Coach K's voice
 *   3. Writes to protocol_checkins, increments user_protocols.current_week,
 *      and adjusts difficulty_tier if patterns warrant it
 */
export default function WeeklyCheckin({ userProtocol, onComplete, onCancel }) {
  const [step, setStep] = useState('question') // question | response | saving | done
  const [outcome, setOutcome] = useState(null) // 'did_well' | 'partial' | 'struggled'
  const [daysCompleted, setDaysCompleted] = useState(null)
  const [userNote, setUserNote] = useState('')
  const [error, setError] = useState(null)

  const content = userProtocol.content
  const checkinQuestion = content.weekly_check_in || 'How did this week go?'

  // Match days_completed to the right adaptive branch.
  // Week-target inferred from whatever number appears in the check-in question
  // (e.g. "at least 5 days" → target 5). Falls back to 4 if not found.
  const targetMatch = checkinQuestion.match(/(\d+)\s*(\+|\s*days?)/)
  const target = targetMatch ? parseInt(targetMatch[1], 10) : 4

  const handleOutcomePick = (days) => {
    setDaysCompleted(days)
    if (days >= target) {
      setOutcome('did_well')
    } else if (days >= 1) {
      setOutcome('partial')
    } else {
      setOutcome('struggled')
    }
    setStep('response')
  }

  const branchCopy = () => {
    if (outcome === 'did_well') return content.if_did_well || 'Great work this week — keep it going.'
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

      // Persist the check-in
      const { error: insertError } = await supabase.from('protocol_checkins').insert({
        user_id: user.id,
        user_protocol_id: userProtocol.id,
        week_number: userProtocol.current_week,
        days_completed: daysCompleted,
        goal_target: target,
        user_note: userNote || null,
        outcome,
        branch_shown: outcome,
      })
      if (insertError) {
        console.warn('checkin insert failed:', insertError)
        setError('Could not save your check-in. ' + insertError.message)
        setStep('response')
        return
      }

      // Adjust the user_protocol — advance week, optionally retune difficulty
      const updates = {
        current_week: userProtocol.current_week + 1,
      }
      // If they struggled this week, scale back next week's target.
      // If they crushed it 4 weeks running, advance — but that logic gets
      // computed elsewhere; here we just tag this week's outcome.
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
      // Auto-close after a moment so the dashboard refreshes
      setTimeout(() => onComplete(), 1200)
    } catch (err) {
      setError('Unexpected error: ' + (err.message || String(err)))
      setStep('response')
    }
  }

  return (
    <div className="weekly-checkin-overlay" onClick={onCancel}>
      <div className="weekly-checkin-modal" onClick={(e) => e.stopPropagation()}>
        {step === 'question' && (
          <>
            <div className="checkin-header">
              <h2>Week {userProtocol.current_week} Check-in</h2>
              <button className="close-btn" onClick={onCancel} aria-label="Close">×</button>
            </div>
            <p className="checkin-question">{checkinQuestion}</p>
            <p className="checkin-hint">Be honest — the data only helps if it's true. Pick the closest:</p>
            <div className="day-picker">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  className={`day-btn ${n === 0 ? 'zero' : n >= target ? 'win' : 'partial'}`}
                  onClick={() => handleOutcomePick(n)}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="day-legend">{'days completed (0 to 7)'}</p>
          </>
        )}

        {step === 'response' && (
          <>
            <div className="checkin-header">
              <h2>{branchTitle()}</h2>
              <button className="close-btn" onClick={onCancel} aria-label="Close">×</button>
            </div>
            <p className="branch-copy">{branchCopy()}</p>

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
              <button className="back-btn" onClick={() => setStep('question')}>← Change my answer</button>
              <button className="save-btn" onClick={handleSave}>Save check-in</button>
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
