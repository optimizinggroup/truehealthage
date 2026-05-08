#!/usr/bin/env node
// One-off: read the 700-tip bank, assign each tip an explicit `mode`
// (physical | nutrition | behavioral), and rewrite tipBank.js with the
// new field included. Replaces the runtime keyword classifier in
// tipPicker.js with a baked-in static field per tip.
//
// Run from /app: node scripts/classify_tips.mjs
//
// Classification uses keyword scoring across the tip's text + theme +
// core. Ties broken by category default. Hand-edits to tipBank.js are
// expected for any miscategorizations spotted later.

import { TIP_BANK } from '../src/utils/tipBank.js'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../src/utils/tipBank.js')

// Keyword sets — kept tight and specific. A tip gets the mode whose
// keywords appear most often in its text/theme/core.
const KW = {
  physical: [
    'walk', 'walking', 'step', 'cardio', 'aerobic', 'run ', 'jog', 'sprint',
    'hiit', 'interval', 'exercise', 'stretch', 'mobility', 'strength',
    'lift', 'lifting', 'push-up', 'pushup', 'squat', 'plank', 'movement',
    'stand', 'standing', 'sit-to-stand', 'posture', 'gym', 'sweat',
    'yoga', 'pilates', 'bike', 'cycling', 'swim', 'hike', 'dance',
    'workout', 'training', 'reps', 'core ', 'zone 2', 'zone-2',
    'incline', 'pace', 'march', 'balance ', 'flexibility',
  ],
  nutrition: [
    'protein', 'fiber', 'water', 'hydrat', 'drink ', 'eat ', 'meal',
    'snack', 'sugar', 'carb', 'vegetable', 'veggie', 'fruit', 'nut ',
    ' fat ', 'breakfast', 'lunch', 'dinner', 'plate', 'sodium',
    'caffeine', 'alcohol', 'calorie', 'mediterranean', ' diet', 'omega',
    'fish ', 'whole grain', 'fermented', 'serving', 'oz ', 'food',
    'glass of', 'cup of', 'bottle', 'electrolyte', 'fasting',
    'supplement', 'vitamin', 'magnesium', 'caffeinat', 'coffee', 'tea ',
    'soda', 'juice', 'smoothie', 'salad', 'olive oil', 'salt',
  ],
  behavioral: [
    'stress', 'breath', 'meditat', 'mindful', 'journal', 'gratitude',
    'reflect', 'sleep', 'bedtime', 'wind-down', 'wind down', 'recovery',
    'rest ', 'boundary', 'screen', 'social', 'connection', 'community',
    'support', 'mood', 'downshift', 'cognitive', 'brain', 'learning',
    'read ', 'reading', 'plan ', 'schedule', 'routine', 'tracking',
    'log ', 'diary', 'photo', 'check-in', 'check in', 'reminder',
    'goal', 'circadian', 'light exposure', 'sunlight', 'morning light',
    'evening light', 'dark', 'noise', 'temperature', 'meditation',
    'savor', 'pause', 'permission', 'anchor', 'wake time', 'wake-time',
    'naps', 'nap ', 'phone', 'screens', 'volunteer', 'friend', 'family',
    'call ', 'text ', 'conversation', 'mentor',
  ],
}

const CATEGORY_DEFAULT = {
  sleep_recovery: 'behavioral',
  energy_fatigue: 'nutrition',     // most early-week tips are hydration/protein
  heart_fitness: 'physical',
  weight_metabolism: 'nutrition',
  stress_mental: 'behavioral',
  brain_performance: 'behavioral',
  longevity_prevention: 'behavioral',
}

// Strong overrides — these patterns force a mode regardless of the
// keyword-counting result below. They handle cases the bag-of-words
// classifier gets wrong (e.g. "take a photo of every meal" is BEHAVIORAL
// — it's tracking/awareness — not nutrition).
const FORCE_BEHAVIORAL = [
  'take a photo', 'photo of', 'log ', 'logging', 'tracking', 'track ',
  'write down', 'write it down', 'diary', 'journal', 'review your',
  'rate your', 'rating', 'identify ', 'mindful eating', 'meal awareness',
  'plan your', 'schedule ', 'reminder', 'notice when', 'awareness',
  'reflect on', 'reflection', 'check-in', 'check in',
  // Outdoor / light exposure tips often mention "drink coffee/tea outside" —
  // the action is light exposure (behavioral), not drinking (nutrition).
  'outside for', 'outdoor light', 'sunlight', 'morning light',
  'evening light', 'dim the lights', 'lights low', 'no screens',
  'screens off', 'phone-free', 'screen-free',
]
const FORCE_PHYSICAL = [
  'minute walk', 'minute-walk', 'go for a walk', 'short walk',
  'brisk walk', 'walking break', 'stretch break', 'mobility break',
  'stand up', 'sit-to-stand', 'stairs ', 'climb stairs',
  'do squats', 'do push-ups', 'do pushups',
  // Breathing engages the diaphragm + autonomic nervous system —
  // it's a physical action, not "thinking about breathing."
  'breath', 'breathing', 'breathe', 'physiological sigh',
  'box breath', '4-7-8', 'slow breath', 'deep breath', 'exhale',
  'inhale', 'long exhale',
  // Body-grounding / somatic regulation
  'relax jaw', 'unclench', 'shoulders down', 'feet on the floor',
  'progressive muscle', 'pmr ', 'body scan', 'shake out',
]

