import { useEffect, useRef, useState } from 'react'
import { calculatePhase1Results } from '../utils/quizLogic'
import { track as phTrack } from '../utils/posthog'
import TrueHealthAgeLogo from '../assets/logos/truehealthage.png'
import '../styles/Phase1Quiz.css'

// EVIDENCE-BASED QUESTIONS - FINAL 20 HEALTH AGE ASSESSMENT
const PHASE1_QUESTIONS = [
  // Q1: Age (Baseline)
  {
    id: 1,
    category: 'Baseline',
    question: 'What is your age?',
    type: 'number',
    placeholder: 'Enter your age (years)',
    years: 0
  },

  // Q2: Biological Sex (Baseline)
  {
    id: 2,
    category: 'Baseline',
    question: 'What is your biological sex?',
    type: 'single',
    options: [
      { text: 'Male', years: 0 },
      { text: 'Female', years: 0 },
      { text: 'Other', years: 0 }
    ]
  },

  // Q3: Smoking Status (High-Impact Risks)
  {
    id: 3,
    category: 'High-Impact Risks',
    question: 'Do you currently smoke cigarettes?',
    type: 'single',
    options: [
      { text: 'Never', years: 0 },
      { text: 'Former', years: 0.5 },
      { text: 'Occasionally', years: 5 },
      { text: 'Daily', years: 7 }
    ]
  },

  // Q4: Alcohol Consumption (High-Impact Risks)
  {
    id: 4,
    category: 'High-Impact Risks',
    question: 'How many alcoholic drinks do you have in a typical week?',
    type: 'single',
    options: [
      { text: '0–2', years: 0 },
      { text: '3–7', years: 0.5 },
      { text: '8–14', years: 2 },
      { text: '15+', years: 3 }     // Reduced from 4 per OpenAI/Gemini review 2026-05-15 — aligns with Lancet 2018 (4-5 yr LE loss reserved for 25+ drinks)
    ]
  },

  // Q5: Chronic Disease Diagnosis (High-Impact Risks)
  {
    id: 5,
    category: 'High-Impact Risks',
    question: 'Diabetes — which best describes you?',
    type: 'single',
    options: [
      { text: "I don't have diabetes", years: 0 },
      { text: 'Pre-diabetes', years: 1 },
      { text: 'Type 2 — well controlled (A1c in range, on plan)', years: 2 },
      { text: 'Type 2 — poorly controlled or newly diagnosed', years: 4 },
      { text: 'Type 1 diabetes', years: 3 }
    ]
  },
  // Q23 + Q24 split out from the original combined chronic-disease question
  // so users with very different severity profiles (controlled BP vs heart
  // attack history; basal cell skin cancer vs metastatic disease) get an
  // accurate health-age impact instead of one blunt average.
  {
    id: 23,
    category: 'High-Impact Risks',
    question: 'Cardiovascular — which best describes you?',
    type: 'single',
    options: [
      { text: "I don't have any cardiovascular condition", years: 0 },
      { text: 'High blood pressure or high cholesterol — controlled with treatment', years: 1 },
      { text: 'High blood pressure or high cholesterol — uncontrolled or untreated', years: 3 },
      { text: 'Atrial fibrillation (AFib) or heart failure', years: 5 },
      { text: 'Heart attack, stroke, stent, or bypass history', years: 6 }
    ]
  },
  {
    id: 24,
    category: 'High-Impact Risks',
    question: 'Cancer — which best describes you?',
    type: 'single',
    options: [
      { text: "I don't have and haven't had cancer", years: 0 },
      { text: 'Non-melanoma skin cancer (basal or squamous cell), treated', years: 0.5 },
      { text: 'Other cancer — in remission 5+ years', years: 1 },
      { text: 'Melanoma or other cancer — active treatment or recent (<5 years)', years: 4 },
      { text: 'Metastatic or stage IV cancer', years: 7 }
    ]
  },

  // Q6: Height & Weight (Body & Vitals)
  {
    id: 6,
    category: 'Body & Vitals',
    question: 'What is your height and weight?',
    type: 'bmi',
    note: 'Used to calculate your BMI',
    placeholder_feet: 'Height (feet)',
    placeholder_inches: 'Height (inches)',
    placeholder_weight: 'Weight (lbs)'
  },

  // Q25 — Body Shape modifier. BMI alone misclassifies muscular (overstates
  // risk) and "skinny-fat" (understates risk) people. 2026 BRI research
  // (Frontiers in Public Health, Nature) shows abdominal fat distribution
  // is what actually drives biological-age acceleration. We ask in plain
  // English because almost no one knows their waist circumference.
  {
    id: 25,
    category: 'Body & Vitals',
    question: 'Which best describes your current body type and weight distribution?',
    type: 'single',
    options: [
      { text: "Muscular build — visibly more muscle than average, broad shoulders, defined arms and legs", years: -2 },
      { text: "Even or pear-shape — weight sits more in hips, thighs, or buttocks", years: 0 },
      { text: "Apple-shape — weight collects around my stomach; waistband feels tight even when my legs fit fine", years: 2 },
      { text: "Lean but soft-belly (\"skinny fat\") — thin frame, but almost all extra weight is in my belly", years: 4.5 }  // Bumped from 3.5 per review — sarcopenic obesity literature supports higher value
    ]
  },

  // Q7: Blood Pressure (Body & Vitals)
  {
    id: 7,
    category: 'Body & Vitals',
    question: 'Select the option that best describes your blood pressure today.',
    type: 'single',
    options: [
      { text: 'Normal', years: 0 },
      { text: 'High', years: 2 },
      { text: 'I don\'t know', years: 0 }
    ]
  },

  // Q8: Resting Heart Rate (Body & Vitals)
  {
    id: 8,
    category: 'Body & Vitals',
    question: 'Do you know your resting heart rate?',
    type: 'single',
    options: [
      { text: 'Under 60 bpm', years: 0 },
      { text: '60–80 bpm', years: 0 },
      { text: '80+ bpm', years: 1 },
      { text: 'I don\'t know', years: 0 }
    ]
  },

  // Q9: Overall Health Rating (Body & Vitals)
  {
    id: 9,
    category: 'Body & Vitals',
    question: 'How would you describe your overall health?',
    type: 'single',
    options: [
      { text: 'Excellent', years: 0 },
      { text: 'Good', years: 0.5 },
      { text: 'Fair', years: 2 },
      { text: 'Poor', years: 4 }
    ]
  },

  // Q10: Exercise Frequency (Movement)
  {
    id: 10,
    category: 'Movement',
    question: 'How often do you exercise or move your body?',
    type: 'single',
    options: [
      { text: 'Rarely', years: 4.5 },     // Bumped from 3 per review 2026-05-15 — UCSD/BYU telomere studies show 8-9 yr biological-age gap for sedentary; we use 4.5 as point-in-time bio-age impact (conservative)
      { text: '1–2 days/week', years: 2 }, // Bumped from 1.5 per review
      { text: '3–4 days/week', years: 0 },
      { text: '5+ days/week', years: -1 }
    ]
  },

  // Q11: Daily Sitting Time (Movement)
  {
    id: 11,
    category: 'Movement',
    question: 'On a typical day, how many hours do you sit?',
    type: 'single',
    options: [
      { text: '<4 hours', years: 0 },
      { text: '4–8 hours', years: 1 },
      { text: '8+ hours', years: 2 }
    ]
  },

  // Q12: Fitness Perception (Movement)
  {
    id: 12,
    category: 'Movement',
    question: 'How physically fit do you feel compared to others your age?',
    type: 'single',
    options: [
      { text: 'Much fitter', years: -1 },
      { text: 'About the same', years: 0 },
      { text: 'Less fit', years: 2 }
    ]
  },

  // Q13: Sleep Hours (Sleep)
  {
    id: 13,
    category: 'Sleep',
    question: 'On average, how many hours of actual sleep do you get per night?',
    type: 'single',
    options: [
      { text: 'Less than 6 hours', years: 2.5 },
      { text: '6 to 7 hours', years: 0 },
      { text: '7 to 8 hours', years: -1.5 },
      { text: '8 to 9 hours', years: -1 },
      { text: 'More than 9 hours', years: 1 }
    ]
  },

  // Q14: Sleep Quality (Sleep)
  {
    id: 14,
    category: 'Sleep',
    question: 'How well do you usually sleep?',
    type: 'single',
    options: [
      { text: 'Very well', years: 0 },
      { text: 'Okay', years: 0.5 },
      { text: 'Poor', years: 2 }
    ]
  },

  // Q15: Sleep Apnea (Sleep)
  {
    id: 15,
    category: 'Sleep',
    question: 'Have you ever been told you might have sleep apnea?',
    type: 'single',
    options: [
      { text: 'No', years: 0 },
      { text: 'Yes (untreated)', years: 3 },
      { text: 'Yes (treated)', years: 0.5 }
    ]
  },

  // Q16: Diet Type (Nutrition)
  {
    id: 16,
    category: 'Nutrition',
    // Q16 — Ultra-Processed Food (UPF) % question. Replaces the prior 3-option
    // "how you usually eat" question with the 4-bucket UPF model backed by
    // 2026 telomere and biological-age research. Year impacts match the
    // PDF's "Aging Speed Table":
    //   100% whole = -0.5 (mild reversal),
    //   ~90/10     = 0,
    //   ~50/50     = 5 (PDF says +5-7 years bio-age impact),
    //   ~80%+ UPF  = 10 (PDF says +10-15 years bio-age impact).
    // The UPF % framing is far more accurate than "mostly whole vs mix" —
    // someone who eats fast food daily but also has salads scored "mix"
    // under the old question and got a tiny +1; that's clinically wrong.
    question: 'Which best describes the typical balance of your diet?',
    type: 'single',
    options: [
      { text: "Almost all whole foods — fruits, vegetables, beans, whole grains, fresh meats, eggs, fish, dairy. Rarely any packaged or fast food.", years: -0.5 },
      { text: "Mostly whole foods with some processed (about 80-90% whole, 10-20% packaged or restaurant food)", years: 0 },
      { text: "About half processed (50% of meals are packaged snacks, fast food, sugary drinks, frozen dinners, or takeout)", years: 3 },     // Reduced from 5 per OpenAI review 2026-05-15 — clinically defensible without biomarker backing
      { text: "Mostly processed (80%+ packaged, fast food, sugary drinks, frequent takeout — limited whole foods)", years: 5 }                 // Reduced from 10 per OpenAI review — +10 not defensible without biomarker tie-in
    ]
  },

  // Q17: Fast Food & Sugary Beverages (Nutrition)
  {
    id: 17,
    category: 'Nutrition',
    // Q17 refocused to sugar-sweetened beverages specifically — these are an
    // independent, additive risk on top of overall UPF %. 2026 research:
    // one soda a day = ~4.6 years biological aging acceleration over a
    // decade. We split into rarely / weekly / daily so the curve matches.
    question: 'How often do you drink sugar-sweetened beverages (sodas, sweetened coffee or tea, sports drinks, energy drinks, fruit juice)?',
    type: 'single',
    options: [
      { text: 'Rarely or never (less than 1 per week)', years: 0 },
      { text: 'A few times a week', years: 2 },
      { text: 'Daily', years: 4 }
    ]
  },

  // Q18: Healthy Protein Choices (Nutrition)
  {
    id: 18,
    category: 'Nutrition',
    question: 'How often do you eat healthy protein sources (fish, poultry, eggs, beans, nuts)?',
    type: 'single',
    options: [
      { text: 'Most of the time', years: 0 },
      { text: 'Sometimes', years: 1 },
      { text: 'Rarely', years: 2 }
    ]
  },

  // Q19: Stress Level (Mental Health)
  {
    id: 19,
    category: 'Mental Health',
    question: 'How would you rate your stress level?',
    type: 'single',
    options: [
      { text: 'Low', years: 0 },
      { text: 'Moderate', years: 1 },
      { text: 'High', years: 4 },                                              // Bumped from 3 per review 2026-05-15
      { text: 'Extreme — affecting sleep, health, or daily function', years: 5 } // NEW per review — Epel telomere data supports a higher tier without overclaiming "17 yrs"
    ]
  },

  // Q20: Depression or Low Mood (Mental Health)
  {
    id: 20,
    category: 'Mental Health',
    question: 'Have you experienced depression or low mood recently?',
    type: 'single',
    options: [
      { text: 'No', years: 0 },
      { text: 'Sometimes', years: 1 },
      { text: 'Often', years: 3 }
    ]
  },

  // Q26 — Social Connection / Isolation. Added 2026-05-15 per OpenAI + Gemini
  // scoring review. Holt-Lunstad meta-analyses (PLoS Med 2010, Perspect
  // Psychol Sci 2015) found social isolation has mortality risk comparable
  // to smoking 15 cigarettes/day. Strong support carries a small protective
  // bonus; isolation carries a substantial penalty.
  {
    id: 26,
    category: 'Mental Health',
    question: 'Do you have close relationships you can rely on emotionally?',
    type: 'single',
    options: [
      { text: 'Strong support — multiple close people I can count on', years: -1 },
      { text: 'Some support — a few people I can rely on', years: 0 },
      { text: 'Very little support — mostly handle things alone', years: 2 },
      { text: 'None — I feel chronically isolated', years: 3 }
    ]
  },

  // Q27 — Purpose / Life Engagement. Added 2026-05-15 per scoring review.
  // Blue Zones research (Buettner) and Boyle et al. Arch Gen Psych 2010
  // show strong sense of purpose associated with reduced all-cause mortality
  // and slower cognitive decline.
  {
    id: 27,
    category: 'Mental Health',
    question: 'Do you feel your life has meaning, purpose, or direction?',
    type: 'single',
    options: [
      { text: 'Strongly — I have clear purpose and reasons to keep going', years: -1 },
      { text: 'Mostly — most days I feel engaged with life', years: 0 },
      { text: 'Sometimes — I drift more than I would like', years: 1 },
      { text: 'Rarely — I struggle to find meaning most days', years: 2 }
    ]
  },

  // Q21 + Q22 are goal/level questions — they don't affect the True Health Age
  // calculation (years: 0 across the board). They feed Phase 2 priority sort
  // and the dashboard's tip personalization so we can match advice to what
  // the user actually wants to work on and where they're starting from.
  {
    id: 21,
    category: 'Goals',
    question: 'What matters most to you right now? (pick all that apply)',
    type: 'multi',
    options: [
      { text: 'More energy day-to-day', years: 0, goal: 'energy_fatigue' },
      { text: 'Lose weight or improve body composition', years: 0, goal: 'weight_metabolism' },
      { text: 'Get stronger and keep my mobility', years: 0, goal: 'strength_function' },
      { text: 'Protect my heart and live longer', years: 0, goal: 'heart_fitness' },
      { text: 'Sleep better and recover faster', years: 0, goal: 'sleep_recovery' },
      { text: 'Lower my stress / feel calmer', years: 0, goal: 'stress_mental' },
      { text: 'Sharper memory and focus', years: 0, goal: 'brain_performance' },
      { text: 'Better digestion and gut health', years: 0, goal: 'digestive_microbiome' },
      { text: 'Healthier skin and look younger', years: 0, goal: 'skin_health' },
      { text: 'Balance hormones / vitality', years: 0, goal: 'hormone_health_vitality' },
      { text: 'Prevent disease and age slowly', years: 0, goal: 'longevity_prevention' }
    ]
  },
  {
    id: 22,
    category: 'Goals',
    question: 'Where would you say you are on your health journey today?',
    type: 'single',
    options: [
      { text: "Newbie — I do very little for my health right now", years: 0, level: 'newbie' },
      { text: "Intermediate — I do some healthy things daily but not optimized", years: 0, level: 'intermediate' },
      { text: "Pro — I'm dialed in and always looking for the edge", years: 0, level: 'pro' }
    ]
  }
]

