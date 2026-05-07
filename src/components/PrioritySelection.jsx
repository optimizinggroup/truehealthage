import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { PHASE2_CATEGORIES } from '../utils/phase2Data'
import '../styles/PrioritySelection.css'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

/**
 * PrioritySelection — the "pick what to work on first" screen.
 *
 * Shows up after Phase2Results so the user sees what we identified, then
 * chooses ONE area to start with. We assign only that protocol — nothing
 * else. They can come back and add more after they make progress.
 *
 * This is Keith's stated coaching principle: "Lets pick biggest area of
 * concern tackle some key elements of that... start small."
 */
export default function PrioritySelection({ phase2Results, onActivated, onSkip }) {
  const [selectedKey, setSelectedKey] = useState(null)
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState(null)

  // The protocols from Phase 2 are already ranked by category-priority
  // (in Phase2Results' useMemo: rankedCategories drives sort order).
  const protocols = phase2Results?.protocols || []

  // If no protocols, the user had no concerns triggered — graceful skip
  if (protocols.length === 0) {
    return (
      <div className="priority-selection">
        <div className="priority-card">
          <h2>You're in good shape.</h2>
          <p>
            Your assessment didn't surface any priority concerns to coach you
            through right now. That's the goal — keep doing what you're doing.
          </p>
          <button className="primary-btn" onClick={onSkip}>
            Continue to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const handleStart = async () => {
    if (!selectedKey) return
    setActivating(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Skip the persistence and let App.jsx handle the missing-session case
        onActivated(selectedKey)
        return
      }
      const chosen = protocols.find(p => p.name === selectedKey)
      if (!chosen) {
        setError('Protocol selection error. Please try again.')
        setActivating(false)
        return
      }

      const { error: insertError } = await supabase.from('user_protocols').insert({
        user_id: user.id,
        protocol_key: chosen.name,
        category: chosen.category,
        current_week: 1,
        status: 'active',
        difficulty_tier: 'standard',
      })

      if (insertError && insertError.code !== '23505') {
        // 23505 = duplicate; the user already has this protocol active. Fine,
        // we just route to the dashboard.
        console.warn('user_protocols insert failed:', insertError)
        setError('Could not save your choice. ' + insertError.message)
        setActivating(false)
        return
      }

      onActivated(selectedKey)
    } catch (err) {
      console.warn('protocol activation error:', err)
      setError('Unexpected error: ' + (err.message || String(err)))
      setActivating(false)
    }
  }

  return (
    <div className="priority-selection">
      <div className="priority-card">
        <div className="priority-header">
          <h2>Pick where you want to start.</h2>
          <p className="priority-subhead">
            From Coach K — these are the areas that came up in your assessment.
            Real change happens when you focus on one thing at a time, not all
            at once. Pick the one that matters most to you right now.
          </p>
          <p className="priority-note">
            You can come back and add more once this one's working.
          </p>
        </div>

        <div className="priority-list">
          {protocols.map((protocol, idx) => {
            const category = PHASE2_CATEGORIES.find(c => c.id === protocol.category)
            const isSelected = selectedKey === protocol.name

            return (
              <button
                key={protocol.name}
                type="button"
                className={`priority-option ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedKey(protocol.name)}
              >
                <div className="priority-option-rank">
                  <span className="rank-number">{idx + 1}</span>
                </div>
                <div className="priority-option-body">
                  <div className="priority-option-header">
                    <span className="priority-icon">{category?.icon || '🎯'}</span>
                    <h3>{protocol.theme || protocol.name.replace(/_/g, ' ').toLowerCase()}</h3>
                  </div>
                  <p className="priority-option-meta">
                    {category?.name || protocol.category}
                  </p>
                  <p className="priority-option-preview">{protocol.this_week}</p>
                </div>
                <div className="priority-option-check">
                  {isSelected && <span className="checkmark">✓</span>}
                </div>
              </button>
            )
          })}
        </div>

        {error && <div className="priority-error">⚠️ {error}</div>}

        <div className="priority-footer">
          <button
            type="button"
            className="text-btn"
            onClick={onSkip}
            disabled={activating}
          >
            Skip for now
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={handleStart}
            disabled={!selectedKey || activating}
          >
            {activating ? 'Setting up your plan…' : selectedKey ? `Start with this →` : 'Pick one to continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
