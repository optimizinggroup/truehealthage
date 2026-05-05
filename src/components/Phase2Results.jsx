import { useState, useMemo } from 'react'
import {
  PHASE2_CATEGORIES,
  PHASE2_QUESTIONS,
  PROTOCOL_LIBRARY,
  getScoreStatus,
  calculateCategoryScore,
  aggregateRiskTags,
  checkEscalationFlags
} from '../utils/phase2Data'
import ProtocolDetail from './ProtocolDetail'
import '../styles/branding.css'
import '../styles/Phase2Results.css'

export default function Phase2Results({ phase1Results, phase2Data, selectedAreas, onComplete }) {
  const [expandedProtocol, setExpandedProtocol] = useState(null)

  // Calculate category scores and generate protocols
  const results = useMemo(() => {
    const categoryScores = {}
    const allRiskTags = {}
    const triggeredProtocols = new Set()
    let escalationFlags = []

    selectedAreas.forEach(categoryId => {
      const categoryQuestions = PHASE2_QUESTIONS[categoryId] || []
      const responses = phase2Data.responses[categoryId] || {}

      // Calculate score
      const score = calculateCategoryScore(responses, categoryQuestions)
      categoryScores[categoryId] = score

      // Aggregate risk tags
      const riskTags = aggregateRiskTags(responses, categoryQuestions)
      riskTags.forEach(tag => {
        allRiskTags[tag] = (allRiskTags[tag] || 0) + 1
      })

      // Collect triggered protocols
      Object.values(responses).forEach(response => {
        if (response.protocol_triggers) {
          response.protocol_triggers.forEach(trigger => {
            triggeredProtocols.add(trigger)
          })
        }
      })

      // Check escalation flags
      const flags = checkEscalationFlags(responses, categoryQuestions)
      if (flags.length > 0) {
        escalationFlags = [...escalationFlags, ...flags.map(f => ({ categoryId, ...f }))]
      }
    })

    // Rank categories by score (highest priority first)
    const rankedCategories = selectedAreas
      .map(categoryId => ({
        categoryId,
        score: categoryScores[categoryId],
        status: getScoreStatus(categoryScores[categoryId])
      }))
      .sort((a, b) => b.score - a.score)

    // Get protocols for triggered triggers, ranked by impact
    const protocols = Array.from(triggeredProtocols)
      .map(triggerName => {
        const protocol = PROTOCOL_LIBRARY[triggerName]
        const categoryData = PHASE2_CATEGORIES.find(c => c.id === protocol.category)
        return {
          name: triggerName,
          ...protocol,
          theme: categoryData?.protocol_theme || 'Daily Actions'
        }
      })
      .sort((a, b) => {
        // Sort by category priority, then by impact
        const aCategory = a.category
        const bCategory = b.category
        const aRank = rankedCategories.findIndex(c => c.categoryId === aCategory)
        const bRank = rankedCategories.findIndex(c => c.categoryId === bCategory)
        return aRank - bRank
      })
      .slice(0, 5) // Top 5 protocols

    // Sort risk tags by frequency
    const topRiskTags = Object.entries(allRiskTags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag)

    return {
      categoryScores,
      rankedCategories,
      protocols,
      topRiskTags,
      escalationFlags
    }
  }, [phase2Data, selectedAreas])

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
        <h2>Your Personalized Behavior-Change Plan</h2>
        <p>Based on your responses, here are your priority areas and daily actions to get started:</p>
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

      {/* Protocols/Micro-Wins */}
      <div className="protocols-section">
        <h3>Start Here: Your Daily Micro-Wins</h3>
        <p className="protocols-intro">
          These are small, actionable changes you can start TODAY. Focus on one or two to build momentum:
        </p>

        <div className="protocols-grid">
          {results.protocols.map((protocol, index) => {
            const category = PHASE2_CATEGORIES.find(c => c.id === protocol.category)

            return (
              <div
                key={protocol.name}
                className="protocol-card"
                onClick={() => setExpandedProtocol(expandedProtocol === protocol.name ? null : protocol.name)}
              >
                <div className="protocol-header">
                  <div className="protocol-rank">
                    <span className="rank-badge">{index + 1}</span>
                  </div>

                  <div className="protocol-info">
                    <span className="protocol-icon">{category?.icon}</span>
                    <div>
                      <h4>{protocol.name}</h4>
                      <p className="protocol-goal">{protocol.theme || 'Daily actions'}</p>
                    </div>
                  </div>
                </div>

                {expandedProtocol === protocol.name && (
                  <ProtocolDetail protocol={protocol} />
                )}

                <div className="protocol-toggle">
                  <small>{expandedProtocol === protocol.name ? 'Click to collapse' : 'Click to expand'}</small>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Risk Summary */}
      {results.topRiskTags.length > 0 && (
        <div className="risk-summary">
          <h3>Key Health Patterns We Noticed</h3>
          <div className="risk-tags">
            {results.topRiskTags.map(tag => (
              <span key={tag} className="risk-tag">{tag.replace(/_/g, ' ')}</span>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="results-disclaimer">
        <p>
          <strong>Educational Note:</strong> Phase 2 is a behavior-change assessment, not medical diagnosis.
          Results suggest areas where lifestyle changes may help. Always consult healthcare providers for medical concerns.
        </p>
      </div>

      <div className="results-footer">
        <button className="complete-btn" onClick={onComplete}>
          Complete
        </button>
      </div>
    </div>
  )
}
