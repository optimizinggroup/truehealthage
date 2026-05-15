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

// Each weekly habit should hit a different LEVER:
//   physical    → body movement (walk, stretch, lift, cardio, posture)
//   nutrition   → food/drink (protein, fiber, water, sugar, meal timing)
//   behavioral  → mental/emotional/sleep/connection/tracking
// Coach K's rule: every week the user gets one of each. The mode is now
// stored as an explicit field on every tip (see scripts/classify_tips.mjs)
// — no runtime keyword guessing here. Hand-edit tipBank.js if a tip is
// in the wrong bucket.

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

// Universal tips — habits that apply to ANY category. Coach K's principle:
// every week should give the user one movement habit, one food/drink habit,
// and one mind/behavior habit. Some category banks are mode-clustered
// (Stress & Mental is 86 behavioral / 13 physical / 1 nutrition across all
// weeks), so without universal fallbacks the picker would always fall back
// to static daily_micro_wins for those categories. These universals are
// only used when the category bank has no tip in a given mode.
//
// week: 1 makes them eligible from week 1 onward.
const UNIVERSAL_PHYSICAL_TIPS = [
  // 2026 Longevity Blueprint — 3 Daily Core Habits (always-on foundation).
  // These are the "do every day regardless of protocol" anchors from the
  // CA/CVD protocol research. They get a foundation_boost: true tag so the
  // picker scores them above generic universal tips. They're authored as
  // one-per-mode so the picker's "1 physical + 1 nutrition + 1 behavioral"
  // rule places them all on the dashboard together when no category-specific
  // tip beats them on personalization.
  {
    category: 'any',
    week: 1,
    theme: 'Post-meal walk',
    core: 'Glucose & vessel anchor',
    tip: 'Take a 10-minute walk right after your largest meal today — blunts the post-meal glucose spike that scars arteries and feeds cancer cells.',
    framing: "Ten minutes after dinner. That's the whole assignment. It's the single highest-leverage habit in longevity research.",
    tracking: 'Days you walked after a meal',
    safety: 'Pace is conversational, not vigorous. Stop for chest pain, dizziness, or unusual shortness of breath.',
    mode: 'physical',
    foundation_boost: true,
  },
  {
    category: 'any',
    week: 1,
    theme: 'Walking',
    core: 'Daily movement',
    tip: 'Take a 10-minute walk today — after a meal, on a break, or just outside.',
    framing: "I'm not asking for perfect. I'm asking for one honest rep today: a 10-minute walk.",
    tracking: 'Days walked / minutes walked',
    safety: 'Stop and rest if you feel chest pain, dizziness, or shortness of breath. Build up gradually if sedentary.',
    mode: 'physical',
  },
  {
    category: 'any',
    week: 1,
    theme: 'Breathing',
    core: 'Nervous system regulation',
    tip: 'Do 5 slow belly breaths — inhale through the nose for 4, exhale through the mouth for 6.',
    framing: "I'm not asking for perfect. I'm asking for one honest rep today: 5 slow belly breaths.",
    tracking: 'Times practiced today',
    safety: 'If you feel lightheaded, return to normal breathing. Pause for medical conditions affecting breathing.',
    mode: 'physical',
  },
  {
    category: 'any',
    week: 1,
    theme: 'Stretching',
    core: 'Mobility and tension release',
    tip: 'Stretch your neck, shoulders, and hips for 5 minutes — wherever you are.',
    framing: "I'm not asking for perfect. I'm asking for one honest rep today: 5 minutes of stretching.",
    tracking: 'Days stretched',
    safety: 'Stretch to comfortable tension, never to pain. Avoid bouncing and forcing range of motion.',
    mode: 'physical',
  },
]

