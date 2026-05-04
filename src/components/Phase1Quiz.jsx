import { useState } from 'react'
import axios from 'axios'
import { calculatePhase1Results } from '../utils/quizLogic'
import '../styles/Phase1Quiz.css'

// ORIGINAL EVIDENCE-BASED QUESTIONS WITH YEARS SCORING
const PHASE1_QUESTIONS = [
  // MODULE 1: The Basics
  {
    id: 1,
    module: 'Basics',
    question: 'What is your biological sex?',
    type: 'single',
    options: [
      { text: 'Female', years: 0 },
      { text: 'Male', years: 2 },
      { text: 'Other', years: 0 }
    ]
  },
  {
    id: 2,
    module: 'Basics',
    question: 'What is your current age?',
    type: 'number',
    placeholder: 'Enter your age',
    years: 0
  },

  // MODULE 2: Smoking & Substances
  {
    id: 3,
    module: 'Smoking & Substances',
    question: 'What is your smoking status?',
    type: 'single',
    options: [
      { text: 'Never smoked', years: 0 },
      { text: 'Quit 10+ years ago', years: 0.5 },
      { text: 'Quit 5-10 years ago', years: 1 },
      { text: 'Quit 1-5 years ago', years: 2 },
      { text: 'Occasional (few per month)', years: 3 },
      { text: 'Occasional (few per week)', years: 4 },
      { text: 'Regular smoker (1 pack/day)', years: 6 },
      { text: 'Heavy smoker (1.5+ packs/day)', years: 7 }
    ]
  },
  {
    id: 4,
    module: 'Smoking & Substances',
    question: 'Do you vape or use e-cigarettes?',
    type: 'single',
    options: [
      { text: 'Never', years: 0 },
      { text: 'Occasionally', years: 0.5 },
      { text: 'Regularly', years: 1 },
      { text: 'Daily', years: 2 }
    ]
  },
  {
    id: 5,
    module: 'Smoking & Substances',
    question: 'How much alcohol do you drink per week?',
    type: 'single',
    options: [
      { text: 'None', years: 0 },
      { text: '1-2 drinks', years: 0 },
      { text: '3-7 drinks', years: 0.5 },
      { text: '8-14 drinks', years: 1.5 },
      { text: '15+ drinks (heavy)', years: 3 }
    ]
  },

  // MODULE 3: Body & Vitals
  {
    id: 6,
    module: 'Body & Vitals',
    question: 'What is your height and weight? (for BMI calculation)',
    type: 'bmi',
    note: 'This helps us calculate your BMI accurately',
    placeholder_height: 'Height (inches)',
    placeholder_weight: 'Weight (lbs)'
  },
  {
    id: 7,
    module: 'Body & Vitals',
    question: 'Do you have any diagnosed chronic conditions?',
    type: 'multi',
    options: [
      { text: 'None', years: 0 },
      { text: 'Heart disease', years: 6 },
      { text: 'Hypertension (high blood pressure)', years: 2 },
      { text: 'Type 2 diabetes', years: 3 },
      { text: 'Cancer history', years: 4 },
      { text: 'Autoimmune condition', years: 2 },
      { text: 'Thyroid disorder', years: 1 },
      { text: 'Other', years: 1 }
    ]
  },
  {
    id: 8,
    module: 'Body & Vitals',
    question: 'What is your resting heart rate (beats per minute)?',
    type: 'single',
    options: [
      { text: 'I don\'t know', years: 0 },
      { text: '<40 bpm', years: -1 },
      { text: '40-59 bpm', years: 0 },
      { text: '60-79 bpm', years: 0.5 },
      { text: '80-99 bpm', years: 1 },
      { text: '100+ bpm', years: 2 }
    ]
  },
  {
    id: 9,
    module: 'Body & Vitals',
    question: 'What is your blood pressure?',
    type: 'single',
    options: [
      { text: 'I don\'t know', years: 0 },
      { text: 'Normal (<120/80)', years: 0 },
      { text: 'Elevated (120-129/<80)', years: 0.5 },
      { text: 'Stage 1 (130-139/80-89)', years: 1.5 },
      { text: 'Stage 2 (140+/90+)', years: 3 }
    ]
  },

  // MODULE 4: Movement & Fitness
  {
    id: 10,
    module: 'Movement & Fitness',
    question: 'How physically active are you?',
    type: 'single',
    options: [
      { text: 'Sedentary (little to no exercise)', years: 3 },
      { text: 'Lightly active (1-3 days/week)', years: 1.5 },
      { text: 'Moderately active (3-4 days/week)', years: 0 },
      { text: 'Very active (5-6 days/week)', years: -0.5 },
      { text: 'Extremely active (7 days/week)', years: -1.5 }
    ]
  },
  {
    id: 11,
    module: 'Movement & Fitness',
    question: 'Do you do strength/resistance training?',
    type: 'single',
    options: [
      { text: 'Never', years: 0 },
      { text: 'Occasionally (1-2x/month)', years: -0.25 },
      { text: 'Regularly (1-2x/week)', years: -0.5 },
      { text: 'Frequently (3+x/week)', years: -1 }
    ]
  },
  {
    id: 12,
    module: 'Movement & Fitness',
    question: 'How much do you sit per day?',
    type: 'single',
    options: [
      { text: '<3 hours', years: 0 },
      { text: '3-5 hours', years: 0.5 },
      { text: '5-8 hours', years: 1 },
      { text: '8+ hours', years: 2 }
    ]
  },

  // MODULE 5: Sleep
  {
    id: 13,
    module: 'Sleep',
    question: 'How many hours of sleep do you typically get per night?',
    type: 'single',
    options: [
      { text: '<5 hours', years: 4 },
      { text: '5-6 hours', years: 2 },
      { text: '6-7 hours', years: 1 },
      { text: '7-9 hours', years: 0 },
      { text: '9+ hours', years: -1 }
    ]
  },
  {
    id: 14,
    module: 'Sleep',
    question: 'How would you rate your sleep quality?',
    type: 'single',
    options: [
      { text: 'Poor (restless, frequent wake-ups)', years: 2 },
      { text: 'Fair (occasional issues)', years: 1 },
      { text: 'Good (generally restful)', years: -0.5 },
      { text: 'Excellent (wake refreshed)', years: -0.5 }
    ]
  },
  {
    id: 15,
    module: 'Sleep',
    question: 'Do you have or suspect sleep apnea?',
    type: 'single',
    options: [
      { text: 'No', years: 0 },
      { text: 'Suspect but untreated', years: 3 },
      { text: 'Diagnosed and treated', years: 0.5 }
    ]
  },

  // MODULE 6: Diet & Nutrition
  {
    id: 16,
    module: 'Diet & Nutrition',
    question: 'How would you describe your typical diet?',
    type: 'single',
    options: [
      { text: 'Poor (mostly processed, fast food)', years: 3 },
      { text: 'Fair (mix of processed and whole foods)', years: 1.5 },
      { text: 'Good (mostly whole foods, occasional processed)', years: -0.5 },
      { text: 'Excellent (Mediterranean, whole-food based)', years: -1.5 }
    ]
  },
  {
    id: 17,
    module: 'Diet & Nutrition',
    question: 'How often do you eat fruits and vegetables?',
    type: 'single',
    options: [
      { text: 'Rarely', years: 2 },
      { text: '1-2 servings per day', years: 1 },
      { text: '3-4 servings per day', years: -0.5 },
      { text: '5+ servings per day', years: -1 }
    ]
  },
  {
    id: 18,
    module: 'Diet & Nutrition',
    question: 'How much ultra-processed food do you eat?',
    type: 'single',
    options: [
      { text: 'Most meals', years: 2 },
      { text: 'Several meals per week', years: 1.5 },
      { text: 'Occasionally', years: 0.5 },
      { text: 'Rarely', years: 0 }
    ]
  },

  // MODULE 7: Mental Health
  {
    id: 19,
    module: 'Mental Health',
    question: 'How would you describe your typical stress level?',
    type: 'single',
    options: [
      { text: 'Very high (constant stress)', years: 3 },
      { text: 'High (frequent stress)', years: 2 },
      { text: 'Moderate (manageable)', years: 0.5 },
      { text: 'Low (well-managed)', years: 0 }
    ]
  },
  {
    id: 20,
    module: 'Mental Health',
    question: 'Do you experience depression?',
    type: 'single',
    options: [
      { text: 'No', years: 0 },
      { text: 'Occasionally', years: 0.5 },
      { text: 'Yes, but managed', years: 1 },
      { text: 'Yes, untreated', years: 3 }
    ]
  },
  {
    id: 21,
    module: 'Mental Health',
    question: 'Do you have a strong sense of purpose?',
    type: 'single',
    options: [
      { text: 'Not really', years: 2 },
      { text: 'Somewhat', years: 0.5 },
      { text: 'Yes', years: -0.5 },
      { text: 'Very much', years: -1 }
    ]
  },

  // MODULE 8: Social Connection
  {
    id: 22,
    module: 'Social Connection',
    question: 'How many close relationships do you have?',
    type: 'single',
    options: [
      { text: 'None', years: 4 },
      { text: '1-2', years: 2 },
      { text: '3-5', years: 0 },
      { text: '6+', years: -1 }
    ]
  },
  {
    id: 23,
    module: 'Social Connection',
    question: 'How often do you interact socially in person?',
    type: 'single',
    options: [
      { text: 'Rarely/Never', years: 2 },
      { text: 'Monthly', years: 1 },
      { text: 'Weekly', years: 0.5 },
      { text: 'Multiple times per week', years: -0.5 }
    ]
  },

  // MODULE 9: Recent Life Events
  {
    id: 24,
    module: 'Recent Life Events',
    question: 'Have any major life events happened in the past 2 years?',
    type: 'multi',
    options: [
      { text: 'None', years: 0 },
      { text: 'Death of loved one', years: 3 },
      { text: 'Divorce/breakup', years: 2 },
      { text: 'Job loss', years: 2 },
      { text: 'Serious illness/injury', years: 2 },
      { text: 'Major financial stress', years: 1.5 },
      { text: 'Relocation', years: 1 }
    ]
  },

  // MODULE 10: Family History
  {
    id: 25,
    module: 'Family History',
    question: 'How long did your parents/grandparents typically live?',
    type: 'single',
    options: [
      { text: '<70 years', years: 3 },
      { text: '70-80 years', years: 1 },
      { text: '80-90 years', years: -1 },
      { text: '90+ years', years: -2 }
    ]
  },
  {
    id: 26,
    module: 'Family History',
    question: 'Do you have first-degree relatives with early Alzheimer\'s disease?',
    type: 'single',
    options: [
      { text: 'No', years: 0 },
      { text: 'Yes (parent/sibling before age 65)', years: 1.5 }
    ]
  }
]

