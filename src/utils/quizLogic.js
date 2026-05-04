// ORIGINAL EVIDENCE-BASED SCORING ALGORITHM
// Sums all "years" adjustments and adds to chronological age to get True Health Age

export function calculatePhase1Results(answers) {
  // Get user's chronological age
  const chronoAge = parseInt(answers[2]?.text) || 40

  // Sum all years adjustments from answers
  let yearsAdjustment = 0
  const factors = []

  Object.entries(answers).forEach(([questionId, answerData]) => {
    const qId = parseInt(questionId)

    if (qId === 1 || qId === 2) {
      // Skip sex and age - just metadata
      return
    }

    // Handle multi-select (life events)
    if (answerData.selections) {
      const totalYears = answerData.selections.reduce((sum, sel) => sum + sel.years, 0)
      yearsAdjustment += totalYears
      answerData.selections.forEach(sel => {
        factors.push({
          questionId: qId,
          answer: sel.text,
          years: sel.years,
          type: sel.years > 0 ? 'aging' : 'protecting'
        })
      })
    } else {
      // Single answer
      yearsAdjustment += answerData.years
      factors.push({
        questionId: qId,
        answer: answerData.text,
        years: answerData.years,
        type: answerData.years > 0 ? 'aging' : 'protecting'
      })
    }
  })

  // Calculate True Health Age
  const trueHealthAge = Math.round(chronoAge + yearsAdjustment)

  // Calculate age difference
  const ageDiff = trueHealthAge - chronoAge

  // Determine grade based on age difference
  let grade, label
  if (ageDiff <= -5) {
    grade = 'A+'
    label = 'Exceptional'
  } else if (ageDiff <= -2) {
    grade = 'A'
    label = 'Excellent'
  } else if (ageDiff <= 2) {
    grade = 'B'
    label = 'Good'
  } else if (ageDiff <= 5) {
    grade = 'C'
    label = 'Fair'
  } else {
    grade = 'D'
    label = 'Needs Improvement'
  }

  // Get top 3 aging factors (positive years)
  const agingFactors = factors
    .filter(f => f.years > 0)
    .sort((a, b) => b.years - a.years)
    .slice(0, 3)

  // Get top 3 protecting factors (negative years)
  const protectingFactors = factors
    .filter(f => f.years < 0)
    .sort((a, b) => a.years - b.years)
    .slice(0, 3)

  const top3Aging = agingFactors.map(f => ({
    answer: f.answer,
    years: f.years
  }))

  const top3Protecting = protectingFactors.map(f => ({
    answer: f.answer,
    years: Math.abs(f.years)
  }))

  return {
    trueHealthAge,
    chronoAge,
    ageDiff,
    grade,
    label,
    yearsAdjustment,
    top3Aging,
    top3Protecting,
  }
}

export function calculatePhase2Results(areaResponses, selectedAreas) {
  const responseScoreMap = {
    'Not a concern': 4,
    'Mild issue': 3,
    'Moderate issue': 2,
    'Significant concern': 1,
  }

  // Calculate area scores
  const areaScores = {}
  const recommendations = []
  const priorityFactors = []

  selectedAreas.forEach(area => {
    const responses = areaResponses[area] || []
    if (responses.length > 0) {
      const avgScore = responses.reduce((sum, r) => sum + (responseScoreMap[r] || 0), 0) / responses.length
      areaScores[area] = Math.round(avgScore) / 4 // Normalize to 0-1
    }
  })

  // Generate recommendations based on lowest scoring areas
  const sortedAreas = Object.entries(areaScores)
    .sort((a, b) => a[1] - b[1])

  sortedAreas.forEach(([area], idx) => {
    if (idx < 3) {
      priorityFactors.push(`Focus on ${formatAreaName(area)}`)
      recommendations.push(`Improve your ${formatAreaName(area)} by addressing the identified concerns`)
    }
  })

  // Add general recommendations
  recommendations.push('Schedule regular check-ups with healthcare providers')
  recommendations.push('Implement gradual lifestyle changes')
  recommendations.push('Track progress over time')

  return {
    areaScores,
    recommendations: recommendations.slice(0, 5),
    priorityFactors: priorityFactors.slice(0, 3),
  }
}

function formatAreaName(area) {
  return area
    .replace(/_/g, ' ')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