const UNIVERSAL_NUTRITION_TIPS = [
  {
    category: 'any',
    week: 1,
    theme: 'Electrolyte hydration',
    core: 'Daily foundation',
    tip: 'Drink 500 ml of water with a pinch of sea salt and a squeeze of lemon when you wake — flushes the lymphatic system and hydrates the heart muscle.',
    framing: "First thing. Before coffee. Glass of water with a pinch of salt and lemon. That's the foundation.",
    tracking: 'Mornings you hit the morning electrolyte glass',
    safety: 'Skip the salt if you are on a sodium-restricted diet — talk to your clinician first.',
    mode: 'nutrition',
    foundation_boost: true,
  },
  {
    category: 'any',
    week: 1,
    theme: 'Hydration',
    core: 'Daily nutrition basics',
    tip: 'Drink a glass of water 15 minutes before each meal — your gut and your appetite both benefit.',
    framing: "I'm not asking for perfect. I'm asking for one honest rep today: water before every meal. Gut bacteria, satiety, and hydration all start there.",
    tracking: 'Meals preceded by a glass of water',
    safety: 'Adjust if you have a fluid-restriction medical condition.',
    mode: 'nutrition',
  },
  {
    category: 'any',
    week: 1,
    theme: 'Vegetables and fruit',
    core: 'Plant intake',
    tip: 'Add one fruit or vegetable to one meal today.',
    framing: "I'm not asking for perfect. I'm asking for one honest rep today: one fruit or vegetable on the plate.",
    tracking: 'Servings of produce',
    safety: 'No safety concerns for typical adults.',
    mode: 'nutrition',
  },
  {
    category: 'any',
    week: 1,
    theme: 'Protein anchor',
    core: 'Daily nutrition basics',
    tip: 'Include a protein source — eggs, fish, poultry, beans, tofu, Greek yogurt — at one meal.',
    framing: "I'm not asking for perfect. I'm asking for one honest rep today: protein in one meal.",
    tracking: 'Meals with protein',
    safety: 'Adapt for kidney disease or specific dietary needs as advised by your clinician.',
    mode: 'nutrition',
  },
]

const UNIVERSAL_BEHAVIORAL_TIPS = [
  {
    category: 'any',
    week: 1,
    theme: 'Box breathing',
    core: 'Cortisol foundation',
    tip: 'Box breathing — 4 seconds in, 4 hold, 4 out, 4 hold — for 5 minutes today. Lowers cortisol, the primary driver of systemic inflammation behind both heart disease and cancer.',
    framing: "Five minutes. 4 in, 4 hold, 4 out, 4 hold. That's the whole behavioral assignment most days.",
    tracking: 'Days you did the breath box',
    safety: 'Stop if you feel lightheaded; resume normal breathing.',
    mode: 'behavioral',
    foundation_boost: true,
  },
  {
    category: 'any',
    week: 1,
    theme: 'Sleep priority',
    core: 'Recovery foundation',
    tip: 'Pick a consistent bedtime tonight and aim to be in bed within 30 minutes of it.',
    framing: "I'm not asking for perfect. I'm asking for one honest rep today: hit a bedtime within 30 minutes.",
    tracking: 'Nights bedtime hit',
    safety: 'See a clinician for chronic insomnia, loud snoring, or daytime sleepiness.',
    mode: 'behavioral',
  },
  {
    category: 'any',
    week: 1,
    theme: 'Gratitude reflection',
    core: 'Mind regulation',
    tip: 'Write down one thing you appreciated about today before bed.',
    framing: "I'm not asking for perfect. I'm asking for one honest rep today: one line of gratitude.",
    tracking: 'Days journaled',
    safety: 'Pause if reflection becomes rumination — talk to a clinician if so.',
    mode: 'behavioral',
  },
  {
    category: 'any',
    week: 1,
    theme: 'Screen wind-down',
    core: 'Evening routine',
    tip: 'Put your phone down 30 minutes before bed tonight.',
    framing: "I'm not asking for perfect. I'm asking for one honest rep today: 30 minutes phone-free before bed.",
    tracking: 'Nights phone-free wind-down',
    safety: 'Keep the phone reachable if you are on-call for emergencies.',
    mode: 'behavioral',
  },
]

