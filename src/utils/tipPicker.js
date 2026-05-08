// ═══════════════════════════════════════════════════════════════════════════
// TrueHealthAge — Tip Picker
//
// Personalizes the user's 3 weekly actions by selecting tips from the
// 700-tip bank based on their profile. Falls back gracefully when profile
// data is sparse or no tips match.
//
// Profile signals (all optional):
//   - chronotype:        'early' | 'typical' | 'late' | 'shift'
//   - severity:          'optimal' | 'needs_attention' | 'high_priority'
//   - riskTags:          string[]  (e.g. ['HIGH_STRESS', 'BLOOD_SUGAR_SWINGS'])
//   - fitnessBaseline:   'sedentary' | 'low' | 'moderate' | 'active'
//   - promotedTips:      string[]  (User-Facing Tip strings already in routine)
//
// Returns: array of up to 3 tip objects, theme-diverse, ordered by score desc.
// ═══════════════════════════════════════════════════════════════════════════

import { TIP_BANK } from './tipBank.js'

const THEME_RISK_MAP = {
  // Risk-tag → theme keywords. If user has the risk tag, tips with these
  // themes get a relevance boost. Heuristic, not exhaustive — easy to extend.
  HIGH_STRESS:           ['stress', 'recovery', 'breathing', 'boundary', 'downshift'],
  CHRONIC_STRESS:        ['stress', 'recovery', 'breathing', 'boundary', 'downshift'],
  POOR_RECOVERY:         ['recovery', 'sleep', 'rest', 'breathing'],
  BLOOD_SUGAR_SWINGS:    ['protein', 'fiber', 'sugar', 'meal timing', 'snack'],
  CAFFEINE_DEPENDENCE:   ['caffeine', 'energy', 'sleep'],
  LOW_ENERGY:            ['energy', 'sleep', 'caffeine', 'movement'],
  SHORT_SLEEP:           ['sleep', 'bedtime', 'wind-down', 'wake'],
  IRREGULAR_SLEEP:       ['sleep', 'bedtime', 'consistency', 'wake'],
  POOR_SLEEP_QUALITY:    ['sleep', 'environment', 'wind-down'],
  LATE_BEDTIME:          ['bedtime', 'wind-down', 'sleep'],
  LATE_CHRONOTYPE:       ['bedtime', 'circadian'],
  SLEEP_ONSET_DELAY:     ['wind-down', 'bedtime', 'breathing'],
  NIGHT_WAKING:          ['hydration', 'environment', 'sleep'],
  LOW_CARDIO_FITNESS:    ['cardio', 'walking', 'aerobic', 'movement'],
  SEDENTARY_PATTERN:     ['walking', 'movement', 'breaks', 'steps'],
  LOW_STEPS:             ['walking', 'steps'],
  POOR_NUTRITION:        ['nutrition', 'protein', 'fiber', 'meal'],
  EXCESS_BODY_FAT:       ['weight', 'protein', 'walking', 'tracking'],
  ABDOMINAL_WEIGHT:      ['weight', 'walking', 'protein', 'tracking'],
  BLOOD_PRESSURE_RISK:   ['blood pressure', 'sodium', 'walking'],
  CHEST_SYMPTOMS:        ['cardiac', 'medical', 'safety'],
  SHIFT_WORK:            ['shift', 'circadian', 'sleep'],
  POOR_SATIETY:          ['protein', 'fiber', 'meal'],
  CRAVINGS:              ['protein', 'fiber', 'sugar'],
  ANXIETY:               ['stress', 'breathing', 'recovery'],
  DEPRESSION_RISK:       ['mood', 'support', 'connection', 'movement'],
  COGNITIVE_DECLINE:     ['cognitive', 'brain', 'learning', 'sleep'],
  BRAIN_FOG:             ['brain', 'sleep', 'energy', 'protein'],
  SOCIAL_ISOLATION:      ['connection', 'support', 'community'],
}

// Themes / cores that match a risk tag — case-insensitive substring match
function tipMatchesRiskTags(tip, riskTags) {
  if (!riskTags || riskTags.length === 0) return 0
  const themeLower = (tip.theme || '').toLowerCase()
  const coreLower = (tip.core || '').toLowerCase()
  let hits = 0
  for (const rt of riskTags) {
    const keywords = THEME_RISK_MAP[rt]
    if (!keywords) continue
    for (const kw of keywords) {
      if (themeLower.includes(kw) || coreLower.includes(kw)) {
        hits += 1
        break
      }
    }
  }
  return hits
}

