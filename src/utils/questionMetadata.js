// Question metadata with "Why It Matters" and improvement steps.
// Question IDs MUST match those defined in Phase1Quiz.jsx exactly.
//
// Canonical mapping (also reflected in quizLogic.js categoryMap):
//   1-2   Baseline
//   3-5   High-Impact Risks (smoking, alcohol, chronic disease)
//   6-9   Body & Vitals (BMI, BP, RHR, self-rated health)
//   10-12 Movement (exercise frequency, sitting, fitness)
//   13-15 Sleep (duration, quality, apnea)
//   16-18 Nutrition (eating style, fast food/sugar, protein/carb quality)
//   19-20 Mental Health (stress, depression/mood)
export const QUESTION_METADATA = {
  1: { // Age
    category: 'Baseline',
    whyItMatters: 'Used as baseline for comparison to estimated health age.',
    improvementSteps: null,
  },
  2: { // Sex
    category: 'Baseline',
    whyItMatters: 'Sex differences affect disease risk and health metrics.',
    improvementSteps: null,
  },
  3: { // Smoking
    category: 'High-Impact Risks',
    whyItMatters: 'Smoking is the strongest modifiable predictor of early mortality.',
    improvementSteps: 'Set a quit date; use nicotine replacement or prescription aids; seek counseling; avoid triggers; consider support apps or programs.',
    poorAnswers: ['Occasionally', 'Daily']
  },
  4: { // Alcohol
    category: 'High-Impact Risks',
    whyItMatters: 'Higher alcohol intake increases liver disease, cancer, and cardiovascular risk.',
    improvementSteps: 'Limit to ≤7 drinks/week (women) or ≤14 (men); add alcohol-free days; replace with non-alcoholic options; track intake.',
    poorAnswers: ['8–14', '15+']
  },
  5: { // Diabetes status
    category: 'High-Impact Risks',
    whyItMatters: 'Diabetes accelerates vascular and metabolic aging; control and type both matter.',
    improvementSteps: 'Follow medical care plan; aim for A1c in target range; prioritize protein, fiber, and daily movement; monitor glucose regularly.',
    poorAnswers: ['Type 2 — poorly controlled or newly diagnosed', 'Type 1 diabetes', 'Type 2 — well controlled (A1c in range, on plan)']
  },
  23: { // Cardiovascular status
    category: 'High-Impact Risks',
    whyItMatters: 'Cardiovascular conditions are the leading driver of biological aging — severity and control both matter.',
    improvementSteps: 'Work with your doctor on medication adherence; prioritize cardio (zone 2), strength training, sleep, and a Mediterranean-style diet.',
    poorAnswers: ['Heart attack, stroke, stent, or bypass history', 'Atrial fibrillation (AFib) or heart failure', 'High blood pressure or high cholesterol — uncontrolled or untreated']
  },
  25: { // Body shape (BRI modifier)
    category: 'Body & Vitals',
    whyItMatters: 'Abdominal (visceral) fat drives biological-age acceleration more than total body weight — BMI alone misses this. Apple-shape and "skinny-fat" body types carry the highest hidden risk; muscular builds carry the lowest.',
    improvementSteps: 'Resistance training 2-3x/week to build muscle and reduce visceral fat; prioritize protein and fiber; reduce added sugars and refined carbs; walk after meals to improve insulin sensitivity.',
    poorAnswers: ['Lean but soft-belly ("skinny fat") — thin frame, but almost all extra weight is in my belly', 'Apple-shape — weight collects around my stomach; waistband feels tight even when my legs fit fine']
  },
  24: { // Cancer status
    category: 'High-Impact Risks',
    whyItMatters: 'Cancer impact varies enormously by type and stage; current treatment and metastatic disease carry the highest aging burden.',
    improvementSteps: 'Follow your oncologist plan; protect sleep, nutrition, and movement during and after treatment; manage stress and inflammation.',
    poorAnswers: ['Metastatic or stage IV cancer', 'Melanoma or other cancer — active treatment or recent (<5 years)', 'Other cancer — in remission 5+ years']
  },
  6: { // BMI
    category: 'Body & Vitals',
    whyItMatters: 'Body composition strongly correlates with metabolic and cardiovascular risk.',
    improvementSteps: 'Aim for 5–10% weight change if overweight/underweight; prioritize whole foods; increase daily steps and resistance training.',
  },
  7: { // Blood pressure
    category: 'Body & Vitals',
    whyItMatters: 'Hypertension is a leading driver of heart disease and stroke.',
    improvementSteps: 'Measure BP regularly; reduce sodium; increase potassium-rich foods; exercise; consult a clinician if elevated.',
    poorAnswers: ['High', "I don't know"]
  },
  8: { // Resting heart rate
    category: 'Body & Vitals',
    whyItMatters: 'Elevated resting heart rate is associated with lower cardiovascular fitness.',
    improvementSteps: 'Increase aerobic activity; improve sleep; manage stress; track RHR weekly.',
    poorAnswers: ['80+', "I don't know"]
  },
  9: { // Overall health
    category: 'Body & Vitals',
    whyItMatters: 'Self-rated health is a strong predictor of mortality and functional decline.',
    improvementSteps: 'Address key drivers (sleep, activity, diet, stress); schedule preventive checkups; set 1–2 measurable health goals.',
    poorAnswers: ['Fair', 'Poor']
  },
  10: { // Exercise frequency
    category: 'Movement',
    whyItMatters: 'Physical inactivity increases risk of chronic disease and early death.',
    improvementSteps: 'Target ≥150 min/week moderate activity; start with 10–15 min/day; add 2 days strength training.',
    poorAnswers: ['Rarely', '1–2 days/week']
  },
  11: { // Sitting time
    category: 'Movement',
    whyItMatters: 'Prolonged sitting is linked to metabolic and cardiovascular risk.',
    improvementSteps: 'Stand/walk every 30–60 min; use walking meetings; aim for 7–10k steps/day.',
    poorAnswers: ['8+']
  },
  12: { // Fitness self-rating  ← was missing; now correct
    category: 'Movement',
    whyItMatters: 'Self-rated fitness predicts cardiovascular capacity and long-term mobility — people who feel less fit than peers are more likely to develop functional decline.',
    improvementSteps: 'Build cardio gradually (start with 10-minute walks 4 days/week); add 2 days of resistance training; reassess in 8 weeks.',
    poorAnswers: ['Less fit']
  },
  13: { // Sleep hours  ← was Q12 in old metadata
    category: 'Sleep',
    whyItMatters: 'Short sleep is associated with obesity, diabetes, and cardiovascular disease.',
    improvementSteps: 'Aim for 7–8 hours; consistent schedule; reduce late caffeine/alcohol; dark, cool bedroom.',
    poorAnswers: ['Less than 6 hours', '6 to 7 hours']
  },
  14: { // Sleep quality  ← was Q13 in old metadata
    category: 'Sleep',
    whyItMatters: 'Sleep quality affects recovery, cognition, and metabolic health.',
    improvementSteps: 'Establish wind-down routine; limit screens before bed; manage stress; consider CBT-I if persistent.',
    poorAnswers: ['Poor']
  },
  15: { // Sleep apnea  ← was Q14 in old metadata
    category: 'Sleep',
    whyItMatters: 'Untreated sleep apnea increases risk of hypertension, heart disease, and fatigue.',
    improvementSteps: 'Get a sleep study; consider CPAP or alternatives; maintain healthy weight.',
    poorAnswers: ['Yes (untreated)']
  },
  16: { // Ultra-processed food (UPF) %
    category: 'Nutrition',
    whyItMatters: 'The percentage of your diet that is ultra-processed is one of the strongest predictors of biological-age acceleration. 2026 telomere research shows people whose diets are 80%+ ultra-processed have a cellular age profile equating to 10-15 years of extra aging — through glycation ("crusty" arteries), inflammaging, and microbiome wipeout.',
    improvementSteps: 'Pick one meal a day to cook from scratch this week. Replace one packaged snack with fruit, nuts, or yogurt. Read ingredient labels — if you can\'t pronounce 3+ ingredients, it\'s usually ultra-processed.',
    poorAnswers: ['Mostly processed (80%+ packaged, fast food, sugary drinks, frequent takeout — limited whole foods)', 'About half processed (50% of meals are packaged snacks, fast food, sugary drinks, frozen dinners, or takeout)']
  },
  17: { // Sugar-sweetened beverages
    category: 'Nutrition',
    whyItMatters: 'Liquid sugar is the single most concentrated aging accelerator in the modern diet. One soda a day is associated with roughly 4.6 years of additional biological aging over a decade — through insulin spikes that drive glycation, the same process that stiffens arteries and wrinkles skin.',
    improvementSteps: 'Cut one sugary drink today and swap for water, sparkling water, or unsweetened tea. Order coffee unsweetened. Treat juice like a dessert, not a beverage.',
    poorAnswers: ['Daily', 'A few times a week']
  },
  18: { // Protein/grain quality  ← was Q17 in old metadata
    category: 'Nutrition',
    whyItMatters: 'Higher-quality carbs and proteins reduce inflammation and improve heart health.',
    improvementSteps: 'Follow Mediterranean-style eating; swap white grains for whole grains; eat fish 2x/week; include legumes.',
    poorAnswers: ['Rarely', 'Sometimes']
  },
  19: { // Stress level  ← was Q18 in old metadata
    category: 'Mental Health',
    whyItMatters: 'Chronic stress accelerates aging and increases disease risk.',
    improvementSteps: 'Daily stress management (walks, breathing, mindfulness); set boundaries; prioritize recovery time.',
    poorAnswers: ['High']
  },
  20: { // Depression/mood  ← was Q19 in old metadata
    category: 'Mental Health',
    whyItMatters: 'Depression impacts behavior, inflammation, and long-term health outcomes.',
    improvementSteps: 'Seek professional support; increase physical activity; maintain social connections; consider therapy or medical care.',
    poorAnswers: ['Ongoing']
  },
}

export function getMetadata(questionId) {
  return QUESTION_METADATA[questionId] || {}
}
