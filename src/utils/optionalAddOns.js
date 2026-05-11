// ═══════════════════════════════════════════════════════════════════════════
// TrueHealthAge — Optional Supplement & Therapy Add-Ons (educational layer)
//
// Source: UPDATE-PROTOCOLS FROM OPEN AI/FULL INCLUDING OPTIONAL THERAPIES
//   TrueHealthAge_Therapy_Device_Peptide_Integrated_Upgrade.xlsx
//   — Supplement Add-On Bank + Full Therapy Menu + Category Therapy Matrix
//
// LEGAL/SAFETY RULES (read these before editing this file):
//   1. App provides EDUCATION ONLY. Never diagnose, treat, cure, or prevent.
//   2. Food first. Test second (vitamin D/B12/iron etc.). Supplements third.
//   3. Every supplement entry must include a safety_note.
//   4. Peptides: educational reference only — no dosing, no sourcing.
//   5. Gated behind a user opt-in (per spec §13).
//
// Each category exposes three tiers in order of safety:
//   - food_first       (Tier 1: behavioral / nutritional, no supplements)
//   - supplements      (Tier 2-3: optional, clinician discussion)
//   - therapies        (Tier 2-4: optional devices/treatments)
// ═══════════════════════════════════════════════════════════════════════════

export const ADDON_DISCLAIMER = `Educational information only. The app does not diagnose, treat, cure, or prevent disease. Always discuss supplements, devices, therapies, and peptides with a qualified clinician — especially if you are pregnant, breastfeeding, immunocompromised, taking medications, or managing a medical condition.`

