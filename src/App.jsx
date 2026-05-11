import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import Phase1Quiz from './components/Phase1Quiz'
import Phase2Selection from './components/Phase2Selection'
import ResultsPage from './components/ResultsPage'
import EmailCapture from './components/EmailCapture'
import LoginComponent from './components/LoginComponent'
import ForgotPasswordComponent from './components/ForgotPasswordComponent'
import ResetPasswordComponent from './components/ResetPasswordComponent'
import AppHeader from './components/AppHeader'
import CoachIntro from './components/CoachIntro'
import CoachDashboard from './components/CoachDashboard'
import PrioritySelection from './components/PrioritySelection'
import { normalizeSex } from './utils/optionalAddOns'
import './App.css'

const COACH_INTRO_SEEN_KEY = 'tha_coach_intro_seen_v1'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function App() {
  const [currentPhase, setCurrentPhase] = useState('landing') // landing | coach_intro | login | forgot_password | reset_password | phase1 | phase1_results | phase2 | email_capture | results | priority_selection | coach_dashboard

  // Always scroll to top when the user moves between phases. Without this,
  // they land on the next screen at the previous scroll position — which
  // makes it look like the page is broken or jumping to the wrong section.
  const [userEmail, setUserEmail] = useState(null)
  const [userId, setUserId] = useState(null)
  const [phase1Results, setPhase1Results] = useState(null)
  const [phase2Results, setPhase2Results] = useState(null)
  const [resultId, setResultId] = useState(null)
  const [selectedAreas, setSelectedAreas] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [currentPhase])

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

  const handlePhase1Complete = async (results, resultId) => {
    setPhase1Results(results)

    // Retake path: a logged-in user (userId set) must skip email_capture.
    // That screen calls supabase.auth.signUp(), which fails with
    // "user already registered" for their existing email — leaving them
    // stuck on a sign-up form. Instead, write the new quiz_results row
    // directly and route straight to the results screen.
    if (userId) {
      try {
        const { data: quizRow, error: quizError } = await supabase
          .from('quiz_results')
          .insert({
            user_id: userId,
            chrono_age: results.chronoAge,
            true_health_age: results.trueHealthAge,
            age_diff: results.ageDiff,
            grade: results.grade,
            result_label: results.label,
            answers: results.answers || {},
            top_3_aging: results.top3Aging || null,
            top_3_protecting: results.top3Protecting || null,
            device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            user_agent: navigator.userAgent,
          })
          .select()
          .single()
        if (quizError) console.warn('Retake quiz_results insert failed:', quizError)
        setResultId(quizRow?.id || null)
      } catch (err) {
        console.warn('Retake quiz_results insert threw:', err)
        setResultId(null)
      }
      setCurrentPhase('phase1_results')
      return
    }

    setResultId(resultId)
    setCurrentPhase('email_capture')
  }

  const handleEmailCapture = async (email) => {
    setUserEmail(email)
    // After email, show Phase 1 results
    setCurrentPhase('phase1_results')
  }

  const handlePhase1ResultsComplete = () => {
    setCurrentPhase('phase2')
  }

  // Phase2Selection self-orchestrates Gateway → Quiz → Results.
  // It fires onComplete once at the very end with the full bundle.
  // (User can also bail at the gateway with phase2Results=null.)
  const handlePhase2Complete = (data) => {
    setPhase2Results(data.phase2Results || null)
    setSelectedAreas(data.selectedAreas || [])
    // Skip the legacy ResultsPage entirely after Phase 2 — it duplicated the
    // category scores and showed a broken 0-450/100 "deep dive" calculation.
    // The Phase2Results page already showed the user their scores cleanly;
    // they go straight to picking what to work on first.
    setCurrentPhase(data.phase2Results ? 'priority_selection' : 'coach_dashboard')
  }

  const handleRetakeQuiz = () => {
    setPhase1Results(null)
    setPhase2Results(null)
    setResultId(null)
    setSelectedAreas([])
    setCurrentPhase('phase1')
  }

  // "Add another area" flow — read the user's last cached Phase 2 results
  // from localStorage and route to PrioritySelection so they can pick a
  // second priority without retaking the entire assessment. If no cache
  // is found (cleared storage, different device), we fall back to the
  // full retake path.
  const handleAddAnotherArea = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(`tha_last_phase2_results_${user.id}`)
        if (raw) {
          const cached = JSON.parse(raw)
          setPhase2Results(cached)
          setCurrentPhase('priority_selection')
          return
        }
      }
    } catch (_) { /* fall through to retake */ }
    handleRetakeQuiz()
  }

  const handleLoginSuccess = (email, userId) => {
    setUserEmail(email)
    setUserId(userId)
    // Returning user goes to their coaching dashboard, not back to a new quiz
    setCurrentPhase('coach_dashboard')
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
      <AppHeader currentPhase={currentPhase} userEmail={userEmail} onLogout={handleLogout} />

      <main className="app-main">
        {currentPhase === 'landing' && (
          <div className="landing-screen">
            <div className="landing-card">
              <h2>Discover Your True Health Age</h2>
              <p>Take a personalized assessment to understand your biological age and get actionable health insights.</p>
              <div className="button-group">
                {userEmail ? (
                  <button
                    className="primary-btn"
                    onClick={() => setCurrentPhase('coach_dashboard')}
                  >
                    Continue Coaching →
                  </button>
                ) : (
                  <button
                    className="primary-btn"
                    onClick={() => {
                      const seen = typeof localStorage !== 'undefined' && localStorage.getItem(COACH_INTRO_SEEN_KEY)
                      setCurrentPhase(seen ? 'phase1' : 'coach_intro')
                    }}
                  >
                    Start New Assessment
                  </button>
                )}
                {!userEmail && (
                  <button
                    className="secondary-btn"
                    onClick={() => setCurrentPhase('login')}
                  >
                    Sign In
                  </button>
                )}
                {userEmail && (
                  <button
                    className="secondary-btn"
                    onClick={() => {
                      const seen = typeof localStorage !== 'undefined' && localStorage.getItem(COACH_INTRO_SEEN_KEY)
                      setCurrentPhase(seen ? 'phase1' : 'coach_intro')
                    }}
                  >
                    Retake Assessment
                  </button>
                )}
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

        {currentPhase === 'coach_intro' && (
          <CoachIntro
            onContinue={() => {
              try { localStorage.setItem(COACH_INTRO_SEEN_KEY, '1') } catch (e) { /* private mode */ }
              setCurrentPhase('phase1')
            }}
            onBack={() => setCurrentPhase('landing')}
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

        {currentPhase === 'phase2' && phase1Results && (
          <Phase2Selection
            phase1Results={phase1Results}
            resultId={resultId}
            userSex={normalizeSex(phase1Results?.answers?.[2]?.text)}
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
            // Route to PrioritySelection if they did Phase 2 (so they pick what
            // to work on first); otherwise straight to the dashboard.
            onContinueCoaching={() =>
              setCurrentPhase(phase2Results ? 'priority_selection' : 'coach_dashboard')
            }
          />
        )}

        {currentPhase === 'priority_selection' && phase2Results && (
          <PrioritySelection
            phase2Results={phase2Results}
            onActivated={(_protocolKey, _when) => setCurrentPhase('coach_dashboard')}
            onSkip={() => setCurrentPhase('coach_dashboard')}
          />
        )}

        {currentPhase === 'coach_dashboard' && (
          <CoachDashboard
            userEmail={userEmail}
            userName={userEmail}
            onRetakeQuiz={handleRetakeQuiz}
            onAddAnotherArea={handleAddAnotherArea}
            onLogout={handleLogout}
          />
        )}
      </main>
    </div>
  )
}
