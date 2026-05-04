import { useState } from 'react'
import ShareComponent from './ShareComponent'
import '../styles/ResultsPage.css'

export default function ResultsPage({
  phase1Results,
  phase2Results,
  resultId,
  userEmail,
  showPhase2Option,
  onPhase2Selection,
  onSkipPhase2,
  onRetakeQuiz
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

          {/* Top Factors */}
          <div className="factors-section">
            <div className="factors-group aging">
              <h3>🔴 Top 3 Aging Factors</h3>
              <ul>
                {phase1Results.top3Aging?.map((factor, idx) => (
                  <li key={idx}>
                    <strong>{factor.answer}</strong>
                    <p className="years-impact">+{factor.years} years</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="factors-group protecting">
              <h3>🟢 Top 3 Protecting Factors</h3>
              <ul>
                {phase1Results.top3Protecting?.map((factor, idx) => (
                  <li key={idx}>
                    <strong>{factor.answer}</strong>
                    <p className="years-impact">-{factor.years} years</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Phase 2 Gateway */}
          {showPhase2Option && (
            <section className="phase2-gateway">
              <h3>Would you like personalized help in any of these areas?</h3>
              <p className="gateway-description">Get deeper insights and personalized recommendations for specific health categories.</p>
              <button
                className="proceed-btn"
                onClick={onPhase2Selection}
              >
                Yes, Show Me My Options →
              </button>
              <button
                className="skip-btn"
                onClick={onSkipPhase2}
              >
                No, I'm Done
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