export const OPTIONAL_ADDONS = {
  skin_health: {
    coach_intro: "Skin health starts with protection. No supplement beats sunscreen and a skin check. These are options to discuss with a dermatologist or primary care clinician once your basics are in place.",
    food_first: [
      { name: "SPF + protective clothing", action: "Daily SPF 30+ to face, neck, ears, and hands. Hat and sunglasses for long outdoor time.", note: "This is the single most important skin-aging and skin-cancer-prevention habit." },
      { name: "Colorful plants", action: "Add berries, leafy greens, peppers, tomatoes — antioxidant-rich foods that support skin from the inside.", note: "Real food first, supplements second." },
      { name: "Protein at every meal", action: "Palm-sized protein at each meal supports collagen and skin repair.", note: "Adequate protein matters before adding collagen powder." },
      { name: "Hydration", action: "Drink water steadily across the day; very dry indoor air may need a humidifier.", note: "Dehydrated skin looks older than it is." },
    ],
    supplements: [
      { name: "Collagen peptides", action: "Consider collagen peptides only after protein and SPF habits are consistent.", safety_note: "Allergies, kidney concerns, and product quality vary — discuss with your clinician.", tier: "Optional" },
      { name: "Omega-3 (food first, then supplement)", action: "Eat fatty fish or chia/flax/walnut foods first. Supplement only if dietary intake is low and your clinician agrees.", safety_note: "Blood thinner caution — discuss with your clinician before supplementing.", tier: "Optional after food-first" },
      { name: "Vitamin D if labs are low", action: "Test before supplementing. Dose only with clinician guidance.", safety_note: "High-dose vitamin D can be harmful. Do not guess.", tier: "Test-first" },
      { name: "Topical retinoid discussion", action: "Discuss prescription or OTC retinoids with a dermatologist for fine lines and texture.", safety_note: "Avoid during pregnancy or trying to conceive unless cleared. Severe sensitivity, rosacea, or eczema flares need clinician input.", tier: "Discuss with clinician" },
    ],
    therapies: [
      { name: "Red light therapy / photobiomodulation", tier: "Tier 2 — optional adjunct", action: "May support skin texture and recovery. 2-3 sessions/week, 5-10 minutes on target area, eye protection.", safety_note: "Photosensitive medications, active cancer or suspicious lesions, eye disease, or pregnancy require clinician clearance." },
      { name: "Dermatology referral — PDT or biopsy", tier: "Tier 3 — clinician treatment", action: "Photodynamic therapy and biopsy are dermatology decisions, not home protocols.", safety_note: "Any new, changing, bleeding, or non-healing spot needs an evaluation, not a gadget." },
      { name: "Topical cosmetic peptides", tier: "Tier 2 — cosmetic adjunct", action: "May support skin appearance. Patch test and add one product at a time.", safety_note: "Avoid on irritated skin or active rash. Quality and evidence vary by product." },
    ],
    peptide_note: "Peptide injections marketed for skin (Melanotan II, copper peptides, GHK-Cu injections) are not appropriate as app recommendations. The FDA has flagged serious adverse events for some compounded peptides. Only a licensed clinician should evaluate whether a peptide therapy is appropriate.",
    red_flags: "A spot that's new, changing, asymmetric, bleeding, itching, or not healing needs a dermatologist — not a supplement.",
  },

  strength_function: {
    coach_intro: "Strength is independence. The goal isn't looking strong — it's being able to do your life. Supplements support the work. They don't replace it.",
    food_first: [
      { name: "Protein at every meal", action: "Palm-sized protein at each meal. Whole-food sources first: eggs, fish, poultry, beans, tofu, Greek yogurt, lean meat.", note: "Food protein beats powder for most people." },
      { name: "Resistance training 2x/week", action: "Bands, dumbbells, or bodyweight. Sit-to-stand, carries, balance work, grip.", note: "This is the actual prescription. Everything else is support." },
      { name: "Walking + carrying loads", action: "Daily walks, plus carrying real loads (groceries, bags, kettlebell).", note: "Carrying is one of the most functional daily exercises." },
    ],
    supplements: [
      { name: "Creatine monohydrate", action: "Discuss creatine monohydrate (commonly 3-5g daily) after a consistent strength routine is in place.", safety_note: "Kidney disease, medication interactions, or pregnancy — clinician first. Look for third-party testing (USP/NSF/Informed Choice).", tier: "Optional after habit" },
      { name: "Whey or plant protein powder", action: "Use protein powder only if real-food protein is hard to hit consistently.", safety_note: "Allergens and GI tolerance vary. Choose third-party-tested products.", tier: "Bridge tool" },
      { name: "Vitamin D if labs are low", action: "Test ferritin/vitamin D first; supplement only if low.", safety_note: "Avoid mega-doses. Do not guess.", tier: "Test-first" },
      { name: "Essential amino acids / leucine", action: "Whole protein first; EAA/leucine only if dietary protein is difficult.", safety_note: "Medical-nutrition guidance preferred for older adults with kidney disease or chronic conditions.", tier: "Discuss with clinician" },
    ],
    therapies: [
      { name: "Whole-body vibration platform", tier: "Tier 2 — adjunct for limited mobility", action: "May improve lower-limb strength and balance in some older adults. 1-3 short sessions/week with handrail support.", safety_note: "Avoid or clinician-clear first: pregnancy, recent surgery or fracture, severe osteoporosis, blood clots, implanted devices, seizure disorder, vertigo, uncontrolled BP." },
      { name: "Local vibration / percussion massage", tier: "Tier 2 — recovery adjunct", action: "1-2 minutes per muscle group, light pressure. Helps perceived soreness; doesn't replace rehab.", safety_note: "Avoid over varicose veins, clots, open wounds, bruises, fractures, neuropathy." },
      { name: "TENS unit (for pain-limited movement)", tier: "Tier 2-3 — pain adjunct", action: "May reduce pain for some conditions. Best used with PT or clinician guidance.", safety_note: "Avoid over chest/neck/head, with pacemaker/defibrillator, in pregnancy abdomen, with epilepsy or unknown pain." },
    ],
    peptide_note: "Testosterone boosters, SARMs, growth hormone peptides (CJC-1295, ipamorelin, MOTs-C), BPC-157, and TB-500 are NOT app-recommended. Many are unapproved, marketed online with safety risks, and are medical decisions only.",
    red_flags: "Chest pain, severe shortness of breath, dizziness, fainting, sudden one-sided weakness, recurrent falls, or sharp joint pain during exercise — stop and seek care.",
  },

  digestive_microbiome: {
    coach_intro: "Your gut likes rhythm and consistency. We add slowly so we can tell what actually helps. Supplements are a later layer — fiber, water, and meal timing come first.",
    food_first: [
      { name: "Fiber from real food", action: "Oats, beans, lentils, berries, vegetables, chia, flax, nuts, whole grains.", note: "Add slowly. Too much too fast causes gas and bloating." },
      { name: "Water with meals", action: "Pair fiber with a full glass of water at each meal.", note: "Fiber without water can make constipation worse." },
      { name: "Meal rhythm", action: "Eat around the same times. Stop 2-3 hours before bed to reduce reflux risk.", note: "The gut runs on a clock. Help it set one." },
      { name: "Fermented foods (if tolerated)", action: "Yogurt, kefir, sauerkraut, kimchi — small servings, see how you feel.", note: "Not for everyone. If symptoms worsen, pause." },
    ],
    supplements: [
      { name: "Psyllium fiber", action: "Start low (1 tsp in a full glass of water), increase slowly if constipation persists.", safety_note: "Drink with water. Space from medications by 1-2 hours. Caution if you have swallowing difficulty.", tier: "Optional after food-fiber" },
      { name: "Targeted probiotic", action: "Choose probiotics for a specific goal (e.g. antibiotic-associated diarrhea, IBS subtype) — not a random megadose.", safety_note: "Immunocompromise, severe illness, or central line — clinician first.", tier: "Strain-specific" },
      { name: "Magnesium citrate for constipation", action: "Discuss magnesium citrate with your clinician for stubborn constipation.", safety_note: "Kidney disease, medication interactions, and diarrhea risk — clinician first.", tier: "Discuss with clinician" },
      { name: "Enteric-coated peppermint oil", action: "Discuss with clinician for IBS-type cramps.", safety_note: "Can worsen reflux for some people.", tier: "Targeted use" },
      { name: "Digestive enzymes", action: "Only when there is a specific indication (e.g. lactase for lactose intolerance) — not as a daily routine.", safety_note: "Random enzyme stacking is not supported. Get a diagnosis first.", tier: "Targeted use" },
    ],
    therapies: [
      { name: "GI clinician + pelvic floor therapy", tier: "Tier 3 — clinician-led", action: "For chronic constipation, severe IBS, reflux that won't quit, or pelvic-floor dysfunction.", safety_note: "These are specialist evaluations, not app routines." },
      { name: "Stress / gut-brain practices", tier: "Tier 1 — foundational", action: "Slow breathing before meals, 10-minute walk after meals, sleep adequacy.", safety_note: "Safe for most users. Pause and seek care for red-flag symptoms below." },
    ],
    peptide_note: "BPC-157 and other 'gut healing' peptides are NOT app-recommended. The FDA has cited safety concerns and limited human data for compounded BPC-157. This is medical territory only.",
    red_flags: "Blood in stool, black or tarry stools, unexplained weight loss, trouble swallowing, persistent vomiting, severe abdominal pain, persistent diarrhea, or a major change in bowel habits — get medical care. Do not self-coach these.",
  },

  // ─── Existing categories — supplement/therapy layer for parity ────────────
  sleep_recovery: {
    coach_intro: "Sleep is built by rhythm, light, temperature, and behavior. Supplements come last.",
    food_first: [
      { name: "Magnesium-rich dinner", action: "Add pumpkin seeds, spinach, beans, or dark chocolate at dinner a few nights this week.", note: "Real food first." },
      { name: "Caffeine cutoff", action: "Move your last caffeine earlier — ideally before 2 pm.", note: "Caffeine has a 6-8 hour half-life for most people." },
    ],
    supplements: [
      { name: "Magnesium glycinate", action: "If tension and sleep onset persist after the routine work, discuss magnesium glycinate with your clinician.", safety_note: "Kidney disease, medication interactions, and pregnancy — clinician first.", tier: "Optional" },
      { name: "Melatonin (short-term only)", action: "Low-dose melatonin (0.3-1 mg) for jet lag or circadian shift — not as a nightly habit.", safety_note: "Long-term safety uncertain. Medication interactions possible.", tier: "Circadian aid only" },
    ],
    therapies: [
      { name: "Light therapy box", tier: "Tier 2 — circadian tool", action: "10,000 lux for 20-30 minutes within an hour of waking when outdoor morning light isn't practical.", safety_note: "Bipolar disorder, eye disease, photosensitive medications, or migraines need clinician input." },
    ],
    peptide_note: "Sleep-marketed peptides (DSIP, epitalon) are not app-recommended. Limited evidence and compounding risks.",
    red_flags: "Loud snoring with gasping, daytime sleepiness severe enough to risk drowsy driving, or insomnia lasting more than 3 weeks despite a steady routine — see a doctor. Could be sleep apnea or another treatable condition.",
  },

  energy_fatigue: {
    coach_intro: "If your body is tired for a reason, caffeine is a cover-up. I want the reason.",
    food_first: [
      { name: "Protein breakfast", action: "25-30g protein at breakfast for steady energy.", note: "Adjust if you have kidney guidance." },
      { name: "Hydration + electrolytes", action: "Water through the day; electrolytes after heavy sweating.", note: "Kidney/heart failure or BP meds — clinician first." },
    ],
    supplements: [
      { name: "Vitamin D / B12 / iron — test first", action: "Ask clinician about checking vitamin D, B12, and ferritin/iron if fatigue persists.", safety_note: "Do not supplement iron blindly. Do not megadose.", tier: "Test-first" },
      { name: "Creatine (with strength training)", action: "Consider creatine if you're also training with resistance — supports training output.", safety_note: "Kidney disease — clinician first.", tier: "Optional with strength" },
    ],
    therapies: [
      { name: "Light therapy box (morning)", tier: "Tier 2 — circadian", action: "Morning light helps daytime alertness, especially in winter or shift work.", safety_note: "Same cautions as sleep section." },
    ],
    peptide_note: "Energy-marketed peptides are not app-recommended.",
    red_flags: "Severe fatigue, unexplained weight loss, shortness of breath at rest, or new depression deserve medical evaluation — not a supplement.",
  },

  heart_fitness: {
    coach_intro: "Heart health is not one pill. It is your weekly movement, blood pressure, blood sugar, sleep, and food pattern.",
    food_first: [
      { name: "Soluble fiber (oats, beans, psyllium)", action: "Add soluble fiber to support cholesterol and metabolic health.", note: "Space from medications by pharmacist guidance." },
      { name: "Omega-3 foods", action: "Fatty fish or omega-3 plant foods before pills.", note: "Fish allergy or restrictions? Plant sources work." },
      { name: "Home BP tracking", action: "Track blood pressure properly 3 days this week.", note: "Sitting, feet flat, after 5 minutes of rest." },
    ],
    supplements: [
      { name: "Omega-3 EPA/DHA", action: "Discuss EPA/DHA supplementation if triglycerides are high.", safety_note: "Blood thinners or upcoming surgery — clinician first.", tier: "Discuss with clinician" },
      { name: "CoQ10 with statins", action: "If statin muscle symptoms occur, ask your clinician about CoQ10.", safety_note: "Do not stop a statin without your prescriber.", tier: "Targeted use" },
    ],
    therapies: [
      { name: "Sauna / heat therapy", tier: "Tier 2 — optional adjunct", action: "May support vascular conditioning and recovery. Start 5-10 minutes 1-2x/week, hydrate.", safety_note: "Unstable heart disease, uncontrolled BP, fainting history, pregnancy, dehydration, or alcohol use require clinician clearance." },
    ],
    peptide_note: "GLP-1/GIP medications (Wegovy, Mounjaro, Zepbound) are licensed medical therapy — discuss with your PCP, endocrinologist, or obesity-medicine clinician. Never use unapproved compounded GLP-1 from online sources.",
    red_flags: "Chest pain, exertional shortness of breath, arrhythmia, or symptoms suggestive of stroke — call 911. Do not coach a heart-attack pattern.",
  },

  weight_metabolism: {
    coach_intro: "The boring truth wins here: calorie awareness, protein, fiber, walking, and strength. Supplements only support the plan.",
    food_first: [
      { name: "Protein at meals", action: "Hit protein first at each meal — fullness and muscle preservation.", note: "Whole food first." },
      { name: "Photo food log", action: "Take meal photos for awareness before changing everything.", note: "Pause if it triggers disordered eating." },
      { name: "Walk after meals", action: "10 minutes after one meal a day to blunt blood-sugar spike.", note: "More is fine but not required." },
    ],
    supplements: [
      { name: "Protein powder (bridge)", action: "Only if real-food protein is hard to hit. Choose third-party-tested product.", safety_note: "Allergens and GI tolerance vary.", tier: "Bridge" },
      { name: "Psyllium before a meal", action: "Try psyllium with water before one meal if fiber intake is low.", safety_note: "Drink with full water; space from medications.", tier: "Optional" },
      { name: "Creatine if training", action: "Pair creatine with strength training, not couch sitting.", safety_note: "Kidney disease — clinician first.", tier: "Optional with strength" },
    ],
    therapies: [
      { name: "GLP-1 / GIP medication discussion", tier: "Tier 4 — licensed medical therapy", action: "For appropriate patients with obesity/diabetes, FDA-approved options may help. Discuss with PCP or obesity-medicine clinician.", safety_note: "Never DIY-dose or use compounded research peptides. Side effects require physician management." },
    ],
    peptide_note: "Unapproved weight-loss peptides and online research compounds are NOT app-recommended. FDA has warned against unapproved GLP-1 products.",
    red_flags: "Avoid stimulant fat-burners and detox teas. Eating-disorder history, pregnancy, bariatric surgery, or diabetes meds change the plan — clinician first.",
  },

  stress_mental: {
    coach_intro: "Stress is not weakness. It is load. We lower the load before we chase pills.",
    food_first: [
      { name: "Caffeine cutoff + sleep", action: "Move caffeine earlier; protect 7-8 hours of sleep window.", note: "Most stress is amplified by sleep debt." },
      { name: "Omega-3 foods", action: "Salmon, sardines, chia, walnuts before omega-3 pills.", note: "Food first." },
      { name: "Breath work + walking", action: "5-minute slow breathing + 10-minute walk daily.", note: "Free and effective." },
    ],
    supplements: [
      { name: "L-theanine", action: "Discuss L-theanine for occasional caffeine-related jitters.", safety_note: "Sedatives and medication interactions — pharmacist first.", tier: "Optional" },
      { name: "Magnesium glycinate", action: "Discuss magnesium glycinate if tension and sleep issues persist.", safety_note: "Kidney disease, medication interactions — clinician first.", tier: "Optional" },
    ],
    therapies: [
      { name: "Sauna", tier: "Tier 2 — recovery", action: "May support relaxation and recovery for many users.", safety_note: "Heart disease, uncontrolled BP, pregnancy, dehydration, or alcohol — clinician first." },
      { name: "Therapy / counseling", tier: "Tier 1 — foundational", action: "Talk therapy or counseling is one of the most effective long-term supports.", safety_note: "Self-harm thoughts, panic attacks, mania, or severe depression — seek care urgently." },
    ],
    peptide_note: "Stress/mood peptides (Selank, Semax) are not app-recommended. Limited evidence and compounding risks.",
    red_flags: "Self-harm thoughts, panic attacks, mania, severe depression or anxiety — get human care. National suicide & crisis lifeline (US): 988.",
  },

  brain_performance: {
    coach_intro: "Your brain runs on sleep, blood flow, fuel, and attention. The supplement is never the foundation.",
    food_first: [
      { name: "Protein breakfast", action: "Protein at breakfast for steady cognitive energy.", note: "Whole food first." },
      { name: "Omega-3 foods", action: "Add omega-3 foods twice weekly if intake is low.", note: "Fish or plant sources." },
      { name: "Walking + learning", action: "Daily walk + 10 minutes of learning something unfamiliar.", note: "Movement and novelty are foundational." },
    ],
    supplements: [
      { name: "Creatine", action: "Consider creatine for training and brain-energy support, after basics.", safety_note: "Kidney disease — clinician first.", tier: "Optional" },
      { name: "B12 check", action: "Memory or focus issues plus fatigue → discuss B12 with clinician.", safety_note: "Especially relevant for vegans, older adults, metformin or PPI users.", tier: "Test-first" },
    ],
    therapies: [
      { name: "Morning light / light therapy box", tier: "Tier 2 — circadian", action: "Morning light boosts alertness and circadian alignment.", safety_note: "Bipolar disorder, eye disease, photosensitivity — clinician first." },
    ],
    peptide_note: "Cognitive-marketed peptides (Selank, Semax, Cerebrolysin) are not app-recommended.",
    red_flags: "New confusion, sudden memory change, neurologic symptoms, or medication changes — medical care, not supplements.",
  },

  longevity_prevention: {
    coach_intro: "Longevity is not magic. It is boring things done early enough and consistently enough.",
    food_first: [
      { name: "Mediterranean-pattern eating", action: "Vegetables, beans, fish, olive oil, whole grains, nuts.", note: "Probably the best-evidenced eating pattern for healthspan." },
      { name: "Strength + cardio", action: "Two strength sessions and 150 minutes of moderate cardio weekly.", note: "Non-negotiables for longevity." },
      { name: "Screenings on schedule", action: "Colon, skin, BP, cholesterol, A1c, mammogram/Pap, prostate as appropriate.", note: "Catching things early is the whole point." },
    ],
    supplements: [
      { name: "Vitamin D — test first", action: "Use vitamin D based on labs and risk, not guessing.", safety_note: "High doses can be harmful.", tier: "Test-first" },
      { name: "Psyllium / soluble fiber", action: "Simple daily fiber support if dietary fiber is low.", safety_note: "Water and medication spacing matter.", tier: "Optional" },
      { name: "Creatine with strength training", action: "Pair creatine with resistance training, not couch sitting.", safety_note: "Kidney disease — clinician first.", tier: "Optional" },
    ],
    therapies: [
      { name: "Sauna (if cleared)", tier: "Tier 2 — adjunct", action: "May support cardiovascular conditioning and recovery for appropriate users.", safety_note: "Heart disease, BP, dehydration, pregnancy — clinician first." },
    ],
    peptide_note: "Anti-aging peptide stacks (epitalon, CJC-1295, ipamorelin, MOTs-C, NAD+ injections from non-licensed sources) are NOT app-recommended. Many are unapproved, marketed online, and pose real risk.",
    red_flags: "Cancer warning signs (unexplained weight loss, new lumps, blood in stool, unrelenting pain, persistent cough), chest pain, neurologic changes — medical evaluation, not coaching.",
  },
}

// Helper: get the add-on bundle for a given category id (returns null if none)
export function getAddOnsForCategory(categoryId) {
  return OPTIONAL_ADDONS[categoryId] || null
}