export default function Phase1Quiz({ onComplete }) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [numberInput, setNumberInput] = useState('')
  const [loading, setLoading] = useState(false)

  const currentQ = PHASE1_QUESTIONS[currentQuestion]

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
      updatedSelections = [...currentAnswers, selectedOption]
    }

    setAnswers({
      ...answers,
      [qId]: {
        selections: updatedSelections,
        years: updatedSelections.reduce((sum, a) => sum + a.years, 0)
      }
    })
  }

  const handleBMIAnswer = (heightInput, weightInput) => {
    if (!heightInput.trim() || !weightInput.trim()) {
      alert('Please enter both height and weight')
      return
    }

    const height = parseFloat(heightInput)
    const weight = parseFloat(weightInput)

    if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
      alert('Please enter valid height and weight')
      return
    }

    // Calculate BMI: (weight in pounds / (height in inches)^2) * 703
    const bmi = (weight / (height * height)) * 703

    let bmiYears = 0
    let bmiCategory = ''
    if (bmi < 18.5) {
      bmiYears = 1
      bmiCategory = `Underweight (BMI ${bmi.toFixed(1)})`
    } else if (bmi < 25) {
      bmiYears = 0
      bmiCategory = `Healthy weight (BMI ${bmi.toFixed(1)})`
    } else if (bmi < 30) {
      bmiYears = 1.5
      bmiCategory = `Overweight (BMI ${bmi.toFixed(1)})`
    } else if (bmi < 35) {
      bmiYears = 3
      bmiCategory = `Obese Class I (BMI ${bmi.toFixed(1)})`
    } else {
      bmiYears = 4
      bmiCategory = `Obese Class II (BMI ${bmi.toFixed(1)})`
    }

    const qId = currentQ.id
    setAnswers({
      ...answers,
      [qId]: {
        text: bmiCategory,
        years: bmiYears,
        bmi: bmi
      }
    })

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
        {currentQ.module} • Question {currentQuestion + 1} of {PHASE1_QUESTIONS.length}
      </div>

      <div className="question-container">
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
                id="height"
                placeholder={currentQ.placeholder_height}
                min="1"
                max="120"
                step="0.1"
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
                const height = document.getElementById('height').value
                const weight = document.getElementById('weight').value
                handleBMIAnswer(height, weight)
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
