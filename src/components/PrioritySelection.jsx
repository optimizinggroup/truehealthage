import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { PHASE2_CATEGORIES } from '../utils/phase2Data'
import '../styles/PrioritySelection.css'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

/**
 * PrioritySelection — three-step flow per Keith's coaching spec:
 *
 *   Step 1 (default):  "Your priority is [X]. Want to start there?"
 *                       [Yes, start here]  [Choose another area]
 *
 *   Step 2 (choose):   List of all categories needing attention,
 *                       sorted worst-first. User picks one.
 *
 *   Step 3 (when):     "Ready to start today or tomorrow?"
 *                       Records start choice, activates the protocol,
 *                       routes to the dashboard.
 *
 * Key behavior change from v1: this now picks at the CATEGORY level,
 * not the protocol level. Once a category is chosen, we activate the
 * highest-priority protocol within that category. The user never sees
 * raw protocol keys like RECOVERY_TIME or STRESS_MANAGEMENT — they
 * see the friendly category name (e.g. "Stress & Mental Health").
 */
export default function PrioritySelection({ phase2Results, onActivated, onSkip }) {
  const [step, setStep] = useState('default') // 'default' | 'choose' | 'when'
  const [chosen, setChosen] = useState(null)  // the category+protocol bundle they picked
  const [error, setError] = useState(null)
  const [activating, setActivating] = useState(false)

  // Always scroll to top when this screen mounts or step changes
  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' })
  }, [step])

  // Build the actionable list: each category that has a triggered protocol AND
  // is not "Optimal". Top of the list is the worst-scoring (= most concerns).
  const rankedCategories = phase2Results?.rankedCategories || []
  const protocols = phase2Results?.protocols || []

  const actionableCategories = rankedCategories
    .map((cat) => {
      const meta = PHASE2_CATEGORIES.find(c => c.id === cat.categoryId)
      const topProtocol = protocols.find(p => p.category === cat.categoryId)
      return {
        categoryId: cat.categoryId,
        categoryName: meta?.name || cat.categoryId,
        icon: meta?.icon || '🎯',
        score: cat.score,
        status: cat.status,
        topProtocol,
      }
    })
    // Skip categories with no triggered protocol AND skip optimal categories
    .filter(c => c.topProtocol && c.status?.level !== 'optimal')

  // Empty state — nothing actionable triggered
  if (actionableCategories.length === 0) {
    return (
      <div className="priority-selection">
        <div className="priority-card">
          <h2>You're in good shape.</h2>
          <p>
            Your assessment didn't surface any priority concerns to coach you through right now. Keep doing what you're doing.
          </p>
          <button className="primary-btn" onClick={onSkip}>
            Continue to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const topPriority = actionableCategories[0]
  const currentChoice = chosen || topPriority

  const handleConfirmTop = () => {
    setChosen(topPriority)
    setStep('when')
  }

  const handlePickFromList = (category) => {
    setChosen(category)
    setStep('when')
  }

  const handleStart = async (when) => {
    if (!currentChoice?.topProtocol) return
    setActivating(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // No session — just route through without persistence
        onActivated(currentChoice.topProtocol.name, when)
        return
      }

      const { error: insertError } = await supabase.from('user_protocols').insert({
        user_id: user.id,
        protocol_key: currentChoice.topProtocol.name,
        category: currentChoice.categoryId,
        current_week: 1,
        status: 'active',
        difficulty_tier: 'standard',
        notes: `Start preference: ${when}`,
      })

      if (insertError && insertError.code !== '23505') {
        console.warn('user_protocols insert failed:', insertError)
        setError('Could not save your choice. ' + insertError.message)
        setActivating(false)
        return
      }

      onActivated(currentChoice.topProtocol.name, when)
    } catch (err) {
      setError('Unexpected error: ' + (err.message || String(err)))
      setActivating(false)
    }
  }

  // ─── STEP 1: default recommendation ─────────────────────────────────────
  if (step === 'default') {
    return (
      <div className="priority-selection">
        <div className="priority-card">
          <div className="priority-header">
            <p className="priority-eyebrow">From Coach K</p>
            <h2>
              Your priority is <span className="highlight">{topPriority.categoryName}</span>.
            </h2>
            <p className="priority-subhead">
              This is the area where you scored the most concerns ({topPriority.score} of 18). It's where small, consistent changes will move the needle the most for you. Want to start here?
            </p>
          </div>

          <div className="priority-default-card">
            <div className="default-icon">{topPriority.icon}</div>
            <div className="default-body">
              <h3>{topPriority.categoryName}</h3>
              <p>{topPriority.topProtocol.this_week}</p>
            </div>
          </div>

          <div className={`priority-footer ${actionableCategories.length > 1 ? 'two-buttons' : ''}`}>
            {actionableCategories.length > 1 && (
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setStep('choose')}
              >
                Choose another area
              </button>
            )}
            <button
              type="button"
              className="primary-btn"
              onClick={handleConfirmTop}
            >
              Yes, start here →
            </button>
          </div>

          <button
            type="button"
            className="text-btn skip-btn"
            onClick={onSkip}
          >
            Skip — go straight to dashboard
          </button>
        </div>
      </div>
    )
  }

  // ─── STEP 2: pick from the list ─────────────────────────────────────────
  if (step === 'choose') {
    return (
      <div className="priority-selection">
        <div className="priority-card">
          <div className="priority-header">
            <p className="priority-eyebrow">From Coach K</p>
            <h2>Pick the area you want to work on first.</h2>
            <p className="priority-subhead">
              Listed worst-first, but you know your life better than the score does. Pick whichever feels most urgent right now.
            </p>
          </div>

          <div className="priority-list">
            {actionableCategories.map((cat) => (
              <button
                key={cat.categoryId}
                type="button"
                className="priority-option"
                onClick={() => handlePickFromList(cat)}
              >
                <div className="priority-option-rank">
                  <span className="priority-icon">{cat.icon}</span>
                </div>
                <div className="priority-option-body">
                  <h3>{cat.categoryName}</h3>
                  <p className="priority-option-meta">
                    Score: {cat.score} of 18 · {cat.status?.label}
                  </p>
                </div>
                <div className="priority-option-check">→</div>
              </button>
            ))}
          </div>

          <div className="priority-footer">
            <button
              type="button"
              className="text-btn"
              onClick={() => setStep('default')}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ─── STEP 3: when do you want to start ──────────────────────────────────
  if (step === 'when') {
    return (
      <div className="priority-selection">
        <div className="priority-card">
          <div className="priority-header">
            <p className="priority-eyebrow">From Coach K</p>
            <h2>One last question — when do you want to start?</h2>
            <p className="priority-subhead">
              You picked <strong>{currentChoice.categoryName}</strong>. I'll send your first daily action through the app and email — you tell me when you want it.
            </p>
          </div>

          <div className="when-options">
            <button
              type="button"
              className="when-option today"
              onClick={() => handleStart('today')}
              disabled={activating}
            >
              <div className="when-icon">⚡</div>
              <h3>Start Today</h3>
              <p>I'm ready. Send my first action right after this.</p>
            </button>

            <button
              type="button"
              className="when-option tomorrow"
              onClick={() => handleStart('tomorrow')}
              disabled={activating}
            >
              <div className="when-icon">🌅</div>
              <h3>Start Tomorrow</h3>
              <p>Give me one day to mentally prepare. First action arrives tomorrow morning.</p>
            </button>
          </div>

          {error && <div className="priority-error">⚠️ {error}</div>}

          <div className="priority-footer">
            <button
              type="button"
              className="text-btn"
              onClick={() => setStep('default')}
              disabled={activating}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
