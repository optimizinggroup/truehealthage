import { useState } from 'react'
import { calculatePhase2Results } from '../utils/quizLogic'
import '../styles/Phase2Selection.css'

const HEALTH_AREAS = [
  { id: 'cardiovascular', name: 'Cardiovascular Health', icon: '❤️', description: 'Heart, blood pressure, circulation' },
  { id: 'metabolic', name: 'Metabolic Health', icon: '⚡', description: 'Blood sugar, insulin, metabolism' },
  { id: 'musculoskeletal', name: 'Musculoskeletal', icon: '💪', description: 'Bones, muscles, joints' },
  { id: 'immune', name: 'Immune Function', icon: '🛡️', description: 'Immunity, inflammation response' },
  { id: 'neurological', name: 'Neurological', icon: '🧠', description: 'Brain health, cognitive function' },
  { id: 'endocrine', name: 'Endocrine System', icon: '🔄', description: 'Hormones, glands, balance' },
  { id: 'digestive', name: 'Digestive Health', icon: '🫀', description: 'Gut, digestion, absorption' },
  { id: 'respiratory', name: 'Respiratory Health', icon: '🫁', description: 'Lungs, breathing, oxygen' },
  { id: 'mental_health', name: 'Mental Health', icon: '😊', description: 'Mood, anxiety, depression' },
  { id: 'sleep_quality', name: 'Sleep Quality', icon: '😴', description: 'Sleep duration, quality, cycles' },
]

const AREA_QUESTIONS = {
  cardiovascular: [
    'How often do you experience shortness of breath?',
    'Do you have a family history of heart disease?',
    'What is your typical resting heart rate?',
    'How is your blood pressure?',
  ],
  metabolic: [
    'Do you have symptoms of blood sugar imbalance?',
    'How is your energy throughout the day?',
    'Do you crave sugar or carbs frequently?',
    'How is your weight distribution?',
  ],
  musculoskeletal: [
    'Do you experience joint pain or stiffness?',
    'How strong is your core?',
    'Do you have flexibility limitations?',
    'Any history of injuries?',
  ],
  immune: [
    'How often do you get colds or flu?',
    'Do you experience chronic inflammation?',
    'How is your wound healing?',
    'Do you have food sensitivities?',
  ],
  neurological: [
    'Do you experience brain fog?',
    'How is your memory?',
    'Do you have trouble concentrating?',
    'Any tremors or nerve issues?',
  ],
  endocrine: [
    'Do you have hormone imbalances?',
    'How are your energy and mood swings?',
    'Any thyroid concerns?',
    'How is your metabolic rate?',
  ],
  digestive: [
    'Do you experience bloating or gas?',
    'How are your bowel movements?',
    'Any food intolerances?',
    'How is your appetite?',
  ],
  respiratory: [
    'Do you experience shortness of breath?',
    'Any chronic cough or wheezing?',
    'How is your lung capacity?',
    'Any asthma or allergies?',
  ],
  mental_health: [
    'How often do you feel anxious?',
    'Do you struggle with depression?',
    'How is your stress resilience?',
    'Any racing thoughts or worry?',
  ],
  sleep_quality: [
    'How long does it take to fall asleep?',
    'Do you wake during the night?',
    'How refreshed do you feel upon waking?',
    'Any sleep disorders?',
  ],
}

export default function Phase2Selection({
  phase1Results,
  resultId,
  selectedAreas: initialSelectedAreas,
  showGateway,
  onComplete
}) {
  const [selectedAreas, setSelectedAreas] = useState(initialSelectedAreas || [])
  const [areaResponses, setAreaResponses] = useState({})
  const [currentArea, setCurrentArea] = useState(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleAreaSelect = (areaId) => {
    if (selectedAreas.includes(areaId)) {
      setSelectedAreas(selectedAreas.filter(id => id !== areaId))
      setCurrentArea(null)
    } else {
      setSelectedAreas([...selectedAreas, areaId])
      setCurrentArea(areaId)
      setCurrentQuestionIndex(0)
    }
  }

  const handleAreaResponse = (response) => {
    if (!currentArea) return

    if (!areaResponses[currentArea]) {
      areaResponses[currentArea] = []
    }
    areaResponses[currentArea][currentQuestionIndex] = response

    const areaQuestions = AREA_QUESTIONS[currentArea]
    if (currentQuestionIndex < areaQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setCurrentQuestionIndex(0)
      setCurrentArea(null)
    }
  }

  const handleSubmit = () => {
    setLoading(true)

    try {
      const results = calculatePhase2Results(areaResponses, selectedAreas)
      onComplete(results)
    } catch (error) {
      console.error('Error calculating phase 2:', error)
      alert('Error calculating results. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const allQuestionsAnswered = selectedAreas.every(
    area => areaResponses[area]?.length === AREA_QUESTIONS[area].length
  )

  // Gateway mode: just area selection
  if (showGateway) {
    return (
      <div className="phase2-gateway">
        <h2>Which health areas would you like to explore?</h2>
        <p>Select one or more areas for personalized insights</p>

        <div className="areas-grid">
          {HEALTH_AREAS.map(area => (
            <div
              key={area.id}
              className={`area-card ${selectedAreas.includes(area.id) ? 'selected' : ''}`}
              onClick={() => {
                if (selectedAreas.includes(area.id)) {
                  setSelectedAreas(selectedAreas.filter(id => id !== area.id))
                } else {
                  setSelectedAreas([...selectedAreas, area.id])
                }
              }}
            >
              <div className="area-icon">{area.icon}</div>
              <h3>{area.name}</h3>
              <p>{area.description}</p>
            </div>
          ))}
        </div>

        {selectedAreas.length > 0 && (
          <button
            className="proceed-btn"
            onClick={() => onComplete(selectedAreas)}
          >
            Continue to Detailed Assessment →
          </button>
        )}
      </div>
    )
  }

  if (currentArea) {
    const areaName = HEALTH_AREAS.find(a => a.id === currentArea)?.name
    const questions = AREA_QUESTIONS[currentArea]
    const currentQuestion = questions[currentQuestionIndex]

    return (
      <div className="area-questionnaire">
        <div className="area-header">
          <h2>{areaName}</h2>
          <p>Question {currentQuestionIndex + 1} of {questions.length}</p>
        </div>
        <div className="question-container">
          <h3>{currentQuestion}</h3>
          <div className="response-options">
            {['Not a concern', 'Mild issue', 'Moderate issue', 'Significant concern'].map((option) => (
              <button
                key={option}
                className="response-btn"
                onClick={() => handleAreaResponse(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="phase2-selection">
      <h2>Deep Dive into 10 Health Areas</h2>
      <p>Select the areas you'd like to explore deeper</p>

      <div className="areas-grid">
        {HEALTH_AREAS.map(area => (
          <div
            key={area.id}
            className={`area-card ${selectedAreas.includes(area.id) ? 'selected' : ''}`}
            onClick={() => handleAreaSelect(area.id)}
          >
            <div className="area-icon">{area.icon}</div>
            <h3>{area.name}</h3>
            <p>{area.description}</p>
            {selectedAreas.includes(area.id) && (
              <div className="completion-indicator">
                {areaResponses[area.id]?.length || 0} / {AREA_QUESTIONS[area.id].length}
              </div>
            )}
          </div>
        ))}
      </div>

      {allQuestionsAnswered && selectedAreas.length > 0 && (
        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Generating Your Health Report...' : 'View Your Health Report'}
        </button>
      )}
    </div>
  )
}
