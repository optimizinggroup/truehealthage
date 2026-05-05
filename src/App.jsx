import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Phase1Quiz from './components/Phase1Quiz'
import Phase2Selection from './components/Phase2Selection'
import ResultsPage from './components/ResultsPage'
import EmailCapture from './components/EmailCapture'
import LoginComponent from './components/LoginComponent'
import ForgotPasswordComponent from './components/ForgotPasswordComponent'
import ResetPasswordComponent from './components/ResetPasswordComponent'
import './App.css'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function App() {
  const [currentPhase, setCurrentPhase] = useState('landing') // landing | login | forgot_password | reset_password | phase1 | phase1_results | phase2_gateway | phase2 | email_capture | results
  const [userEmail, setUserEmail] = useState(null)
  const [userId, setUserId] = useState(null)
  const [phase1Results, setPhase1Results] = useState(null)
  const [phase2Results, setPhase2Results] = useState(null)
  const [resultId, setResultId] = useState(null)
  const [selectedAreas, setSelectedAreas] = useState([])
  const [loading, setLoading] = useState(false)

  // Check for reset password token or existing session on mount
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        // Check if user has a valid session (from password reset link or existing login)
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          // Check if this is a recovery session (password reset)
          const hash = window.location.hash
          if (hash.includes('type=recovery')) {
            setCurrentPhase('reset_password')
          } else {
            // Valid session from existing login
            setUserEmail(session.user.email)
            setUserId(session.user.id)
            // TODO: Load user's previous results
            setCurrentPhase('landing')
          }
        } else {
          // No session, show landing screen
          setCurrentPhase('landing')
        }
      } catch (err) {
        console.error('Error checking auth state:', err)
        setCurrentPhase('landing')
      }
      setLoading(false)
    }

    checkAuthState()
  }, [])

  const handlePhase1Complete = (results, resultId) => {
    setPhase1Results(results)
    setResultId(resultId)
    // Go directly to email capture - email required to see results
    setCurrentPhase('email_capture')
  }

  const handleEmailCapture = async (email) => {
    setUserEmail(email)
    // After email, show Phase 1 results
    setCurrentPhase('phase1_results')
  }

  const handlePhase1ResultsComplete = () => {
    setCurrentPhase('phase2_gateway')
  }

  const handlePhase2GatewayComplete = (selectedAreas) => {
    setSelectedAreas(selectedAreas)
    if (selectedAreas.length > 0) {
      setCurrentPhase('phase2')
    } else {
      setCurrentPhase('results')
    }
  }

  const handlePhase2Complete = (results) => {
    setPhase2Results(results)
    setCurrentPhase('results')
  }

  const handleRetakeQuiz = () => {
    setPhase1Results(null)
    setPhase2Results(null)
    setResultId(null)
    setSelectedAreas([])
    setCurrentPhase('phase1')
  }

  const handleLoginSuccess = (email, userId) => {
    setUserEmail(email)
    setUserId(userId)
    // TODO: Fetch previous results from database
    // For now, redirect to new quiz
    setCurrentPhase('phase1')
  }

  const handleLogout = () => {
    setUserEmail(null)
    setUserId(null)
    setPhase1Results(null)
    setPhase2Results(null)
    setResultId(null)
    setSelectedAreas([])
    setCurrentPhase('landing')
  }

  const handleResetPasswordSuccess = () => {
    setCurrentPhase('landing')
  }

  if (loading) {
    return (
      <div className="app-container loading">
        <div className="spinner"></div>
        <p>Loading True Health Age...</p>
      </div>
    )
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>True Health Age</h1>
        {userEmail && (
          <div className="user-info">
            <span className="user-email">{userEmail}</span>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
          </div>
        )}
      </header>

      <main className="app-main">
        {currentPhase === 'landing' && (
          <div className="landing-screen">
            <div className="landing-card">
              <h2>Discover Your True Health Age</h2>
              <p>Take a personalized assessment to understand your biological age and get actionable health insights.</p>
              <div className="button-group">
                <button
                  className="primary-btn"
                  onClick={() => setCurrentPhase('phase1')}
                >
                  Start New Assessment
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => setCurrentPhase('login')}
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>
        )}

        {currentPhase === 'login' && (
          <LoginComponent
            onLoginSuccess={handleLoginSuccess}
            onForgotPassword={() => setCurrentPhase('forgot_password')}
            onSignUp={() => setCurrentPhase('landing')}
          />
        )}

        {currentPhase === 'forgot_password' && (
          <ForgotPasswordComponent
            onBackToLogin={() => setCurrentPhase('login')}
          />
        )}

        {currentPhase === 'reset_password' && (
          <ResetPasswordComponent
            onResetSuccess={handleResetPasswordSuccess}
          />
        )}

        {currentPhase === 'phase1' && (
          <Phase1Quiz
            onComplete={handlePhase1Complete}
          />
        )}

        {currentPhase === 'email_capture' && phase1Results && (
          <EmailCapture
            phase1Results={phase1Results}
            phase2Results={phase2Results}
            onComplete={handleEmailCapture}
          />
        )}

        {currentPhase === 'phase1_results' && phase1Results && userEmail && (
          <ResultsPage
            phase1Results={phase1Results}
            resultId={resultId}
            userEmail={userEmail}
            showPhase2Option={true}
            onPhase2Selection={handlePhase1ResultsComplete}
            onSkipPhase2={() => setCurrentPhase('results')}
            onLogout={handleLogout}
          />
        )}

        {currentPhase === 'phase2_gateway' && phase1Results && (
          <Phase2Selection
            phase1Results={phase1Results}
            resultId={resultId}
            showGateway={true}
            onComplete={handlePhase2GatewayComplete}
          />
        )}

        {currentPhase === 'phase2' && phase1Results && (
          <Phase2Selection
            phase1Results={phase1Results}
            resultId={resultId}
            selectedAreas={selectedAreas}
            showGateway={false}
            onComplete={handlePhase2Complete}
          />
        )}

        {currentPhase === 'results' && phase1Results && userEmail && (
          <ResultsPage
            phase1Results={phase1Results}
            phase2Results={phase2Results}
            resultId={resultId}
            userEmail={userEmail}
            showPhase2Option={false}
            onRetakeQuiz={handleRetakeQuiz}
            onLogout={handleLogout}
          />
        )}
      </main>
    </div>
  )
}
