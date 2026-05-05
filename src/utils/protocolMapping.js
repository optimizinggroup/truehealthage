// Maps health categories to recommended protocols
export const PROTOCOL_MAPPING = {
  'High-Impact Risks': {
    protocol: 'Longevity & Prevention',
    emoji: '🎯',
    description: 'Risk factor management and prevention strategies'
  },
  'Body & Vitals': {
    protocol: 'Weight & Metabolism',
    emoji: '⚖️',
    description: 'Body composition and metabolic health optimization'
  },
  'Movement': {
    protocol: 'Heart Health & Fitness',
    emoji: '❤️',
    description: 'Cardiovascular strength and physical activity'
  },
  'Sleep': {
    protocol: 'Sleep & Recovery',
    emoji: '😴',
    description: 'Sleep quality and restoration strategies'
  },
  'Nutrition': {
    protocol: 'Energy & Fatigue',
    emoji: '⚡',
    description: 'Energy levels and nutritional optimization'
  },
  'Mental Health': {
    protocol: 'Stress & Mental Health',
    emoji: '🧘',
    description: 'Emotional state and stress management'
  }
}

export function getRecommendedProtocols(categoryScores) {
  // Get categories with concerns (not Great or Good)
  const concernCategories = Object.entries(categoryScores || {})
    .filter(([cat, scoreObj]) => {
      const status = scoreObj.status
      return status === 'Serious Concern' || status === 'Moderate Concern'
    })
    .map(([cat]) => cat)

  // If no concerns, recommend based on what would improve overall health
  if (concernCategories.length === 0) {
    return [
      PROTOCOL_MAPPING['Movement'],
      PROTOCOL_MAPPING['Sleep'],
      PROTOCOL_MAPPING['Nutrition']
    ]
  }

  // Get top 3 recommended protocols
  const recommended = concernCategories
    .slice(0, 3)
    .map(cat => PROTOCOL_MAPPING[cat])
    .filter(Boolean)

  // If we don't have 3, fill in with other protocols
  if (recommended.length < 3) {
    const allProtocols = Object.values(PROTOCOL_MAPPING)
    const recommendedNames = new Set(recommended.map(p => p.protocol))
    const additional = allProtocols
      .filter(p => !recommendedNames.has(p.protocol))
      .slice(0, 3 - recommended.length)
    recommended.push(...additional)
  }

  return recommended.slice(0, 3)
}

export function getCategoryTopConcerns(factors) {
  // Group factors by category
  const byCategory = {}

  factors.forEach(factor => {
    if (!byCategory[factor.category]) {
      byCategory[factor.category] = { aging: 0, protecting: 0, ageYears: 0, protectYears: 0 }
    }

    if (factor.years > 0) {
      byCategory[factor.category].aging += 1
      byCategory[factor.category].ageYears += factor.years
    } else if (factor.years < 0) {
      byCategory[factor.category].protecting += 1
      byCategory[factor.category].protectYears += Math.abs(factor.years)
    }
  })

  // Find top aging categories
  const topAging = Object.entries(byCategory)
    .sort((a, b) => b[1].ageYears - a[1].ageYears)
    .filter(([_, data]) => data.ageYears > 0)
    .slice(0, 3)
    .map(([cat, data]) => ({
      category: cat,
      years: data.ageYears
    }))

  // Find top protecting categories
  const topProtecting = Object.entries(byCategory)
    .sort((a, b) => b[1].protectYears - a[1].protectYears)
    .filter(([_, data]) => data.protectYears > 0)
    .slice(0, 3)
    .map(([cat, data]) => ({
      category: cat,
      years: data.protectYears
    }))

  return { topAging, topProtecting }
}
