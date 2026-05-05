import { useState } from 'react'
import axios from 'axios'
import { calculatePhase1Results } from '../utils/quizLogic'
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
      { text: '15+', years: 4 }
    ]
  },

  // Q5: Chronic Disease Diagnosis (High-Impact Risks)
  {
    id: 5,
    category: 'High-Impact Risks',
    question: 'Have you been diagnosed with any of the following?',
    type: 'multi',
    options: [
      { text: 'None', years: 0, isNone: true },
      { text: 'Diabetes', years: 3 },
      { text: 'Heart disease', years: 6 },
      { text: 'Cancer', years: 4 }
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

  // Q7: Blood Pressure (Body & Vitals)
  {
    id: 7,
    category: 'Body & Vitals',
    question: 'Do you know your blood pressure?',
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
      { text: 'Rarely', years: 3 },
      { text: '1–2 days/week', years: 1.5 },
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
    question: 'How many hours do you sleep per night on average?',
    type: 'single',
    options: [
      { text: '<6 hours', years: 2 },
      { text: '6–7 hours', years: 1 },
      { text: '7–8 hours', years: 0 },
      { text: '8+ hours', years: 0 }
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
    question: 'Which best describes how you usually eat?',
    type: 'single',
    options: [
      { text: 'Mostly whole foods', years: 0 },
      { text: 'Mix of whole and processed', years: 1 },
      { text: 'Mostly processed or fast foods', years: 3 }
    ]
  },

  // Q17: Fast Food & Sugary Beverages (Nutrition)
  {
    id: 17,
    category: 'Nutrition',
    question: 'How often do you eat fast food, packaged snacks, or drink sugary beverages?',
    type: 'single',
    options: [
      { text: 'Rarely (<1/week)', years: 0 },
      { text: 'A few times/week', years: 1.5 },
      { text: 'Daily', years: 3 }
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
      { text: 'High', years: 3 }
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
