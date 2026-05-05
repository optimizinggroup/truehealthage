import { useState } from 'react'
import Phase2Gateway from './Phase2Gateway'
import Phase2Quiz from './Phase2Quiz'
import Phase2Results from './Phase2Results'
import '../styles/Phase2Selection.css'

export default function Phase2Selection({
  phase1Results,
  resultId,
  onComplete
}) {
  const [stage, setStage] = useState('gateway') // gateway, quiz, results
  const [selectedAreas, setSelectedAreas] = useState([])
  const [phase2Data, setPhase2Data] = useState(null)

  const handleGatewayStart = (areas) => {
    setSelectedAreas(areas)
    setStage('quiz')
  }

  const handleGatewaySkip = () => {
    onComplete({
      phase1Results,
      phase2Results: null,
      stage: 'complete'
    })
  }

  const handleQuizComplete = (data) => {
    setPhase2Data(data)
    setStage('results')
  }

  const handleResultsComplete = () => {
    onComplete({
      phase1Results,
      phase2Results: phase2Data,
      selectedAreas,
      stage: 'complete',
      timestamp: new Date().toISOString()
    })
  }

  if (stage === 'gateway') {
    return (
      <Phase2Gateway
        phase1Results={phase1Results}
        onStart={handleGatewayStart}
        onSkip={handleGatewaySkip}
      />
    )
  }

  if (stage === 'quiz') {
    return (
      <Phase2Quiz
        selectedAreas={selectedAreas}
        onComplete={handleQuizComplete}
      />
    )
  }

  if (stage === 'results') {
    return (
      <Phase2Results
        phase1Results={phase1Results}
        phase2Data={phase2Data}
        onComplete={handleResultsComplete}
      />
    )
  }

  return null
}
