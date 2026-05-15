/**
 * Cohort positioning — convert a user's age_diff into a directional band
 * with positive framing.
 *
 * RATIONALE
 * ---------
 * Keith's feedback: showing "+8 years older" alone is deflating. A descriptive
 * band gives the same information with framing that motivates instead of
 * discouraging. Critically — we DO NOT show percentiles or any statistical
 * claim. We have no validated population data yet, and we're not going to
 * make up numbers.
 *
 * WHEN TO ADD STATISTICAL CLAIMS
 * -------------------------------
 * Per Keith's direction (2026-05-15): do NOT show "Top X%" or similar until
 * EITHER:
 *   (a) We've validated our question set against an independent biological-age
 *       measure (PhenoAge, DunedinPACE, etc.), OR
 *   (b) We have 1000+ completed quiz_results rows in our DB and can compute
 *       real percentiles from our actual user population.
 *
 * The quiz_results table already stores `chrono_age`, `age_diff`, and full
 * answers, so the moment we hit 1000 completions, we can swap to real
 * percentiles without any schema work.
 */

// Each band is { maxAgeDiff, label, headline, framing }.
// First match wins (sorted ascending by maxAgeDiff).
// NO percentile field — we don't have validated data and won't fake one.
const COHORT_BANDS = [
  {
    maxAgeDiff: -3,
    label: 'Exceptional',
    headline: 'Your body is running younger than your birthday says.',
    framing: 'That doesn\'t happen by accident. Whatever you\'re doing — keep doing it. Your job now is consistency, not optimization.',
  },
  {
    maxAgeDiff: 0,
    label: 'Strong',
    headline: 'You\'re keeping pace with — or beating — your chronological age.',
    framing: 'A lot of adults aren\'t. Defend the habits that got you here. Small additions from here compound fast.',
  },
  {
    maxAgeDiff: 3,
    label: 'Solid',
    headline: 'You\'re aging slightly faster than ideal, but you\'re in a strong position to pull it back.',
    framing: 'Small, consistent shifts can move this to neutral or better within months. The work pays off here more than anywhere else on the curve.',
  },
  {
    maxAgeDiff: 7,
    label: 'Typical',
    headline: 'You\'re aging at a typical modern pace — which is faster than most people realize.',
    framing: 'Honest read: that pace lands many people in chronic-disease territory by their late 50s. Better news: you found this app — that already separates you from people who aren\'t paying attention.',
  },
  {
    maxAgeDiff: 12,
    label: 'Needs attention',
    headline: 'Your body is aging faster than the clock says it should.',
    framing: 'This is exactly where TrueHealth lives. The score is reversible — and the steeper the start, the bigger the wins in the first 90 days. You\'re not behind. You just have the most upside.',
  },
  {
    maxAgeDiff: Infinity,
    label: 'High priority',
    headline: 'Your body is asking for attention — and it\'s asking now.',
    framing: 'No judgment, no panic. The biggest health turnarounds in the research are from people who started here. Pick one habit this week. Then another. The clock can actually run backward.',
  },
]

/**
 * Returns the cohort band for a given age_diff. Stable, pure, no side effects.
 *
 * @param {number} ageDiff — user.trueHealthAge - user.chronoAge.
 *   Negative = younger biologically. Positive = older.
 * @returns {{ maxAgeDiff, label, headline, framing }} the band.
 */
export function getCohortBand(ageDiff) {
  const diff = typeof ageDiff === 'number' && !isNaN(ageDiff) ? ageDiff : 0
  for (const band of COHORT_BANDS) {
    if (diff <= band.maxAgeDiff) return band
  }
  return COHORT_BANDS[COHORT_BANDS.length - 1]
}

/**
 * Visual color hint for the band — green for top bands, amber for middle,
 * warm orange for bottom (we deliberately avoid red; red triggers shutdown,
 * orange motivates).
 */
export function getCohortBandColor(band) {
  // Color is keyed off label since we removed percentile.
  const greenSet = new Set(['Exceptional', 'Strong'])
  const lightGreenSet = new Set(['Solid'])
  const amberSet = new Set(['Typical'])
  if (greenSet.has(band.label)) return '#0D9488'    // teal
  if (lightGreenSet.has(band.label)) return '#16a34a' // green
  if (amberSet.has(band.label)) return '#ca8a04'    // amber
  return '#ea580c'                                  // warm orange
}
