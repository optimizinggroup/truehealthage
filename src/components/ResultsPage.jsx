import { useState } from 'react'
import ShareComponent from './ShareComponent'
import ShareAfterReveal from './ShareAfterReveal'
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
  onLogout,
  onContinueCoaching,
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

          {/* Post-reveal viral share — positioned at peak emotional moment,
              right under the number. Does NOT reveal the user's score; copy
              is "I just found out my TrueHealth Age — you can too." Same
              prompt works for users with great results AND embarrassing
              results because there's no number on the card. */}
          <ShareAfterReveal />

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

        {/* Phase 2 Results — stub.
            The detailed Phase 2 view already happened on Phase2Results
            (with proper 0-18 category scoring + status badges). The previous
            "10-Area Deep Dive" section here multiplied the 0-18 score by 25
            and displayed it as "X/100" — producing nonsense like 200/100,
            175/100. That section is removed. If a user does land here with
            phase2Results set (e.g. they retook the quiz), we just show a
            short summary + send them to the coaching dashboard. */}
        {phase2Results && onContinueCoaching && (
          <section className="phase2-results">
            <h2>Ready to start coaching?</h2>
            <p style={{ marginBottom: '14px' }}>
              I've already shown you which areas need the most attention. Now we pick where to start and build from there — one small thing at a time.
            </p>
          </section>
        )}

        {/* Action Section */}
        <section className="action-section">
          <button
            className="share-btn"
            onClick={() => setShowShare(!showShare)}
          >
            🌱 Help a Friend Discover Their True Health Age
          </button>

          {showShare && (
            <ShareComponent
              trueHealthAge={phase1Results.trueHealthAge}
              grade={phase1Results.grade}
              resultId={resultId}
            />
          )}

          {onContinueCoaching && phase2Results && (
            <button
              className="retake-btn"
              style={{
                background: 'linear-gradient(135deg, #0D9488 0%, #10B981 100%)',
                color: 'white',
                marginRight: '12px',
                fontWeight: 600,
              }}
              onClick={onContinueCoaching}
            >
              Open Your Coaching Dashboard →
            </button>
          )}

          <button className="retake-btn" onClick={onRetakeQuiz}>
            ↻ Retake Quiz
          </button>
        </section>
      </div>
    </div>
  )
}
