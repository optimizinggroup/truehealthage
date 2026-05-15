import { useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import {
  PHASE2_CATEGORIES,
  PHASE2_QUESTIONS,
  PROTOCOL_LIBRARY,
  getScoreStatus,
  calculateCategoryScore,
  aggregateRiskTags,
  checkEscalationFlags
} from '../utils/phase2Data'
import { resolveProtocol, cardioStageFromAnswer, cancerStageFromAnswer } from '../utils/coachingProtocols'
import { normalizeSex } from '../utils/optionalAddOns'
import '../styles/branding.css'
import '../styles/Phase2Results.css'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default function Phase2Results({ phase1Results, phase2Data, selectedAreas, onComplete }) {
  const hasValidData = !!(phase2Data && phase2Data.responses && selectedAreas && selectedAreas.length > 0)

  // Calculate category scores and generate protocols.
  // Hooks must run on every render in the same order, so we always call useMemo
  // and short-circuit inside it when data is missing.
  const results = useMemo(() => {
    if (!hasValidData) {
      return { categoryScores: {}, rankedCategories: [], protocols: [], topRiskTags: [], escalationFlags: [] }
    }

    const categoryScores = {}
    const allRiskTags = {}
    const triggeredProtocols = new Set()
    let escalationFlags = []

    selectedAreas.forEach(categoryId => {
      const categoryQuestions = PHASE2_QUESTIONS[categoryId] || []
      const responses = phase2Data.responses[categoryId] || {}

      const score = calculateCategoryScore(responses, categoryQuestions)
      categoryScores[categoryId] = score

      const riskTags = aggregateRiskTags(responses, categoryQuestions)
      riskTags.forEach(tag => {
        allRiskTags[tag] = (allRiskTags[tag] || 0) + 1
      })

      Object.values(responses).forEach(response => {
        if (response.protocol_triggers) {
          response.protocol_triggers.forEach(trigger => {
            triggeredProtocols.add(trigger)
          })
        }
      })

      const flags = checkEscalationFlags(responses, categoryQuestions)
      if (flags.length > 0) {
        escalationFlags = [...escalationFlags, ...flags.map(f => ({ categoryId, ...f }))]
      }
    })

    const rankedCategories = selectedAreas
      .map(categoryId => ({
        categoryId,
        score: categoryScores[categoryId],
        status: getScoreStatus(categoryScores[categoryId])
      }))
      .sort((a, b) => b.score - a.score)

    // Skip triggers without a protocol entry. Many trigger names referenced in
    // questions (e.g. SLEEP_QUALITY, BALANCED_MEALS) are not yet authored in
    // PROTOCOL_LIBRARY. Rather than crash, drop them and log so the gap is visible.
    const userSex = normalizeSex(phase1Results?.answers?.[2]?.text)
    const cardioStage = cardioStageFromAnswer(phase1Results?.answers?.[23]?.text)
    const cancerStage = cancerStageFromAnswer(phase1Results?.answers?.[24]?.text)
    const protocols = Array.from(triggeredProtocols)
      .map(triggerName => {
        const baseProtocol = PROTOCOL_LIBRARY[triggerName]
        if (!baseProtocol) {
          if (typeof console !== 'undefined') {
            console.warn(`[Phase2Results] Missing PROTOCOL_LIBRARY entry: ${triggerName}`)
          }
          return null
        }
        let stage = null
        if (triggerName === 'CARDIOVASCULAR_PROTOCOL') stage = cardioStage
        else if (triggerName === 'CANCER_PROTOCOL') stage = cancerStage
        const protocol = resolveProtocol(baseProtocol, { sex: userSex, stage })
        const categoryData = PHASE2_CATEGORIES.find(c => c.id === protocol.category)
        return {
          name: triggerName,
          ...protocol,
          icon: categoryData?.icon,
          theme: categoryData?.protocol_theme || 'Daily Actions'
        }
      })
      .filter(Boolean)
      .sort((a, b) => {
        const aRank = rankedCategories.findIndex(c => c.categoryId === a.category)
        const bRank = rankedCategories.findIndex(c => c.categoryId === b.category)
        return aRank - bRank
      })
    // ^ NOT sliced. Used to be .slice(0, 5) which dropped protocols outside
    //   the top 5 — meaning the PrioritySelection screen could only offer
    //   categories with a protocol in the top 5. If the user had concerns in
    //   six categories but only four made the cut, the 5th and 6th were
    //   silently invisible. Now PrioritySelection sees the full set.
    const protocolsTop5 = protocols.slice(0, 5)

    const topRiskTags = Object.entries(allRiskTags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag)

    return {
      categoryScores,
      rankedCategories,
      protocols,           // full list, used by PrioritySelection
      protocolsTop5,       // top-5 only, used by legacy ResultsPage display
      topRiskTags,
      // Full risk-tag list (not sliced) — used by tipPicker to personalize
      // weekly actions on the dashboard. We keep topRiskTags too for the
      // legacy "Priority Areas" display that only wants the top 5.
      allRiskTags: Object.keys(allRiskTags),
      escalationFlags,
      // Phase 2 raw responses, needed for chronotype detection (sr_q4) and
      // any future per-question signal extraction in tipPicker.
      phase2Responses: phase2Data?.responses || {},
    }
  }, [phase2Data, selectedAreas, hasValidData])

  if (!hasValidData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        <p>Loading your results...</p>
      </div>
    )
  }

  // Handler for complete button — passes calculated results back to parent.
  // We DO NOT auto-assign protocols here anymore. The user picks their
  // priority order on the next screen (PrioritySelection), and only the
  // first chosen protocol gets activated. Coaching one thing at a time
  // is what makes this stick — assigning all 3 at once is the "list of
  // tips" pattern Keith specifically rejected.
  //
  // Also persist the full results to localStorage so the dashboard can
  // offer "Add another area" later without forcing a full reassessment —
  // we read these cached results to populate PrioritySelection again.
  const handleComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && typeof localStorage !== 'undefined') {
        localStorage.setItem(
          `tha_last_phase2_results_${user.id}`,
          JSON.stringify({
            categoryScores: results.categoryScores,
            rankedCategories: results.rankedCategories,
            protocols: results.protocols,
            protocolsTop5: results.protocolsTop5,
            topRiskTags: results.topRiskTags,
            allRiskTags: results.allRiskTags,
            phase2Responses: results.phase2Responses,
            escalationFlags: results.escalationFlags,
            cachedAt: Date.now(),
          })
        )
      }
    } catch (_) { /* private mode etc. */ }

    const resultData = {
      categoryScores: results.categoryScores,
      rankedCategories: results.rankedCategories,
      protocols: results.protocols,
      topRiskTags: results.topRiskTags,
      escalationFlags: results.escalationFlags,
      // Legacy fields kept only for backward compat — ResultsPage no longer
      // shows the broken 10-area "X/100" deep-dive section that used these.
      areaScores: results.categoryScores,
      recommendations: (results.protocolsTop5 || results.protocols.slice(0, 5)).map(p => {
        const headline = p.theme || p.name
        const firstAction = p.daily_micro_wins?.[0] || ''
        return `${p.icon || ''} ${headline}${firstAction ? ': ' + firstAction : ''}`.trim()
      }),
      priorityFactors: results.topRiskTags
    }
    onComplete(resultData)
  }

  return (
    <div className="phase2-results">
      {/* Branding Header */}
      <div className="branding-header results-branding">
        <div className="logo-icon small">
          <svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
            {/* Two people figures */}
            <circle cx="40" cy="35" r="7" fill="#0D9488"/>
            <circle cx="80" cy="35" r="7" fill="#10B981"/>
            {/* Circle background */}
            <circle cx="60" cy="70" r="50" fill="none" stroke="#0D9488" strokeWidth="2.5"/>
            <path d="M 35 45 Q 35 60 40 70 L 40 85" fill="none" stroke="#0D9488" strokeWidth="2"/>
            <path d="M 85 45 Q 85 60 80 70 L 80 85" fill="none" stroke="#10B981" strokeWidth="2"/>
            {/* Heart in center with cross */}
            <path d="M 60 50 Q 52 45 48 50 Q 45 53 45 57 Q 45 62 60 72 Q 75 62 75 57 Q 75 53 72 50 Q 68 45 60 50" fill="#10B981"/>
            <line x1="60" y1="55" x2="60" y2="68" stroke="white" strokeWidth="2"/>
            <line x1="53" y1="61" x2="67" y2="61" stroke="white" strokeWidth="2"/>
          </svg>
        </div>
        <h2 className="brand-heading">True<span className="accent">Health</span> Protocol</h2>
      </div>

      <div className="results-header">
        <h2>Here's What I Found</h2>
        <p>Your responses tell me where you have the most room to improve. The next screen will let you pick where you want to start — we work on one area at a time, on purpose.</p>
      </div>

      {/* Escalation Warnings */}
      {results.escalationFlags.length > 0 && (
        <div className="escalation-warning">
          <div className="warning-icon">⚠️</div>
          <div className="warning-content">
            <h3>Important - Medical Review Recommended</h3>
            <p>
              Your responses indicate some health concerns that deserve professional evaluation:
            </p>
            <ul>
              {results.escalationFlags.map((flag, idx) => (
                <li key={idx}>{flag.message}</li>
              ))}
            </ul>
            <p className="warning-note">
              💡 Phase 2 is educational. Please schedule a visit with your healthcare provider to discuss these concerns.
            </p>
          </div>
        </div>
      )}

      {/* Category Scores */}
      <div className="category-scores">
        <h3>Your Assessment Results</h3>
        <p className="scores-legend">
          Each category is scored 0–18, where the number reflects how many areas need attention. <strong>Lower is healthier.</strong> 0–4 = Optimal · 5–9 = Needs Attention · 10+ = High Priority.
        </p>
        <div className="scores-grid">
          {results.rankedCategories.map(({ categoryId, score, status }) => {
            const category = PHASE2_CATEGORIES.find(c => c.id === categoryId)
            const statusColor = status.color

            return (
              <div key={categoryId} className="score-card">
                <div className="score-header">
                  <span className="category-icon">{category.icon}</span>
                  <h4>{category.name}</h4>
                </div>
                <div className="score-display">
                  <div className="score-number">{score}</div>
                  <div className="score-max">of 18</div>
                </div>
                <div className={`score-status ${status.level}`}>
                  {status.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="results-disclaimer">
        <p>
          <strong>Educational Note:</strong> This is a behavior-change assessment, not a medical diagnosis. Results suggest areas where lifestyle changes may help. Always consult healthcare providers for medical concerns.
        </p>
      </div>

      <div className="results-footer">
        <button className="complete-btn" onClick={handleComplete}>
          Continue — Pick Where to Start →
        </button>
      </div>
    </div>
  )
}
