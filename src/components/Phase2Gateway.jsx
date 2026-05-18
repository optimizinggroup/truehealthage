import { useState } from 'react'
import { PHASE2_CATEGORIES } from '../utils/phase2Data'
import { getRecommendedProtocols } from '../utils/protocolMapping'
import { track as phTrack } from '../utils/posthog'
import '../styles/branding.css'
import '../styles/Phase2Gateway.css'

// Default trio used for "Quick Recommended" when the user hasn't picked
// goals — these three categories give the best baseline impact for most
// adults. Override is applied below if the user picked goals in Q21.
const DEFAULT_RECOMMENDED_TRIO = ['sleep_recovery', 'heart_fitness', 'weight_metabolism']

export default function Phase2Gateway({ phase1Results, onStart, onSkip }) {
  // 'options' (the new 3-card menu) | 'customize' (the picker the user
  // expands when they explicitly choose option 3)
  const [mode, setMode] = useState('options')
  const [selectedAreas, setSelectedAreas] = useState([])

  // Pull category ids the user named as goals in Phase 1 Q21 — used to
  // bias the "Quick Recommended" trio toward what they actually said
  // mattered to them. Falls back to a defensible default if they picked
  // fewer than 3 goals.
  const goalCategoryIds = (() => {
    const sels = phase1Results?.answers?.[21]?.selections
    if (!Array.isArray(sels)) return []
    return sels.map(s => s.goal).filter(Boolean)
  })()
  // Recommended trio = user's first 3 goals, padded with the default trio.
  const recommendedTrio = (() => {
    const out = []
    for (const id of goalCategoryIds) {
      if (out.length >= 3) break
      if (!out.includes(id)) out.push(id)
    }
    for (const id of DEFAULT_RECOMMENDED_TRIO) {
      if (out.length >= 3) break
      if (!out.includes(id)) out.push(id)
    }
    return out.slice(0, 3)
  })()

  const handleAreaToggle = (categoryId) => {
    if (selectedAreas.includes(categoryId)) {
      setSelectedAreas(selectedAreas.filter(id => id !== categoryId))
    } else {
      setSelectedAreas([...selectedAreas, categoryId])
    }
  }

  // Auto-start helpers — no second click required for Quick / Full options.
  const startQuick = () => {
    phTrack('phase2_started', { mode: 'quick_recommended', areas_count: recommendedTrio.length, areas: recommendedTrio })
    onStart(recommendedTrio)
  }
  const startFull = () => {
    const all = PHASE2_CATEGORIES.map(c => c.id)
    phTrack('phase2_started', { mode: 'full', areas_count: all.length, areas: all })
    onStart(all)
  }
  const startCustom = () => {
    if (selectedAreas.length === 0) return
    phTrack('phase2_started', { mode: 'customize', areas_count: selectedAreas.length, areas: selectedAreas })
    onStart(selectedAreas)
  }

  return (
    <div className="phase2-gateway">
      <div className="gateway-container">
        {/* Header */}
        <div className="gateway-header">
          <h1>Phase 2: Your Behavior-Change Plan</h1>
          <p>Let's identify the areas where you can make the biggest impact with small, daily changes.</p>
          {phase1Results && (
            <div className="phase1-context">
              <p>Based on your True Health Age of <strong>{Math.round(phase1Results.trueHealthAge)}</strong>, let's focus on what matters most.</p>
            </div>
          )}
        </div>

        {/* Recommended Protocols from Phase 1 */}
        {phase1Results?.categoryScores && (
          <div style={{
            marginBottom: '30px',
            padding: '20px',
            background: '#f0f4ff',
            borderRadius: '8px',
            borderLeft: '4px solid #667eea'
          }}>
            <h3 style={{ marginBottom: '15px', fontSize: '1.1rem', color: '#333' }}>
              💡 Our Recommendations for You:
            </h3>
            <p style={{ color: '#666', marginBottom: '12px', fontSize: '0.95rem' }}>
              Based on your assessment, these areas showed the most opportunity for improvement:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              {getRecommendedProtocols(phase1Results.categoryScores).map((protocol) => (
                <div key={protocol.protocol} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{protocol.emoji}</span>
                  <div>
                    <div style={{ fontWeight: '600', color: '#333' }}>{protocol.protocol}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>{protocol.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* THREE clear options — each card is the entire CTA. No second
            click required for options 1 and 2; the click on the card itself
            starts the assessment. Option 3 expands an inline picker. */}
        {mode === 'options' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '20px 0 24px' }}>
            {/* Option 1 — Quick Recommended */}
            <button
              type="button"
              onClick={startQuick}
              style={{
                background: 'linear-gradient(135deg, #0D9488 0%, #10B981 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '14px',
                padding: '20px 22px',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(13,148,136,0.25)',
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#FDE047', marginBottom: 4 }}>
                Recommended
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 6, color: '#fff' }}>
                🎯 Start with Recommended Quick Assessment
              </div>
              <div style={{ fontSize: '0.92rem', color: '#fff', opacity: 0.95, lineHeight: 1.45, marginBottom: 8 }}>
                We picked 3 areas based on your goals and results. Fastest path to your plan.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {recommendedTrio.map(id => {
                  const c = PHASE2_CATEGORIES.find(x => x.id === id)
                  if (!c) return null
                  return (
                    <span key={id} style={{ background: 'rgba(255,255,255,0.22)', color: '#fff', fontSize: '0.78rem', fontWeight: 600, padding: '4px 10px', borderRadius: 999 }}>
                      {c.icon} {c.name}
                    </span>
                  )
                })}
              </div>
              <div style={{ marginTop: 12, fontSize: '0.9rem', fontWeight: 700, color: '#FDE047' }}>Start now →</div>
            </button>

            {/* Option 2 — Full Assessment */}
            <button
              type="button"
              onClick={startFull}
              style={{
                background: '#fff',
                color: '#1f2937',
                border: '2px solid #cbd5e1',
                borderRadius: '14px',
                padding: '20px 22px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 6 }}>
                📋 Start with Full Assessment
              </div>
              <div style={{ fontSize: '0.92rem', color: '#4b5563', lineHeight: 1.45 }}>
                Cover all {PHASE2_CATEGORIES.length} health areas for the most thorough plan. Takes a few minutes longer.
              </div>
              <div style={{ marginTop: 10, fontSize: '0.9rem', fontWeight: 700, color: '#0D9488' }}>Start now →</div>
            </button>

            {/* Option 3 — Customize */}
            <button
              type="button"
              onClick={() => setMode('customize')}
              style={{
                background: '#fff',
                color: '#1f2937',
                border: '2px solid #cbd5e1',
                borderRadius: '14px',
                padding: '20px 22px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 6 }}>
                ⚙️ Customize My Assessment
              </div>
              <div style={{ fontSize: '0.92rem', color: '#4b5563', lineHeight: 1.45 }}>
                Pick exactly which areas you want to focus on.
              </div>
              <div style={{ marginTop: 10, fontSize: '0.9rem', fontWeight: 700, color: '#0D9488' }}>Pick areas →</div>
            </button>

            <button type="button" onClick={onSkip} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: '0.9rem', cursor: 'pointer', marginTop: 4, padding: 8 }}>
              Skip for now
            </button>
          </div>
        )}

        {/* Customize picker (only when user explicitly chose Option 3) */}
        {mode === 'customize' && (
          <div className="quick-mode">
            <button type="button" onClick={() => setMode('options')} style={{ background: 'transparent', border: 'none', color: '#0D9488', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', marginBottom: 12, padding: 0 }}>
              ← Back to options
            </button>
            <h2>Pick the areas you want to focus on</h2>
            <p className="mode-instruction">
              Choose any number — even just one is fine. We'll help you focus on the most important first.
            </p>
            <div className="categories-grid">
              {PHASE2_CATEGORIES.map(category => {
                const isGoal = goalCategoryIds.includes(category.id)
                return (
                  <div
                    key={category.id}
                    className={`category-card ${selectedAreas.includes(category.id) ? 'selected' : ''}`}
                    onClick={() => handleAreaToggle(category.id)}
                  >
                    <div className="card-icon">{category.icon}</div>
                    <h3>{category.name}</h3>
                    <p>{category.description}</p>
                    {isGoal && (<div className="goal-badge">★ Your goal</div>)}
                    {selectedAreas.includes(category.id) && (<div className="selection-badge">✓ Selected</div>)}
                  </div>
                )
              })}
            </div>
            <p className="selection-count">
              {selectedAreas.length === 0
                ? 'Select at least 1 area'
                : `${selectedAreas.length} ${selectedAreas.length === 1 ? 'area' : 'areas'} selected`}
            </p>
            <div className="gateway-footer">
              <button className="skip-btn" onClick={onSkip}>Skip Phase 2</button>
              <button
                className={`continue-btn ${selectedAreas.length > 0 ? 'active' : 'disabled'}`}
                onClick={startCustom}
                disabled={selectedAreas.length === 0}
              >
                Continue to Assessment
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