function score(tip, currentWeek, profile) {
  let s = 0
  // Week alignment — exact match best, recent past acceptable, future skipped
  const weekDiff = currentWeek - tip.week
  if (weekDiff < 0) return -1                 // future tip — exclude
  if (weekDiff === 0) s += 8                  // perfect match for current week
  else if (weekDiff <= 2) s += 5              // recent — could still be relevant
  else if (weekDiff <= 6) s += 2              // older but still in scope
  else s += 0                                 // way past — neutral

  // Risk-tag relevance (biggest personalization signal)
  s += tipMatchesRiskTags(tip, profile.riskTags) * 4

  // Severity bias — high-priority users need foundational tips, optimal users
  // can stretch. The "Suggested Week" already encodes a difficulty curve
  // (week 1 tips are foundational), so prefer earlier-week tips for
  // high-priority users and later-week tips for optimal.
  if (profile.severity === 'high_priority' && tip.week <= 3) s += 3
  if (profile.severity === 'optimal' && tip.week >= 4) s += 2

  // Chronotype — only relevant for sleep_recovery tips. Avoid prescribing
  // late-bedtime tips to early sleepers and vice versa.
  if (tip.category === 'sleep_recovery' && profile.chronotype) {
    const tipText = (tip.tip || '').toLowerCase()
    if (profile.chronotype === 'early' && /after 9 ?pm|after 10 ?pm|by 10:30|by 11/i.test(tipText)) s -= 4
    if (profile.chronotype === 'shift' && /(at \d+ ?(am|pm)|after sunset)/i.test(tipText)) s -= 2
  }

  // Fitness baseline — gates physical-task intensity for fitness/cardio tips
  if (tip.category === 'heart_fitness' && profile.fitnessBaseline === 'sedentary') {
    if (/run|jog|sprint|hiit|interval/i.test(tip.tip || '')) s -= 3   // too aggressive
    if (/walk|stand|stretch/i.test(tip.tip || '')) s += 2              // start small
  }

  // Already-promoted tips — exclude entirely so we don't suggest the same
  // habit they already added to their core routine
  if (profile.promotedTips && profile.promotedTips.includes(tip.tip)) return -1

  return s
}

/**
 * pickTipsForUser — main entry point.
 *
 * Returns up to 3 tip objects, theme-diverse, sorted by relevance.
 * If fewer than 3 tips qualify (sparse category, off-week, etc.), returns
 * what's available — caller should fall back to static daily_micro_wins.
 */
export function pickTipsForUser(category, currentWeek = 1, profile = {}) {
  const candidates = TIP_BANK
    .filter(t => t.category === category)
    .map(t => ({ tip: t, s: score(t, currentWeek, profile) }))
    .filter(x => x.s >= 0)
    .sort((a, b) => b.s - a.s)

  if (candidates.length === 0) return []

  // Theme-diverse top 3: take the top-scoring tip, then walk down picking
  // tips whose theme hasn't been used yet.
  const picked = []
  const usedThemes = new Set()
  for (const { tip } of candidates) {
    if (picked.length >= 3) break
    if (usedThemes.has(tip.theme)) continue
    picked.push(tip)
    usedThemes.add(tip.theme)
  }
  // If theme-diversity left us with <3, backfill from highest-scoring remaining
  if (picked.length < 3) {
    for (const { tip } of candidates) {
      if (picked.length >= 3) break
      if (!picked.includes(tip)) picked.push(tip)
    }
  }
  return picked
}

/**
 * Build a profile object from the data the dashboard already has on hand.
 * Tolerant of missing fields — every signal is optional.
 */
export function buildProfileFromUser({
  phase1Answers,        // optional: { qid: { value, text, years, ... } }
  phase2Answers,        // optional: { categoryId: { qid: { value, label, score, risk_tags } } }
  rankedCategories,     // optional: from phase2Results
  promotedTips,         // optional: array of tip strings already promoted
  activeCategoryId,     // current protocol's category — used for severity lookup
}) {
  const profile = {}

  // Severity = the active category's status from rankedCategories
  if (rankedCategories && activeCategoryId) {
    const cat = rankedCategories.find(c => c.categoryId === activeCategoryId)
    if (cat?.status?.level) {
      // Map UI status levels → our severity vocabulary
      const map = { optimal: 'optimal', 'needs-attention': 'needs_attention', 'high-priority': 'high_priority' }
      profile.severity = map[cat.status.level] || cat.status.level
    }
  }

  // Risk tags — collected from Phase 2 answers across all selected categories
  if (phase2Answers) {
    const tags = new Set()
    for (const cat of Object.values(phase2Answers)) {
      for (const ans of Object.values(cat || {})) {
        for (const t of (ans?.risk_tags || [])) tags.add(t)
      }
    }
    profile.riskTags = [...tags]
  }

  // Chronotype — Phase 2 sr_q4 ("If you had no commitments...what time would
  // you naturally go to bed"). Map answer values to our buckets.
  const sleepAnswers = phase2Answers?.sleep_recovery
  const sr_q4 = sleepAnswers?.sr_q4
  if (sr_q4?.value) {
    const map = {
      before_9pm: 'early',
      '9_11pm': 'typical',
      '11pm_1am': 'late',
      after_1am: 'late',
      shift_worker: 'shift',
    }
    profile.chronotype = map[sr_q4.value] || 'typical'
  }

  // Fitness baseline from Phase 1 Q10 (exercise frequency) + Q12 (fitness self-rate)
  const exerciseFreq = phase1Answers?.[10]?.text
  const fitnessSelfRate = phase1Answers?.[12]?.text
  if (exerciseFreq || fitnessSelfRate) {
    if (/never|rarely|1.2/i.test(exerciseFreq || '')) profile.fitnessBaseline = 'sedentary'
    else if (/3.4 days|3-4/i.test(exerciseFreq || '')) profile.fitnessBaseline = 'moderate'
    else if (/5\+|daily/i.test(exerciseFreq || '')) profile.fitnessBaseline = 'active'
    else profile.fitnessBaseline = 'low'
    if (/much fitter/i.test(fitnessSelfRate || '')) profile.fitnessBaseline = 'active'
    if (/less fit/i.test(fitnessSelfRate || '')) profile.fitnessBaseline = 'sedentary'
  }

  if (promotedTips) profile.promotedTips = promotedTips

  return profile
}
