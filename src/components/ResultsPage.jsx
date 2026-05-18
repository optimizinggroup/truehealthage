import { useState } from 'react'
import ShareComponent from './ShareComponent'
import ShareAfterReveal from './ShareAfterReveal'
import ResultsReport from './ResultsReport'
import ScoreCitations from './ScoreCitations'
import { getRecommendedProtocols } from '../utils/protocolMapping'
import { getCohortBand, getCohortBandColor } from '../utils/cohortPositioning'
import { track as phTrack } from '../utils/posthog'
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

          {/* URGENT PHASE 2 CTA — placed DIRECTLY below the age cards (the
              user has already seen TrueHealth Age + Actual Age, so this is
              the right moment to push the coaching CTA). Headline is bold
              yellow on the green background for max contrast. Only shows
              on the first-time view (showPhase2Option). */}
          {showPhase2Option && (
            <section
              style={{
                background: 'linear-gradient(135deg, #0D9488 0%, #10B981 100%)',
                color: '#fff',
                borderRadius: '14px',
                padding: '24px 22px 20px',
                margin: '24px 0',
                boxShadow: '0 6px 18px rgba(13,148,136,0.30)',
                textAlign: 'center',
              }}
            >
              <h2 style={{
                fontSize: 'clamp(1.45rem, 6vw, 2rem)',
                fontWeight: 900,
                color: '#FDE047',                              /* bright yellow */
                letterSpacing: '0.02em',
                margin: '0 0 6px',
                lineHeight: 1.15,
                textShadow: '0 1px 2px rgba(0,0,0,0.18)',
              }}>
                IMPROVE YOUR TRUEHEALTH AGE
              </h2>
              <p style={{
                fontSize: '0.85rem',
                opacity: 0.95,
                margin: '0 0 10px',
                fontWeight: 600,
                letterSpacing: '0.04em',
                color: '#fff',
              }}>
                For a Limited Time
              </p>
              <p style={{
                fontSize: 'clamp(1.05rem, 4vw, 1.3rem)',
                fontWeight: 800,
                margin: '0 0 16px',
                lineHeight: 1.3,
                color: '#fff',
              }}>
                Get Your FREE Personalized<br />Health Coaching Program
              </p>
              <button
                type="button"
                onClick={() => {
                  phTrack('phase2_cta_clicked', { placement: 'top_urgent' })
                  if (onPhase2Selection) onPhase2Selection()
                }}
                style={{
                  background: '#fff',
                  color: '#0D9488',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '14px 36px',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                  letterSpacing: '0.02em',
                }}
              >
                Start Here →
              </button>
              <p style={{
                fontSize: '0.9rem',
                marginTop: '14px',
                marginBottom: 0,
                fontWeight: 700,
                color: '#FDE047',
                letterSpacing: '0.03em',
              }}>
                ⚡ Only a Few Spots Left
              </p>
            </section>
          )}

          {/* Post-reveal viral share — positioned at peak emotional moment,
              right under the number. Does NOT reveal the user's score; copy
              is "I just found out my TrueHealth Age — you can too." Same
              prompt works for users with great results AND embarrassing
              results because there's no number on the card. */}
          <ShareAfterReveal />

          {/* Directional cohort framing — NO percentile claims. We don't yet
              have validated population data, so the card uses descriptive
              labels ("Exceptional" / "Strong" / "Typical" / "Needs attention")
              instead of fake statistics. Once we have 1000+ quiz_results rows
              (or validation against an independent biological-age measure),
              we can swap to real percentiles. Code lives in
              utils/cohortPositioning.js so the swap is local. */}
          {(() => {
            const band = getCohortBand(phase1Results.ageDiff)
            const color = getCohortBandColor(band)
            return (
              <div style={{
                marginTop: '24px',
                padding: '22px',
                background: '#fff',
                borderRadius: '10px',
                border: `2px solid ${color}33`,
                borderLeft: `5px solid ${color}`,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{
                    background: color,
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                  }}>
                    {band.label}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.15rem', marginBottom: '8px', color: '#1f2937', lineHeight: 1.4 }}>
                  {band.headline}
                </h3>
                <p style={{ fontSize: '0.95rem', color: '#4b5563', lineHeight: 1.55, margin: 0 }}>
                  {band.framing}
                </p>
              </div>
            )
          })()}

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

          {/* Top 5 Aging Foods — conditional on Q16/Q17 answers. We surface
              this only for users who answered they eat half-or-more processed
              food, OR have sugary drinks a few times a week or more. For
              people who already eat mostly whole foods, the section adds noise.
              The 5 items mirror the 2026 UPF research (Gemini synthesis,
              Keith-approved 2026-05-15). */}
          {(() => {
            const q16 = phase1Results?.answers?.[16]?.text || ''
            const q17 = phase1Results?.answers?.[17]?.text || ''
            const eatsProcessed = /50% of meals|80%\+/i.test(q16)
            const drinksSugar = /Daily|A few times a week/i.test(q17)
            if (!eatsProcessed && !drinksSugar) return null

            const top5Foods = [
              {
                rank: 1,
                title: 'Ultra-processed meats',
                examples: 'Bacon, deli meats, hot dogs, pepperoni, sausage.',
                why: 'Nitrites + PAHs from high-heat cooking directly attack the telomere caps on your DNA. High consumption is linked to a 20% increase in all-cause mortality.',
                swap: 'Fresh roasted turkey or chicken, eggs, beans, or smoked salmon.',
              },
              {
                rank: 2,
                title: 'Sugar-sweetened beverages',
                examples: 'Soda, "fruit" juices, energy drinks, sweetened coffee.',
                why: 'Liquid sugar triggers glycation — sugar molecules bind to collagen and stiffen your arteries and skin. One soda a day = ~4.6 years of additional biological aging per decade.',
                swap: 'Water, sparkling water with lemon, unsweetened tea, or black coffee.',
              },
              {
                rank: 3,
                title: 'Industrial seed oils',
                examples: 'Soybean, corn, cottonseed, canola — in most shelf-stable snacks, restaurant fryers, salad dressings.',
                why: 'Heated Omega-6 oils oxidize and incorporate into your cell membranes — the biological equivalent of rusting.',
                swap: 'Cook with olive oil or avocado oil. Read labels on chips, crackers, dressings.',
              },
              {
                rank: 4,
                title: 'Refined "white" flour products',
                examples: 'White bread, crackers, commercial pastries, most cereals.',
                why: 'Stripped of fiber — acts like pure sugar in the body. Drives visceral fat (the "deep" belly fat that pumps inflammatory cytokines 24/7).',
                swap: 'Steel-cut oats, sourdough, sprouted-grain bread, or beans for fiber.',
              },
              {
                rank: 5,
                title: 'Artificial emulsifiers + sweeteners',
                examples: '"Low-cal" snacks, coffee creamers, most protein bars, packaged dressings.',
                why: 'Break down the protective mucus lining of the gut ("leaky gut"), letting toxins reach the bloodstream and triggering chronic low-grade inflammation.',
                swap: 'Whole-food snacks: fruit + nuts, cheese, hard-boiled eggs, plain Greek yogurt.',
              },
            ]

            return (
              <div style={{ marginTop: '40px', marginBottom: '40px', padding: '24px', background: '#fff7ed', borderRadius: '8px', borderLeft: '4px solid #ea580c' }}>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '8px', color: '#9a3412' }}>🍔 The 5 Foods Aging You Fastest</h3>
                <p style={{ color: '#555', marginBottom: '20px', fontSize: '0.95rem', lineHeight: '1.5' }}>
                  Based on your answers, processed food is one of the biggest levers you can pull. Cut these five and your body's repair systems (autophagy) get a real shift off — that's where the age-reversal happens.
                </p>
                {top5Foods.map((food) => (
                  <div key={food.rank} style={{ marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid #fed7aa' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px', color: '#9a3412' }}>
                      {food.rank}. {food.title}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: '#7c2d12', marginBottom: '6px', fontStyle: 'italic' }}>{food.examples}</p>
                    <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '6px', lineHeight: '1.5' }}>
                      <strong>Why it ages you:</strong> {food.why}
                    </p>
                    <p style={{ fontSize: '0.9rem', color: '#0f766e', lineHeight: '1.5' }}>
                      <strong>Swap for:</strong> {food.swap}
                    </p>
                  </div>
                ))}
                <p style={{ fontSize: '0.85rem', color: '#7c2d12', marginTop: '8px', lineHeight: '1.5' }}>
                  Don't try to cut all five overnight. Pick the one easiest to swap this week — usually #2 (sugary drinks) or #1 (deli meats) — and stack the next one in two weeks.
                </p>
              </div>
            )
          })()}

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
                onClick={() => {
                  phTrack('phase2_cta_clicked', { placement: 'bottom_gateway' })
                  onPhase2Selection()
                }}
              >
                Start My Personalized Protocol →
              </button>
              <button
                className="skip-btn"
                onClick={() => {
                  phTrack('phase2_skipped', { placement: 'bottom_gateway' })
                  onSkipPhase2()
                }}
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

        {/* Citations — validation studies for users who want to verify the science.
            We show study names + what they support; we do NOT expose the year-impact
            formula. Collapsed by default so it doesn't clutter the page. */}
        <ScoreCitations />

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
