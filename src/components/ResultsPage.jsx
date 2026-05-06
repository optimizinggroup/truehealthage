import { useState } from 'react'
import ShareComponent from './ShareComponent'
import ResultsReport from './ResultsReport'
import { getRecommendedProtocols } from '../utils/protocolMapping'
import '../styles/ResultsPage.css'

export default function ResultsPage({
  phase1Results,
  phase2Results,
  resultId,
  userEmail,
  showPhase2Option,
  onPhase2Selection,
  onSkipPhase2,
  onRetakeQuiz,
  onLogout
}) {
  const [showShare, setShowShare] = useState(false)

  if (!phase1Results) return null

  const getGradeColor = (grade) => {
    const colors = {
      'A+': '#4CAF50',
      'A': '#66BB6A',
      'B': '#FFC107',
      'C': '#FF9800',
      'D': '#F44336',
    }
    return colors[grade] || '#999'
  }

  return (
    <div className="results-page">
      <div className="results-container">
        {/* Phase 1 Results */}
        <section className="phase1-results">
          <h2>Your True Health Age Assessment</h2>

          <div className="results-grid">
            <div className="result-card grade-card" style={{ borderColor: getGradeColor(phase1Results.grade) }}>
              <div className="grade-display" style={{ color: getGradeColor(phase1Results.grade) }}>
                {phase1Results.grade}
              </div>
              <p className="grade-label">{phase1Results.label}</p>
            </div>

            <div className="result-card">
              <h3>True Health Age</h3>
              <div className="big-number">{phase1Results.trueHealthAge}</div>
              <p className="description">Your biological health age</p>
            </div>

            <div className="result-card">
              <h3>Actual Age</h3>
              <div className="big-number">{phase1Results.chronoAge}</div>
              <p className="description">Your chronological age</p>
            </div>

            <div className={`result-card ${phase1Results.ageDiff >= 0 ? 'positive' : 'negative'}`}>
              <h3>Health Gap</h3>
              <div className="big-number">
                {phase1Results.ageDiff >= 0 ? '+' : ''}{phase1Results.ageDiff}
              </div>
              <p className="description">
                {phase1Results.ageDiff >= 0
                  ? 'Years older than actual age'
                  : 'Years younger than actual age'}
              </p>
            </div>
          </div>

          {/* Category Breakdown with "Why It Matters" */}
          {phase1Results.categoryScores && (
            <div style={{ marginTop: '40px', marginBottom: '40px' }}>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '20px', color: '#333' }}>📊 Your Health by Category</h3>
              {Object.entries(phase1Results.categoryScores).map(([category, scoreObj]) => {
                const status = scoreObj.status || 'Good'
                const years = scoreObj.years || 0
                const color = scoreObj.color || '#999'
                const whyItMatters = scoreObj.whyItMatters || ''
                const improvementSteps = scoreObj.improvementSteps || []

                return (
                  <div
                    key={category}
                    style={{
                      padding: '20px',
                      background: '#f9f9f9',
                      borderLeft: `4px solid ${color}`,
                      marginBottom: '15px',
                      borderRadius: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '5px' }}>{category.replace(/_/g, ' ')}</h4>
                        <p style={{ color: color, fontSize: '1rem', fontWeight: '600' }}>
                          {status === 'Great' && '🟢 Great'}
                          {status === 'Good' && '🟢 Good'}
                          {status === 'Moderate Concern' && '🟡 Moderate Concern'}
                          {status === 'Serious Concern' && '🔴 Serious Concern'}
                        </p>
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: '600', color: color }}>
                        {years > 0 ? `+${years} years` : years < 0 ? `${years} years` : 'Neutral'}
                      </div>
                    </div>
                    {whyItMatters && (
                      <p style={{ fontSize: '0.95rem', color: '#555', marginBottom: '12px', lineHeight: '1.5' }}>
                        {whyItMatters}
                      </p>
                    )}
                    {improvementSteps.length > 0 && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${color}33` }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: '600', color: color, marginBottom: '8px' }}>💡 Next Steps:</p>
                        {improvementSteps.map((step, idx) => (
                          <p key={idx} style={{ fontSize: '0.85rem', color: '#555', marginBottom: '6px', marginLeft: '12px' }}>
                            • {step}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Protocol Recommendations */}
          {phase1Results.categoryScores && (
            <div style={{ marginTop: '40px', marginBottom: '40px', padding: '20px', background: '#f0f4ff', borderRadius: '8px', borderLeft: '4px solid #667eea' }}>
              <h3 style={{ fontSize: '1.3rem', marginBottom: '10px' }}>🎯 Based on Your Health Age</h3>
              <p style={{ color: '#555', marginBottom: '20px' }}>We recommend diving deeper into these protocols to improve your health:</p>
              {getRecommendedProtocols(phase1Results.categoryScores).map((protocol) => (
                <div key={protocol.protocol} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <span style={{ fontSize: '1.5rem', marginRight: '15px' }}>{protocol.emoji}</span>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '4px' }}>{protocol.protocol}</h4>
                    <p style={{ fontSize: '0.9rem', color: '#666' }}>{protocol.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results Report - Detailed breakdown with categories and explanations */}
          <ResultsReport
            phase1Results={phase1Results}
            userEmail={userEmail}
            onStartProtocol={onPhase2Selection}
          />

          {/* Phase 2 Gateway */}
          {showPhase2Option && (
            <section className="phase2-gateway">
              <h3>Get Your Personalized TrueHealth Protocol</h3>
              <p className="gateway-description">Based on your assessment, we've identified specific areas where targeted actions can help improve your health. Select the areas most important to you and get a personalized action plan.</p>
              <button
                className="proceed-btn"
                onClick={onPhase2Selection}
              >
                Start My Personalized Protocol →
              </button>
              <button
                className="skip-btn"
                onClick={onSkipPhase2}
              >
                Skip for Now
              </button>
            </section>
          )}
        </section>

        {/* Phase 2 Results */}
        {phase2Results && (
          <section className="phase2-results">
            <h2>Your 10-Area Health Deep Dive</h2>

            <div className="areas-scores">
              {Object.entries(phase2Results.areaScores).map(([area, score]) => (
                <div key={area} className="area-score">
                  <div className="area-name">
                    {area.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </div>
                  <div className="score-bar">
                    <div className="score-fill" style={{ width: `${score * 25}%` }}></div>
                  </div>
                  <div className="score-value">{Math.round(score * 25)}/100</div>
                </div>
              ))}
            </div>

            {phase2Results.recommendations && (
              <div className="recommendations">
                <h3>Personalized Recommendations</h3>
                <ul>
                  {phase2Results.recommendations.map((rec, idx) => (
                    <li key={idx}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {phase2Results.priorityFactors && (
              <div className="priority-factors">
                <h3>Priority Areas to Focus On</h3>
                <ul>
                  {phase2Results.priorityFactors.map((factor, idx) => (
                    <li key={idx}>{factor}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* Action Section */}
        <section className="action-section">
          <button
            className="share-btn"
            onClick={() => setShowShare(!showShare)}
          >
            📤 Share Your Results
          </button>

          {showShare && (
            <ShareComponent
              trueHealthAge={phase1Results.trueHealthAge}
              grade={phase1Results.grade}
              resultId={resultId}
            />
          )}

          <button className="retake-btn" onClick={onRetakeQuiz}>
            ↻ Retake Quiz
          </button>
        </section>
      </div>
    </div>
  )
}
