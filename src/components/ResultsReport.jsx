import { useState } from 'react'

export default function ResultsReport({ phase1Results, userEmail }) {
  const [showReport, setShowReport] = useState(false)

  if (!phase1Results) return null

  const generateHTMLReport = () => {
    const { grade, label, trueHealthAge, chronoAge, ageDiff, top3Aging, top3Protecting, categoryScores } = phase1Results

    const getHealthStatus = (score) => {
      if (score >= 8) return { status: 'Great', color: '#4CAF50', emoji: '🟢' }
      if (score >= 5) return { status: 'Could Improve', color: '#FFC107', emoji: '🟡' }
      return { status: 'Areas of Concern', color: '#F44336', emoji: '🔴' }
    }

    const categoryRows = Object.entries(categoryScores || {}).map(([category, score]) => {
      const health = getHealthStatus(score)
      const barWidth = (score / 10) * 100
      return `
        <div class="category-row">
          <div class="category-info">
            <div class="category-name">${category.replace(/_/g, ' ')}</div>
            <div class="category-status" style="color: ${health.color};">
              ${health.emoji} ${health.status}
            </div>
          </div>
          <div class="category-score-display">
            <div class="score-bar">
              <div class="score-fill" style="width: ${barWidth}%; background-color: ${health.color};"></div>
            </div>
            <span class="score-value">${score.toFixed(1)}/10</span>
          </div>
        </div>
      `
    }).join('')

    const agingFactorsHTML = (top3Aging || []).map((factor, idx) => `
      <div class="factor-row aging">
        <div class="factor-rank">${idx + 1}</div>
        <div class="factor-content">
          <div class="factor-text">${factor.answer}</div>
          <div class="factor-impact">+${factor.years} years</div>
        </div>
      </div>
    `).join('')

    const protectingFactorsHTML = (top3Protecting || []).map((factor, idx) => `
      <div class="factor-row protecting">
        <div class="factor-rank">${idx + 1}</div>
        <div class="factor-content">
          <div class="factor-text">${factor.answer}</div>
          <div class="factor-impact">-${factor.years} years</div>
        </div>
      </div>
    `).join('')

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your TrueHealth Age Report</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 20px;
            min-height: 100vh;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 60px 40px;
            color: white;
            text-align: center;
          }
          .header h1 {
            font-size: 2.5rem;
            margin-bottom: 20px;
            font-weight: 700;
          }
          .header p {
            font-size: 1.1rem;
            opacity: 0.9;
            margin-bottom: 10px;
          }
          .header-date {
            font-size: 0.95rem;
            opacity: 0.8;
          }
          .content {
            padding: 60px 40px;
          }
          .results-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 50px;
          }
          .result-card {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            border-left: 4px solid #667eea;
          }
          .result-card.grade {
            grid-column: 1 / 2;
            border-left-color: ${grade === 'A+' || grade === 'A' ? '#4CAF50' : grade === 'B' ? '#FFC107' : '#F44336'};
            background: ${grade === 'A+' || grade === 'A' ? '#f1f8e9' : grade === 'B' ? '#fffbf0' : '#ffebee'};
          }
          .result-card h3 {
            font-size: 0.9rem;
            color: #666;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
          }
          .result-card .big-number {
            font-size: 3rem;
            font-weight: 700;
            color: #667eea;
            margin-bottom: 8px;
          }
          .result-card.grade .big-number {
            color: ${grade === 'A+' || grade === 'A' ? '#4CAF50' : grade === 'B' ? '#FFC107' : '#F44336'};
            font-size: 2.5rem;
          }
          .result-card .label {
            font-size: 0.9rem;
            color: #999;
          }
          .result-card .description {
            font-size: 0.85rem;
            color: #999;
            margin-top: 8px;
          }
          .result-card.positive {
            border-left-color: #4CAF50;
          }
          .result-card.negative {
            border-left-color: #FF9800;
          }
          .section-title {
            font-size: 1.8rem;
            color: #333;
            margin: 50px 0 30px 0;
            font-weight: 700;
            border-bottom: 3px solid #667eea;
            padding-bottom: 15px;
          }
          .category-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 18px;
            background: #f8f9fa;
            border-radius: 8px;
            margin-bottom: 15px;
          }
          .category-info {
            flex: 1;
          }
          .category-name {
            font-weight: 600;
            color: #333;
            margin-bottom: 6px;
            font-size: 1.05rem;
          }
          .category-status {
            font-size: 0.95rem;
            font-weight: 500;
          }
          .category-score-display {
            flex: 0 0 35%;
            text-align: right;
          }
          .score-bar {
            width: 100%;
            height: 8px;
            background: #e0e0e0;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 8px;
          }
          .score-fill {
            height: 100%;
            transition: width 0.3s ease;
          }
          .score-value {
            font-size: 0.9rem;
            color: #666;
            font-weight: 600;
          }
          .factors-section {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 50px;
          }
          .factors-group h3 {
            font-size: 1.3rem;
            margin-bottom: 20px;
            color: #333;
            font-weight: 700;
          }
          .factor-row {
            display: flex;
            gap: 15px;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 12px;
            border-left: 4px solid;
          }
          .factor-row.aging {
            background: #ffebee;
            border-left-color: #F44336;
          }
          .factor-row.protecting {
            background: #f1f8e9;
            border-left-color: #4CAF50;
          }
          .factor-rank {
            font-size: 1.5rem;
            font-weight: 700;
            color: #667eea;
            min-width: 35px;
          }
          .factor-content {
            flex: 1;
          }
          .factor-text {
            font-weight: 500;
            color: #333;
            margin-bottom: 6px;
          }
          .factor-impact {
            font-size: 0.9rem;
            color: #666;
            font-weight: 600;
          }
          .factor-row.aging .factor-impact {
            color: #F44336;
          }
          .factor-row.protecting .factor-impact {
            color: #4CAF50;
          }
          .cta-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 12px;
            text-align: center;
            margin: 50px 0;
          }
          .cta-section h2 {
            font-size: 1.8rem;
            margin-bottom: 15px;
          }
          .cta-section p {
            font-size: 1.1rem;
            margin-bottom: 25px;
            opacity: 0.95;
          }
          .footer {
            background: #f8f9fa;
            padding: 25px 40px;
            text-align: center;
            color: #666;
            font-size: 0.9rem;
          }
          @media (max-width: 768px) {
            .results-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .result-card.grade {
              grid-column: 1 / 3;
            }
            .factors-section {
              grid-template-columns: 1fr;
            }
            .header h1 {
              font-size: 2rem;
            }
            .header {
              padding: 40px 20px;
            }
            .content {
              padding: 40px 20px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 Your TrueHealth Age Report</h1>
            <p>Comprehensive Health Assessment</p>
            <div class="header-date">Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>

          <div class="content">
            <!-- Key Results -->
            <div class="results-grid">
              <div class="result-card grade">
                <h3>Overall Grade</h3>
                <div class="big-number">${grade}</div>
                <div class="label">${label}</div>
              </div>
              <div class="result-card">
                <h3>True Health Age</h3>
                <div class="big-number">${trueHealthAge}</div>
                <div class="description">Your biological age</div>
              </div>
              <div class="result-card">
                <h3>Actual Age</h3>
                <div class="big-number">${chronoAge}</div>
                <div class="description">Your chronological age</div>
              </div>
              <div class="result-card ${ageDiff >= 0 ? 'positive' : 'negative'}">
                <h3>Health Gap</h3>
                <div class="big-number">${ageDiff >= 0 ? '+' : ''}${ageDiff}</div>
                <div class="description">${ageDiff >= 0 ? 'years older' : 'years younger'}</div>
              </div>
            </div>

            <!-- Category Scores -->
            <h2 class="section-title">📊 Your Health by Category</h2>
            <div class="categories">
              ${categoryRows}
            </div>

            <!-- Top Factors -->
            <div class="factors-section">
              <div class="factors-group">
                <h3>🔴 Top 3 Aging Factors</h3>
                ${agingFactorsHTML}
              </div>
              <div class="factors-group">
                <h3>🟢 Top 3 Protecting Factors</h3>
                ${protectingFactorsHTML}
              </div>
            </div>

            <!-- Call to Action -->
            <div class="cta-section">
              <h2>Ready to Improve Your Health?</h2>
              <p>Get your personalized TrueHealth Protocol with targeted actions based on your assessment.</p>
              <p style="font-size: 1rem; opacity: 0.9;">Start your personalized protocol today to reverse your health age.</p>
            </div>
          </div>

          <div class="footer">
            <p>This assessment is based on evidence-based health factors. Consult with a healthcare provider for personalized medical advice.</p>
            <p style="margin-top: 15px; opacity: 0.7;">© 2024 TrueHealth. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    return html
  }

  const handleDownloadReport = () => {
    const htmlContent = generateHTMLReport()
    const element = document.createElement('a')
    const file = new Blob([htmlContent], { type: 'text/html' })
    element.href = URL.createObjectURL(file)
    element.download = `TrueHealthAge_Report_${new Date().getTime()}.html`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleViewReport = () => {
    const htmlContent = generateHTMLReport()
    const newWindow = window.open()
    newWindow.document.write(htmlContent)
    newWindow.document.close()
  }

  return (
    <div style={{ margin: '20px 0' }}>
      <button
        onClick={() => setShowReport(!showReport)}
        style={{
          background: '#667eea',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          marginRight: '10px'
        }}
      >
        📋 View Full Report
      </button>
      {showReport && (
        <div style={{ marginTop: '15px' }}>
          <button
            onClick={handleViewReport}
            style={{
              background: '#764ba2',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Open in New Window
          </button>
          <button
            onClick={handleDownloadReport}
            style={{
              background: '#059669',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Download as HTML
          </button>
        </div>
      )}
    </div>
  )
}