function classify(tip) {
  const text = [tip.tip || '', tip.theme || '', tip.core || ''].join(' ').toLowerCase()

  // 1) Hard overrides
  for (const p of FORCE_BEHAVIORAL) if (text.includes(p)) return 'behavioral'
  for (const p of FORCE_PHYSICAL) if (text.includes(p)) return 'physical'

  // 2) Keyword scoring
  const scores = { physical: 0, nutrition: 0, behavioral: 0 }
  for (const mode of Object.keys(KW)) {
    for (const kw of KW[mode]) {
      if (text.includes(kw)) scores[mode]++
    }
  }
  const max = Math.max(scores.physical, scores.nutrition, scores.behavioral)
  if (max === 0) return CATEGORY_DEFAULT[tip.category] || 'behavioral'
  const def = CATEGORY_DEFAULT[tip.category] || 'behavioral'
  if (scores[def] === max) return def
  if (scores.physical === max) return 'physical'
  if (scores.nutrition === max) return 'nutrition'
  return 'behavioral'
}

// Escape a string for emission inside a double-quoted JS string literal.
// Tips contain smart quotes (’) and the occasional regular apostrophe.
function dq(s) {
  return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"'
}

function emitTip(t) {
  return [
    '  {',
    `    category: ${dq(t.category)},`,
    `    week: ${t.week},`,
    `    theme: ${dq(t.theme)},`,
    `    core: ${dq(t.core)},`,
    `    tip: ${dq(t.tip)},`,
    `    framing: ${dq(t.framing)},`,
    `    tracking: ${dq(t.tracking)},`,
    `    safety: ${dq(t.safety)},`,
    `    mode: ${dq(t.mode)},`,
    '  },',
  ].join('\n')
}

const HEADER = `// ═══════════════════════════════════════════════════════════════════════════
// TrueHealthAge — Tip Bank (700 clinically-vetted tips, ~100 per category)
//
// Generated from TrueHealthAge_Tip_Bank_700.csv. Each tip has:
//   - category   (sleep_recovery / energy_fatigue / heart_fitness / etc.)
//   - week       (suggested week 1-20 — fits 8-week protocol with rotation)
//   - theme      (sub-cluster within category — e.g. "Caffeine timing")
//   - core       (broader skill area)
//   - tip        (user-facing action — what they do)
//   - framing    (Coach K's wrapper around the tip — used for warmer copy)
//   - tracking   (what to measure for self-report)
//   - safety     (escalation criteria)
//   - mode       (physical | nutrition | behavioral — the lever this tip pulls)
//
// The picker requires one tip from each mode each week so the user always
// gets a movement habit, a food/drink habit, and a mind/behavior habit
// together. Mode classification was generated by scripts/classify_tips.mjs
// using keyword heuristics; hand-edits welcome where a tip is mis-bucketed.
//
// Used by pickTipsForUser() in tipPicker.js to personalize the 3 weekly
// actions based on chronotype, severity, risk tags, and fitness baseline.
// ═══════════════════════════════════════════════════════════════════════════

export const TIP_BANK = [
`

const FOOTER = `]

// Helper: tips filtered by category and week (any week tipBank.week <= currentWeek
// is fair game, with preference for week === currentWeek). Used downstream.
export function getTipsForCategoryWeek(category, week) {
  return TIP_BANK.filter(t => t.category === category && t.week <= week)
}

export function getTipsForCategory(category) {
  return TIP_BANK.filter(t => t.category === category)
}
`

// Run
const classified = TIP_BANK.map(t => ({ ...t, mode: classify(t) }))

// Stats — sanity check distribution
const counts = { physical: 0, nutrition: 0, behavioral: 0 }
const byCat = {}
for (const t of classified) {
  counts[t.mode]++
  byCat[t.category] ||= { physical: 0, nutrition: 0, behavioral: 0 }
  byCat[t.category][t.mode]++
}
console.log('Total:', counts)
console.log('By category:')
for (const [cat, c] of Object.entries(byCat)) {
  console.log(`  ${cat}: phys=${c.physical} nutr=${c.nutrition} beh=${c.behavioral}`)
}

const body = classified.map(emitTip).join('\n')
writeFileSync(OUT, HEADER + body + '\n' + FOOTER, 'utf8')
console.log(`\nWrote ${classified.length} tips to ${OUT}`)