function score(tip, currentWeek, profile) {
  let s = 0
  // Week alignment — exact match best, recent past acceptable, future skipped
  const weekDiff = currentWeek - tip.week
  if (weekDiff < 0) return -1                 // future tip — exclude
  if (weekDiff === 0) s += 8                  // perfect match for current week
  else if (weekDiff <= 2) s += 5              // recent — could still be relevant
  else if (weekDiff <= 6) s += 2              // older but still in scope
  else s += 0                                 // way past — neutral

  // Foundation boost — universal tips (walk/breath/stretch, water before
  // meals, sleep priority/gratitude/wind-down) get a steady score lift so
  // they keep appearing across the user's program week after week. They
  // still lose to category-specific tips that have strong risk-tag
  // relevance (which gives +4 per match), so personalization wins when
  // it matters — but generic category tips no longer crowd out the
  // foundation pillars Keith built into the program.
  if (tip.category === 'any') s += 5
  // Extra boost for the 2026 CA/CVD blueprint's 3 daily core habits — they
  // are stage-agnostic and benefit every protocol, so we want them to win
  // most ties against generic universal tips.
  if (tip.foundation_boost) s += 4

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

  // User marked "I already do this" — skip so we can surface something new
  if (profile.excludedTips && profile.excludedTips.includes(tip.tip)) return -1

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
  const scoreTip = (t) => ({ tip: t, s: score(t, currentWeek, profile) })
  const sortByScore = (arr) => arr.filter(x => x.s >= 0).sort((a, b) => b.s - a.s)

  // Universals (category 'any') and category tips compete in the same pool.
  // Universals carry a +5 foundation boost so they win against generic
  // category tips, but lose to category tips with risk-tag matches —
  // personalization beats foundation when the user has a strong signal,
  // foundation prevails the rest of the time.
  const allEligible = [
    // A tip is eligible if its primary `category` matches OR its `categories`
    // array (when present) includes this category. The 52 longevity micro-
    // habits authored from the 2026 CA/CVD protocols use the multi-category
    // form because many cross over (e.g. "post-meal walk" hits both
    // heart_fitness and weight_metabolism).
    ...TIP_BANK.filter(t =>
      t.category === category ||
      (Array.isArray(t.categories) && t.categories.includes(category))
    ),
    ...UNIVERSAL_PHYSICAL_TIPS,
    ...UNIVERSAL_NUTRITION_TIPS,
    ...UNIVERSAL_BEHAVIORAL_TIPS,
  ]
  const candidates = sortByScore(allEligible.map(scoreTip))

  const byMode = { physical: [], nutrition: [], behavioral: [] }
  for (const c of candidates) {
    if (byMode[c.tip.mode]) byMode[c.tip.mode].push(c)
  }

  // Should never happen now (universals are week:1, always score >= 0)
  // but guard anyway so the caller can fall back if something goes wrong.
  if (byMode.physical.length === 0
      || byMode.nutrition.length === 0
      || byMode.behavioral.length === 0) {
    return []
  }

  // 5) Pick the top-scoring tip from each bucket, avoiding duplicate themes.
  // Within each mode we PREFER category-specific tips over the universal
  // fallbacks — otherwise the same three universals (10-min walk / water /
  // bedtime) show up on every category's dashboard, defeating the point of
  // having category-specific tip banks. Universals only fire as fallback
  // when the category has no tip in that mode.
  const picked = []
  const usedThemes = new Set()
  for (const mode of ['nutrition', 'physical', 'behavioral']) {
    const bucket = byMode[mode]
    const categoryFirst = bucket.find(c => c.tip.category !== 'any' && !usedThemes.has(c.tip.theme))
    const anyTheme = bucket.find(c => !usedThemes.has(c.tip.theme))
    const chosen = categoryFirst || anyTheme || bucket[0]
    picked.push(chosen.tip)
    usedThemes.add(chosen.tip.theme)
  }

  // Display order: highest-scoring first (matches the user's strongest
  // signal — risk tag relevance, week alignment, etc.).
  picked.sort((a, b) => {
    const sa = candidates.find(c => c.tip === a)?.s ?? 0
    const sb = candidates.find(c => c.tip === b)?.s ?? 0
    return sb - sa
  })

  return picked
}

