import { useState, useEffect } from 'react'
import { PHASE2_CATEGORIES, PHASE2_QUESTIONS } from '../utils/phase2Data'
import '../styles/branding.css'
import '../styles/Phase2Quiz.css'

export default function Phase2Quiz({ selectedAreas = [], onComplete }) {
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState({})

  // Build flat list of all questions across selected areas
  const questionList = []
  selectedAreas.forEach(areaId => {
    const questions = PHASE2_QUESTIONS[areaId] || []
    questions.forEach(q => {
      questionList.push({ ...q, categoryId: areaId })
    })
  })

  const currentQuestion = questionList[currentAreaIndex * 6 + currentQuestionIndex] || null
  const currentCategory = PHASE2_CATEGORIES.find(c => c.id === currentQuestion?.categoryId)

  const totalQuestions = questionList.length
  const currentQuestionNumber = currentAreaIndex * 6 + currentQuestionIndex + 1

  // Initialize responses structure
  useEffect(() => {
    const newResponses = {}
    selectedAreas.forEach(areaId => {
      newResponses[areaId] = {}
    })
    setResponses(newResponses)
  }, [selectedAreas])

  const handleOptionClick = (option) => {
    const categoryId = currentQuestion.categoryId
    const updatedResponses = { ...responses }

    updatedResponses[categoryId][currentQuestion.id] = {
      label: option.label,
      value: option.value,
      score: option.score,
      risk_tags: option.risk_tags,
      protocol_triggers: option.protocol_triggers,
      escalation_flag: option.escalation_flag || false
    }

    setResponses(updatedResponses)
  }

  const handleNext = () => {
    const categoryId = currentQuestion.categoryId
    const answered = responses[categoryId]?.[currentQuestion.id]

    if (!answered) {
      alert('Please answer the question before continuing.')
      return
    }

    // Move to next question
    if (currentAreaIndex * 6 + currentQuestionIndex < totalQuestions - 1) {
      // Calculate next position
      let nextArea = currentAreaIndex
      let nextQuestion = currentQuestionIndex + 1

      if (nextQuestion >= 6) {
        nextArea += 1
        nextQuestion = 0
      }

      setCurrentAreaIndex(nextArea)
      setCurrentQuestionIndex(nextQuestion)
    } else {
      // All complete - submit
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    onComplete({
      responses,
      selectedAreas,
      timestamp: new Date().toISOString()
    })
  }

  const handleBack = () => {
    if (currentAreaIndex === 0 && currentQuestionIndex === 0) return

    let prevArea = currentAreaIndex
    let prevQuestion = currentQuestionIndex - 1

    if (prevQuestion < 0) {
      prevArea -= 1
      prevQuestion = 5
    }

    setCurrentAreaIndex(prevArea)
    setCurrentQuestionIndex(prevQuestion)
  }

  if (!currentQuestion) {
    return <div className="phase2-quiz"><div className="loading">Loading assessment...</div></div>
  }

  const isAnswered = responses[currentQuestion.categoryId]?.[currentQuestion.id]
  const isLastQuestion = currentQuestionNumber === totalQuestions

  return (
    <div className="phase2-quiz">
      <div className="quiz-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(currentQuestionNumber / totalQuestions) * 100}%` }}
          />
        </div>
        <p className="progress-text">
          Question {currentQuestionNumber} of {totalQuestions}
        </p>
      </div>

      <div className="quiz-container">
        <div className="quiz-header">
          <span className="category-icon">{currentCategory?.icon}</span>
          <h2>{currentCategory?.name}</h2>
        </div>

        <div className="quiz-content">
          <h3 className="question-text">{currentQuestion.question}</h3>

          <div className="options-container">
            {currentQuestion.options.map((option) => {
              const isSelected = responses[currentQuestion.categoryId]?.[currentQuestion.id]?.value === option.value

              return (
                <button
                  key={option.value}
                  className={`option-btn ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleOptionClick(option)}
                >
                  <div className="option-content">
                    <span className="option-label">{option.label}</span>
                  </div>
                  {isSelected && <span className="checkmark">✓</span>}
                </button>
              )
            })}
          </div>
        </div>

        <div className="quiz-footer">
          <button
            className="back-btn"
            onClick={handleBack}
            disabled={currentQuestionNumber === 1}
          >
            ← Back
          </button>

          <button
            className={`next-btn ${isAnswered ? 'active' : 'disabled'}`}
            onClick={handleNext}
            disabled={!isAnswered}
          >
            {isLastQuestion ? 'See Your Results' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
