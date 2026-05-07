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

// Severity rank — Serious Concern always beats Moderate, regardless of years.
// (A Serious can be triggered by one very bad question that another category
// might match in total years via several small issues, but a single 5-year
// red-flag still deserves to lead the recommendation list.)
const STATUS_PRIORITY = {
  'Serious Concern': 2,
  'Moderate Concern': 1,
}

export function getRecommendedProtocols(categoryScores) {
  // Filter to categories with active concerns AND sort by severity:
  //   1) Serious before Moderate
  //   2) Within each tier, more aging years first
  // Original code took the first 3 in iteration order, which silently
  // dropped Mental Health (last in categoryMap) even when it was the
  // worst concern — that was the bug.
  const concernCategories = Object.entries(categoryScores || {})
    .filter(([_, s]) => s.status === 'Serious Concern' || s.status === 'Moderate Concern')
    .sort((a, b) => {
      const tierDiff = (STATUS_PRIORITY[b[1].status] || 0) - (STATUS_PRIORITY[a[1].status] || 0)
      if (tierDiff !== 0) return tierDiff
      return (b[1].years || 0) - (a[1].years || 0)
    })
    .map(([cat]) => cat)

  // If no concerns, recommend three solid universally-helpful protocols
  if (concernCategories.length === 0) {
    return [
      PROTOCOL_MAPPING['Movement'],
      PROTOCOL_MAPPING['Sleep'],
      PROTOCOL_MAPPING['Nutrition'],
    ]
  }

  // Top 3 by severity
  const recommended = concernCategories
    .slice(0, 3)
    .map(cat => PROTOCOL_MAPPING[cat])
    .filter(Boolean)

  // Fill out to 3 with other categories if needed (keeps the page useful
  // for users with only 1-2 active concerns)
  if (recommended.length < 3) {
    const recommendedNames = new Set(recommended.map(p => p.protocol))
    const additional = Object.values(PROTOCOL_MAPPING)
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