// Runtime mode classifier for plain task strings (used by the static
// fallback path in the dashboard — those tasks are strings without a
// baked-in mode field). Mirrors the logic in scripts/classify_tips.mjs
// so behavior is consistent. Returns 'physical' | 'nutrition' | 'behavioral'.
const RUNTIME_FORCE_BEHAVIORAL = [
  'take a photo', 'photo of', 'log ', 'logging', 'tracking', 'track ',
  'write down', 'journal', 'diary', 'review your', 'rate your', 'rating',
  'mindful eating', 'plan your', 'schedule ', 'reflect',
  'outside for', 'sunlight', 'morning light', 'no screens', 'screen-free',
  'phone-free',
]
const RUNTIME_FORCE_PHYSICAL = [
  'walk', 'breath', 'stretch', 'mobility', 'sit-to-stand', 'stairs',
  'push-up', 'pushup', 'squat', 'plank', 'yoga', 'pilates', 'cardio',
  'run ', 'jog', 'cycling', 'swim', 'hike', 'physiological sigh',
  'box breath', 'slow breath', 'deep breath',
]
const RUNTIME_FORCE_NUTRITION = [
  'protein', 'fiber', 'water', 'hydrat', 'drink ', 'eat ', 'meal',
  'snack', 'sugar', 'carb', 'vegetable', 'fruit', 'breakfast', 'lunch',
  'dinner', 'plate', 'sodium', 'caffeine', 'alcohol', 'calorie',
  'serving',
]

export function classifyTaskString(taskText) {
  const t = String(taskText || '').toLowerCase()
  for (const p of RUNTIME_FORCE_BEHAVIORAL) if (t.includes(p)) return 'behavioral'
  for (const p of RUNTIME_FORCE_PHYSICAL) if (t.includes(p)) return 'physical'
  for (const p of RUNTIME_FORCE_NUTRITION) if (t.includes(p)) return 'nutrition'
  return 'behavioral' // sensible default — most authored tasks are mind/habit prescriptions
}

/**
 * balanceTasksByMode — enforce the 1-physical / 1-nutrition / 1-behavioral
 * rule on a list of plain task strings. Used by the dashboard's static
 * fallback path so the protocol's daily_micro_wins still follow Coach K's
 * rule even when they were authored before the rule existed.
 *
 * Algorithm:
 *  1. Classify each task into a mode.
 *  2. Keep at most one task per mode (highest-priority order: physical,
 *     nutrition, behavioral — matches what the picker returns).
 *  3. For any missing mode, append the universal foundation tip.
 *  4. Return up to 3 task strings.
 */
export function balanceTasksByMode(tasks) {
  const byMode = { physical: null, nutrition: null, behavioral: null }
  for (const t of (tasks || [])) {
    const mode = classifyTaskString(t)
    if (!byMode[mode]) byMode[mode] = t
  }
  const fallback = {
    physical: UNIVERSAL_PHYSICAL_TIPS[0].tip,    // 10-minute walk
    nutrition: UNIVERSAL_NUTRITION_TIPS[0].tip,  // water before meals
    behavioral: UNIVERSAL_BEHAVIORAL_TIPS[0].tip, // bedtime anchor
  }
  return [
    byMode.nutrition || fallback.nutrition,
    byMode.physical || fallback.physical,
    byMode.behavioral || fallback.behavioral,
  ]
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
  excludedTips,         // optional: array of tip strings the user already does daily
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
  if (excludedTips) profile.excludedTips = excludedTips

  return profile
}
