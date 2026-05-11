import { useState } from 'react'
import { PHASE2_CATEGORIES } from '../utils/phase2Data'
import { getRecommendedProtocols } from '../utils/protocolMapping'
import '../styles/branding.css'
import '../styles/Phase2Gateway.css'

export default function Phase2Gateway({ phase1Results, onStart, onSkip }) {
  const [mode, setMode] = useState('quick') // 'quick' or 'full'
  const [selectedAreas, setSelectedAreas] = useState([])

  const handleAreaToggle = (categoryId) => {
    if (selectedAreas.includes(categoryId)) {
      setSelectedAreas(selectedAreas.filter(id => id !== categoryId))
    } else {
      // Per the May 2026 spec: users may select any number of areas. The
      // top-3 limit on Quick Plan was removed so users can pick what
      // actually matters to them. PrioritySelection still asks them to
      // start with one area at a time.
      setSelectedAreas([...selectedAreas, categoryId])
    }
  }

  const handleContinue = () => {
    if (selectedAreas.length === 0) return
    onStart(selectedAreas)
  }

  const isQuickValid = mode === 'quick' && selectedAreas.length > 0
  const isFullValid = mode === 'full'

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

        {/* Mode Selection */}
        <div className="mode-selector">
          <div
            className={`mode-card ${mode === 'quick' ? 'active' : ''}`}
            onClick={() => {
              setMode('quick')
              setSelectedAreas([])
            }}
          >
            <h3>Quick Plan</h3>
            <p>Choose the areas you want to focus on</p>
            <small>~5 min per area</small>
          </div>

          <div
            className={`mode-card ${mode === 'full' ? 'active' : ''}`}
            onClick={() => {
              setMode('full')
              setSelectedAreas(PHASE2_CATEGORIES.map(c => c.id))
            }}
          >
            <h3>Full Assessment</h3>
            <p>Complete evaluation across all health areas</p>
            <small>~5 min per area</small>
          </div>
        </div>

        {/* Category Selection (Quick Mode) */}
        {mode === 'quick' && (
          <div className="quick-mode">
            <h2>Select focus areas</h2>
            <p className="mode-instruction">
              Choose any areas you want to work on. You can pick one, a few, or all of them — we'll help you focus on one at a time.
            </p>
            <div className="categories-grid">
              {PHASE2_CATEGORIES.map(category => (
                <div
                  key={category.id}
                  className={`category-card ${selectedAreas.includes(category.id) ? 'selected' : ''}`}
                  onClick={() => handleAreaToggle(category.id)}
                >
                  <div className="card-icon">{category.icon}</div>
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                  {selectedAreas.includes(category.id) && (
                    <div className="selection-badge">✓ Selected</div>
                  )}
                </div>
              ))}
            </div>
            <p className="selection-count">
              {selectedAreas.length === 0
                ? 'Select at least 1 area'
                : `${selectedAreas.length} ${selectedAreas.length === 1 ? 'area' : 'areas'} selected`}
            </p>
          </div>
        )}

        {/* Category Overview (Full Mode) */}
        {mode === 'full' && (
          <div className="full-mode">
            <h2>Full Assessment</h2>
            <p className="mode-instruction">
              We'll ask 6 questions in each of these areas to create a personalized plan:
            </p>
            <div className="categories-list">
              {PHASE2_CATEGORIES.map(category => (
                <div key={category.id} className="category-item">
                  <span className="category-icon">{category.icon}</span>
                  <div className="category-info">
                    <h4>{category.name}</h4>
                    <p>{category.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="assessment-note">
              💡 You can pause and resume your full assessment at any point.
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="gateway-footer">
          <button
            className="skip-btn"
            onClick={onSkip}
          >
            Skip Phase 2
          </button>
          <button
            className={`continue-btn ${(isQuickValid || isFullValid) ? 'active' : 'disabled'}`}
            onClick={handleContinue}
            disabled={!isQuickValid && !isFullValid}
          >
            Continue to Assessment
          </button>
        </div>
      </div>
    </div>
  )
}