export default function Phase1Quiz({ onComplete }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [numberInput, setNumberInput] = useState('')
  const [loading, setLoading] = useState(false)
  // Track when each question was first shown so we can capture time-on-question
  // (the strategy doc's "drop-off points" signal lives here).
  const questionShownAtRef = useRef(Date.now())
  const startedRef = useRef(false)

  const currentQ = PHASE1_QUESTIONS[currentQuestion]

  // Fire quiz_started exactly once on first mount
  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true
    phTrack('quiz_started', { total_questions: PHASE1_QUESTIONS.length })
  }, [])

  // Reset the "shown at" stopwatch every time the question changes
  useEffect(() => {
    questionShownAtRef.current = Date.now()
  }, [currentQuestion])

  // Helper used by every answer handler below to log a uniform event
  const trackAnswer = (extras = {}) => {
    const ms = Date.now() - questionShownAtRef.current
    phTrack('quiz_question_answered', {
      question_id: currentQ.id,
      question_index: currentQuestion,
      question_category: currentQ.category,
      question_type: currentQ.type,
      time_on_question_ms: ms,
      ...extras,
    })
  }

  // When the user navigates back to a previously-answered number question
  // (age), repopulate the input so they see their prior answer and can
  // edit it instead of starting from a blank field.
  useEffect(() => {
    if (currentQ.type === 'number') {
      setNumberInput(answers[currentQ.id]?.text || '')
    }
    // BMI fields are uncontrolled (id-based DOM reads); rehydrate them
    // after the question renders.
    if (currentQ.type === 'bmi') {
      const prior = answers[currentQ.id]
      // Stored as "Healthy weight (BMI 22.4)" — we can't recover the
      // original feet/inches/lbs from that string. Pull them from a
      // sibling field we store on the answer if present; otherwise
      // leave the inputs blank for re-entry.
      const f = document.getElementById('feet')
      const i = document.getElementById('inches')
      const w = document.getElementById('weight')
      if (f) f.value = prior?.feet ?? ''
      if (i) i.value = prior?.inches ?? ''
      if (w) w.value = prior?.weight ?? ''
    }
  }, [currentQuestion])

  const handleBack = () => {
    if (currentQuestion === 0) return
    setCurrentQuestion(currentQuestion - 1)
  }

  const handleAnswer = (optionIndex) => {
    const qId = currentQ.id
    const selectedOption = currentQ.options[optionIndex]

    setAnswers({
      ...answers,
      [qId]: {
        text: selectedOption.text,
        years: selectedOption.years
      }
    })
    trackAnswer({ answer_text: selectedOption.text })

    if (currentQuestion < PHASE1_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setNumberInput('')
    }
  }

  const handleNumberAnswer = () => {
    if (!numberInput.trim()) {
      alert('Please enter your age')
      return
    }

    const qId = currentQ.id
    setAnswers({
      ...answers,
      [qId]: {
        text: numberInput,
        years: 0
      }
    })
    trackAnswer({ answer_text: numberInput })

    if (currentQuestion < PHASE1_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setNumberInput('')
    }
  }

  const handleMultiSelect = (optionIndex) => {
    const qId = currentQ.id
    const selectedOption = currentQ.options[optionIndex]

    const currentAnswers = answers[qId]?.selections || []
    const alreadySelected = currentAnswers.find(a => a.text === selectedOption.text)

    let updatedSelections
    if (alreadySelected) {
      updatedSelections = currentAnswers.filter(a => a.text !== selectedOption.text)
    } else {
      // If "None" is selected, clear other selections
      if (selectedOption.isNone) {
        updatedSelections = [selectedOption]
      } else {
        // Remove "None" if other options are selected
        updatedSelections = [...currentAnswers.filter(a => !a.isNone), selectedOption]
      }
    }

    setAnswers({
      ...answers,
      [qId]: {
        selections: updatedSelections,
        years: updatedSelections.reduce((sum, a) => sum + a.years, 0)
      }
    })
    trackAnswer({ answer_text: updatedSelections.map(s => s.text).join(', '), multi: true })

    // If "None" is selected, automatically proceed
    if (selectedOption.isNone && !alreadySelected) {
      setTimeout(() => {
        if (currentQuestion < PHASE1_QUESTIONS.length - 1) {
          setCurrentQuestion(currentQuestion + 1)
          setNumberInput('')
        }
      }, 100)
    }
  }

  const handleBMIAnswer = (feetInput, inchesInput, weightInput) => {
    if (!feetInput.trim() || !inchesInput.trim() || !weightInput.trim()) {
      alert('Please enter height (feet and inches) and weight')
      return
    }

    const feet = parseFloat(feetInput)
    const inches = parseFloat(inchesInput)
    const weight = parseFloat(weightInput)

    if (isNaN(feet) || isNaN(inches) || isNaN(weight) || feet < 0 || inches < 0 || weight <= 0 || inches >= 12) {
      alert('Please enter valid height and weight')
      return
    }

    // Convert to total inches: (feet * 12) + inches
    const totalHeightInches = (feet * 12) + inches

    // Calculate BMI: (weight in pounds / (height in inches)^2) * 703
    const bmi = (weight / (totalHeightInches * totalHeightInches)) * 703

    // BMI scoring rebuilt per the 2026 Body Roundness Index (BRI) research
    // (Frontiers in Public Health, Nature). Baseline biological-age impact is
    // now per the PDF spec — body shape modifier follows in Q25 to correct
    // for BMI's well-known under/overestimation on muscular and skinny-fat
    // body types.
    let bmiYears = 0
    let bmiCategory = ''
    if (bmi < 18.5) {
      bmiYears = 0.5
      bmiCategory = `Underweight (BMI ${bmi.toFixed(1)})`
    } else if (bmi < 25) {
      bmiYears = 0
      bmiCategory = `Healthy weight (BMI ${bmi.toFixed(1)})`
    } else if (bmi < 30) {
      bmiYears = 1.5
      bmiCategory = `Overweight (BMI ${bmi.toFixed(1)})`
    } else {
      bmiYears = 3.5
      bmiCategory = `Obese (BMI ${bmi.toFixed(1)})`
    }

    const qId = currentQ.id
    setAnswers({
      ...answers,
      [qId]: {
        text: bmiCategory,
        years: bmiYears,
        bmi: bmi,
        feet: feetInput,
        inches: inchesInput,
        weight: weightInput,
      }
    })
    trackAnswer({ answer_text: bmiCategory, bmi: Math.round(bmi * 10) / 10 })

    if (currentQuestion < PHASE1_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setNumberInput('')
    }
  }

  const handleSubmit = async () => {
    setLoading(true)

    try {
      // Calculate phase 1 results using original algorithm
      const results = calculatePhase1Results(answers)

      // Just proceed to results page - email/webhook handled later in email capture phase
      onComplete(results, null)
    } catch (error) {
      console.error('Error submitting quiz:', error)
      alert('Error calculating results. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const isCurrentAnswered = () => {
    if (currentQ.type === 'multi') {
      return answers[currentQ.id]?.selections?.length > 0
    }
    return !!answers[currentQ.id]
  }

  const canSubmit = Object.keys(answers).length === PHASE1_QUESTIONS.length
  const progress = ((Object.keys(answers).length) / PHASE1_QUESTIONS.length) * 100

  return (
    <div className="phase1-quiz">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
      <div className="progress-text">
        {currentQ.category} • Question {currentQuestion + 1} of {PHASE1_QUESTIONS.length}
      </div>

      <div className="question-container">
        <div className="question-banner">
          <img src={TrueHealthAgeLogo} alt="TrueHealth Age" className="question-logo" />
          <span className="question-number">Question {currentQuestion + 1}</span>
        </div>
        <h2>{currentQ.question}</h2>
        {currentQ.note && <p className="question-note">{currentQ.note}</p>}

        {currentQ.type === 'number' ? (
          <div className="number-input-group">
            <input
              type="number"
              placeholder={currentQ.placeholder}
              value={numberInput}
              onChange={(e) => setNumberInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleNumberAnswer()}
              min="1"
              max="150"
            />
            <button
              onClick={handleNumberAnswer}
              className="next-btn"
            >
              Next →
            </button>
          </div>
        ) : currentQ.type === 'bmi' ? (
          <div className="bmi-input-group">
            <div className="bmi-inputs">
              <input
                type="number"
                id="feet"
                placeholder={currentQ.placeholder_feet}
                min="3"
                max="8"
                step="1"
              />
              <input
                type="number"
                id="inches"
                placeholder={currentQ.placeholder_inches}
                min="0"
                max="11"
                step="1"
              />
              <input
                type="number"
                id="weight"
                placeholder={currentQ.placeholder_weight}
                min="1"
                max="999"
                step="0.1"
              />
            </div>
            <button
              onClick={() => {
                const feet = document.getElementById('feet').value
                const inches = document.getElementById('inches').value
                const weight = document.getElementById('weight').value
                handleBMIAnswer(feet, inches, weight)
              }}
              className="next-btn"
            >
              Next →
            </button>
          </div>
        ) : (
          <div className="options">
            {currentQ.options.map((option, idx) => (
              <button
                key={idx}
                className={`option-btn ${
                  currentQ.type === 'multi'
                    ? answers[currentQ.id]?.selections?.some(a => a.text === option.text) ? 'selected' : ''
                    : answers[currentQ.id]?.text === option.text ? 'selected' : ''
                }`}
                onClick={() => {
                  if (currentQ.type === 'multi') {
                    handleMultiSelect(idx)
                  } else {
                    handleAnswer(idx)
                  }
                }}
              >
                {option.text}
              </button>
            ))}
          </div>
        )}

        {currentQ.type === 'multi' && isCurrentAnswered() && (
          <button
            onClick={() => {
              if (currentQuestion < PHASE1_QUESTIONS.length - 1) {
                setCurrentQuestion(currentQuestion + 1)
              }
            }}
            className="next-btn"
          >
            Next Question →
          </button>
        )}

        <div className="quiz-nav">
          <button
            type="button"
            className="back-btn"
            onClick={handleBack}
            disabled={currentQuestion === 0}
          >
            ← Back
          </button>
        </div>
      </div>

      {canSubmit && (
        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Calculating Your Health Age...' : 'See Your Results'}
        </button>
      )}
    </div>
  )
}
