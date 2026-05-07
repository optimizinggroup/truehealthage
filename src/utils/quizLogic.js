// ORIGINAL EVIDENCE-BASED SCORING ALGORITHM
// Sums all "years" adjustments and adds to chronological age to get True Health Age

import { QUESTION_METADATA } from './questionMetadata'

export function calculatePhase1Results(answers) {
  // Get user's chronological age (now in question ID 1)
  const chronoAge = parseInt(answers[1]?.text) || 40

  // Define question categories — must match the question IDs declared in
  // Phase1Quiz.jsx exactly. Movement has 3 questions (10, 11, 12 — exercise,
  // sitting, fitness). Sleep is 13-15 (duration, quality, apnea). Earlier
  // versions had this off-by-one starting at Q12, which caused the fitness
  // answer to be grouped under Sleep and the metadata strings to be pulled
  // from the wrong question (the "untreated sleep apnea" text on a
  // non-apnea Sleep result was the visible symptom).
  const categoryMap = {
    'Baseline': [1, 2],
    'High-Impact Risks': [3, 4, 5],
    'Body & Vitals': [6, 7, 8, 9],
    'Movement': [10, 11, 12],
    'Sleep': [13, 14, 15],
    'Nutrition': [16, 17, 18],
    'Mental Health': [19, 20],
  }

  // Sum all years adjustments from answers
  let yearsAdjustment = 0
  const factors = []
  const categoryYears = {}

  // Initialize category years
  Object.keys(categoryMap).forEach(cat => {
    categoryYears[cat] = 0
  })

  Object.entries(answers).forEach(([questionId, answerData]) => {
    const qId = parseInt(questionId)

    if (qId === 1 || qId === 2) {
      // Skip age and sex - just metadata
      return
    }

    // Find which category this question belongs to
    const category = Object.entries(categoryMap).find(([_, qIds]) => qIds.includes(qId))?.[0] || 'Other'

    // Handle multi-select (life events)
    if (answerData.selections) {
      const totalYears = answerData.selections.reduce((sum, sel) => sum + sel.years, 0)
      yearsAdjustment += totalYears
      categoryYears[category] += totalYears
      answerData.selections.forEach(sel => {
        factors.push({
          questionId: qId,
          answer: sel.text,
          years: sel.years,
          category,
          type: sel.years > 0 ? 'aging' : 'protecting'
        })
      })
    } else {
      // Single answer
      yearsAdjustment += answerData.years
      categoryYears[category] += answerData.years
      factors.push({
        questionId: qId,
        answer: answerData.text,
        years: answerData.years,
        category,
        type: answerData.years > 0 ? 'aging' : 'protecting'
      })
    }
  })

  // Calculate category scores and health status (exclude Baseline from reporting)
  const categoryScores = {}
  const categoryStatus = {}
  const categoryExplanations = {}

  Object.entries(categoryMap).forEach(([category, qIds]) => {
    // Skip Baseline - it's metadata only
    if (category === 'Baseline') {
      return
    }

    const categoryFactors = factors.filter(f => f.category === category)
    const totalYears = categoryYears[category]

    // Count questions with positive years in this category
    const positiveYearsFactors = categoryFactors.filter(f => f.years > 0)
    const numQuestionsInCategory = qIds.filter(qId => qId > 2).length // Exclude baseline
    const percentBadQuestions = numQuestionsInCategory > 0 ? (positiveYearsFactors.length / numQuestionsInCategory) : 0

    // Find if there's a single very bad question (>= 5 years)
    const veryBadQuestion = categoryFactors.find(f => f.years >= 5)

    // "Why It Matters" must come from the question actually driving the score —
    // not the first question in the category. Otherwise a non-smoker who drinks
    // heavily would see "smoking is the strongest predictor..." paired with
    // alcohol-reduction steps, which is incoherent.
    let primaryFactor = null
    if (totalYears > 0) {
      // Aging-direction: pick the worst contributor
      primaryFactor = [...categoryFactors]
        .filter(f => f.years > 0)
        .sort((a, b) => b.years - a.years)[0]
    } else if (totalYears < 0) {
      // Protecting-direction: pick the most-protecting factor
      primaryFactor = [...categoryFactors]
        .filter(f => f.years < 0)
        .sort((a, b) => a.years - b.years)[0]
    }
    // Fallback only when nothing contributed in either direction
    const primaryQId = primaryFactor?.questionId ?? qIds.find(qId => qId > 2)
    const categoryMetadata = QUESTION_METADATA[primaryQId]
    const whyItMatters = categoryMetadata?.whyItMatters || ''

    // Get improvement steps if there are concerns
    let improvementSteps = []
    if (totalYears > 0) {
      categoryFactors.forEach(factor => {
        const metadata = QUESTION_METADATA[factor.questionId]
        if (metadata?.improvementSteps && factor.years > 0) {
          improvementSteps.push(metadata.improvementSteps)
        }
      })
    }

    // Determine status
    let status
    if (totalYears < 0) {
      status = 'Great'
      categoryScores[category] = { years: totalYears, status, color: '#4CAF50', whyItMatters }
    } else if (totalYears === 0) {
      status = 'Good'
      categoryScores[category] = { years: totalYears, status, color: '#81C784', whyItMatters }
    } else if (veryBadQuestion || percentBadQuestions > 0.5) {
      status = 'Serious Concern'
      categoryScores[category] = { years: totalYears, status, color: '#F44336', whyItMatters, improvementSteps: improvementSteps.slice(0, 2) }
    } else if (totalYears > 0) {
      status = 'Moderate Concern'
      categoryScores[category] = { years: totalYears, status, color: '#FFC107', whyItMatters, improvementSteps: improvementSteps.slice(0, 1) }
    }

    categoryStatus[category] = status
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
    categoryScores,
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
