import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { PHASE2_CATEGORIES } from '../utils/phase2Data'
import { COACHING_PROTOCOLS, resolveProtocol, cardioStageFromAnswer, cancerStageFromAnswer } from '../utils/coachingProtocols'
import { normalizeSex } from '../utils/optionalAddOns'
import { ensureNotificationPermission, scheduleWeeklyCheckin, scheduleDailyNudge } from '../utils/notifications'
import { track as phTrack } from '../utils/posthog'
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
export default function PrioritySelection({ phase1Results, phase2Results, onActivated, onSkip, onExploreMore }) {
  const [step, setStep] = useState('default') // 'default' | 'choose' | 'when'
  const [chosen, setChosen] = useState(null)  // the category+protocol bundle they picked
  const [error, setError] = useState(null)
  const [activating, setActivating] = useState(false)
  // Categories the user already has an active protocol for — used to filter
  // them out when this screen is shown via "add another area" flow. We don't
  // want to recommend the same area they're already working on.
  const [excludeCategories, setExcludeCategories] = useState(new Set())
  // When the user lands here via "add another area" (returning user, no fresh
  // phase1Results in state), pull their latest quiz answers from the DB so
  // we can still surface their stated goals + sex for sex-aware protocols.
  const [loadedPhase1, setLoadedPhase1] = useState(null)
  const effectivePhase1 = phase1Results || loadedPhase1

  // Always scroll to top when this screen mounts or step changes
  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'instant' })
  }, [step])

  // On mount, fetch the user's active protocols. Their categories get excluded
  // from the recommendation list — no point telling someone "your priority is
  // Stress & Mental Health" if they're already on week 3 of that protocol.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: rows } = await supabase
          .from('user_protocols')
          .select('category, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
        if (cancelled) return
        const cats = new Set((rows || []).map(r => r.category))
        setExcludeCategories(cats)

        // Fallback: load latest phase 1 answers from quiz_results when the
        // parent didn't pass them (returning user via "add another area").
        if (!phase1Results) {
          const { data: quizRow } = await supabase
            .from('quiz_results')
            .select('answers')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          if (!cancelled && quizRow?.answers) {
            setLoadedPhase1({ answers: quizRow.answers })
          }
        }
      } catch (_) { /* not fatal */ }
    })()
    return () => { cancelled = true }
  }, [phase1Results])

  // Build the actionable list: each category that has a triggered protocol AND
  // is not "Optimal". Top of the list is the worst-scoring (= most concerns).
  const rankedCategories = phase2Results?.rankedCategories || []
  const protocols = phase2Results?.protocols || []

  // User's stated goal categories from Phase 1 Q21. Even if a goal category
  // scored Optimal in Phase 2 (or wasn't part of the Quick Plan selection),
  // we promise the user it shows up here — they explicitly said they want
  // to work on it.
  const goalCategoryIds = (() => {
    const sels = effectivePhase1?.answers?.[21]?.selections
    if (!Array.isArray(sels)) return []
    return sels.map(s => s.goal).filter(Boolean)
  })()
  const userSex = normalizeSex(effectivePhase1?.answers?.[2]?.text)

  // Helper: find any authored protocol for a given category id. Used to give
  // a goal category a starter protocol even if none was triggered by the
  // Phase 2 score (or the user skipped Phase 2 questions for that category).
  const cardioStage = cardioStageFromAnswer(effectivePhase1?.answers?.[23]?.text)
  const cancerStage = cancerStageFromAnswer(effectivePhase1?.answers?.[24]?.text)
  const stageForProtocol = (key) => {
    if (key === 'CARDIOVASCULAR_PROTOCOL') return cardioStage
    if (key === 'CANCER_PROTOCOL') return cancerStage
    return null
  }
  const findProtocolForCategory = (categoryId) => {
    // For cardio/longevity categories, prefer the stage-aware disease-arc
    // protocol when the user has a real condition (Q23/Q24 non-prevention).
    // This routes someone with high BP to CARDIOVASCULAR_PROTOCOL instead of
    // a generic STEPS_PROTOCOL — the difference is night and day.
    if (categoryId === 'heart_fitness' && cardioStage && cardioStage !== 'prevention') {
      const base = COACHING_PROTOCOLS.CARDIOVASCULAR_PROTOCOL
      if (base) return { name: 'CARDIOVASCULAR_PROTOCOL', ...resolveProtocol(base, { sex: userSex, stage: cardioStage }) }
    }
    if (categoryId === 'longevity_prevention' && cancerStage && cancerStage !== 'prevention') {
      const base = COACHING_PROTOCOLS.CANCER_PROTOCOL
      if (base) return { name: 'CANCER_PROTOCOL', ...resolveProtocol(base, { sex: userSex, stage: cancerStage }) }
    }
    const triggered = protocols.find(p => p.category === categoryId)
    if (triggered) return triggered
    const fallbackEntry = Object.entries(COACHING_PROTOCOLS).find(
      ([_key, content]) => content?.category === categoryId
    )
    if (!fallbackEntry) return null
    const [name, baseContent] = fallbackEntry
    const content = resolveProtocol(baseContent, { sex: userSex, stage: stageForProtocol(name) })
    return { name, ...content }
  }

  const scoredCategories = rankedCategories
    .map((cat) => {
      const meta = PHASE2_CATEGORIES.find(c => c.id === cat.categoryId)
      const topProtocol = findProtocolForCategory(cat.categoryId)
      return {
        categoryId: cat.categoryId,
        categoryName: meta?.name || cat.categoryId,
        icon: meta?.icon || '🎯',
        score: cat.score,
        status: cat.status,
        topProtocol,
        isGoal: goalCategoryIds.includes(cat.categoryId),
      }
    })

  // Concern-based: categories with a protocol that aren't optimal and aren't
  // already an active focus. These keep their existing priority order (worst
  // score first).
  const concernCategories = scoredCategories
    .filter(c => c.topProtocol && c.status?.level !== 'optimal' && !excludeCategories.has(c.categoryId))

  // Goal-based: every goal the user stated, even if optimal or never scored.
  // These ride above concern categories in the list so we honor the user's
  // own choice. Excluded categories (already an active protocol) are still
  // skipped.
  const goalEntries = goalCategoryIds
    .filter(id => !excludeCategories.has(id))
    .map(id => {
      const existing = scoredCategories.find(c => c.categoryId === id)
      if (existing) return existing
      const meta = PHASE2_CATEGORIES.find(c => c.id === id)
      const topProtocol = findProtocolForCategory(id)
      if (!topProtocol) return null
      return {
        categoryId: id,
        categoryName: meta?.name || id,
        icon: meta?.icon || '🎯',
        score: null,             // wasn't part of Phase 2
        status: { level: 'goal', label: 'Your goal' },
        topProtocol,
        isGoal: true,
      }
    })
    .filter(Boolean)

  // Merge: goals first (in the order they picked them), then concern categories.
  // De-dup by categoryId in case a goal was also a scored concern.
  const seen = new Set()
  const actionableCategories = [...goalEntries, ...concernCategories]
    .filter(c => {
      if (seen.has(c.categoryId)) return false
      seen.add(c.categoryId)
      return true
    })

  // Categories the user took the Phase 2 quiz on that scored Optimal —
  // not "actionable" by score, but they may still want to swap focus into
  // one of them. Used to color the empty-state copy.
  const hasOptimalRemaining = rankedCategories
    .filter(c => !excludeCategories.has(c.categoryId))
    .some(c => c.status?.level === 'optimal')

  // Empty state — nothing actionable triggered (either everything they
  // assessed scored Optimal, or they've already picked all the ones that
  // didn't). Don't dead-end them — let them assess a different area.
  if (actionableCategories.length === 0) {
    return (
      <div className="priority-selection">
        <div className="priority-card">
          <h2>{hasOptimalRemaining ? "Nice — you're solid on what you assessed." : "You've got the priority areas covered."}</h2>
          <p>
            {hasOptimalRemaining
              ? "The categories you tested didn't surface a concern worth coaching you through. Want to try a different area of your health?"
              : "You're already working on the areas where you scored concerns. Want to assess a different area too?"}
          </p>
          <div className="priority-footer two-buttons">
            <button className="secondary-btn" onClick={onSkip}>
              Continue to Dashboard
            </button>
            {onExploreMore && (
              <button className="primary-btn" onClick={onExploreMore}>
                Assess another area →
              </button>
            )}
          </div>
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

      phTrack('protocol_selected', {
        category_id: currentChoice.categoryId,
        category_name: currentChoice.categoryName,
        protocol_key: currentChoice.topProtocol.name,
        priority_rank: actionableCategories.findIndex(c => c.categoryId === currentChoice.categoryId) + 1,
        was_top_recommendation: currentChoice.categoryId === topPriority.categoryId,
        start_when: when,
        score: currentChoice.score,
      })

      // Ask permission and schedule weekly check-in + daily nudge.
      // No-op on web; on iOS/Android this prompts the OS notification
      // permission dialog the first time, then schedules locally.
      try {
        const perm = await ensureNotificationPermission()
        if (perm.granted) {
          await scheduleWeeklyCheckin({
            protocolId: parseInt(user.id.replace(/-/g, '').slice(0, 6), 16) || 1,
            protocolName: currentChoice.categoryName,
          })
          await scheduleDailyNudge({ hour: 8 })
        }
      } catch (_) { /* non-fatal */ }

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
            ← Skip and go to dashboard
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
                    {cat.isGoal && <span className="priority-goal-tag">★ Your goal · </span>}
                    {cat.score != null ? `Score: ${cat.score} of 18 · ${cat.status?.label || ''}` : 'You picked this in Phase 1'}
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
            {onExploreMore && (
              <button
                type="button"
                className="text-btn"
                onClick={onExploreMore}
              >
                Assess a different area →
              </button>
            )}
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
