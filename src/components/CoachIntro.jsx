import { useState } from 'react'
import '../styles/CoachIntro.css'

/**
 * CoachIntro — first impression of Coach K.
 *
 * Shown once between the landing page and Phase 1 quiz. Sets the
 * coaching relationship, surfaces the medical-device + 40-year coaching
 * credibility (without padding), and frames the assessment as the
 * starting point of a real coaching program — not a one-time quiz.
 */
export default function CoachIntro({ onContinue, onBack }) {
  const [step, setStep] = useState(0)

  const slides = [
    {
      headline: (
        <>
          Living Longer Matters.<br />
          Living Healthier Matters More.
        </>
      ),
      body: (
        <>
          <p>
            Most people don't just want to live longer. What most people really want is to <strong>stay healthy longer</strong>.
          </p>
          <p>
            They want more energy, clarity, strength, and independence.
          </p>
          <p>
            TrueHealthAge helps you understand what may be accelerating your aging now — and what you can do to help you stay healthier longer.
          </p>
          <p>
            <strong>No fear. No judgment.</strong> Just practical insights and small steps that can improve your future health.
          </p>
        </>
      ),
    },
    {
      headline: 'Why I Built This',
      body: (
        <>
          <p>
            I've spent over <strong>40 years</strong> coaching behavior change — first as a high school wrestling coach, and later working with clinicians and health innovators developing FDA-cleared technologies.
          </p>
          <p>My work has included:</p>
          <ul className="coach-intro-list">
            <li>HRV &amp; autonomic nervous system testing</li>
            <li>Balance &amp; cognitive assessment</li>
            <li>Pain treatment &amp; recovery optimization</li>
            <li>Building supplement protocols based on health conditions</li>
            <li>Health programs focused on long-term resilience and performance</li>
          </ul>
          <p>What I learned is this:</p>
          <p>
            Most people already know they should eat better, exercise more, and reduce stress. But <em>information alone rarely creates lasting change</em>.
          </p>
          <p>
            Real progress comes from <strong>small wins that actually stick</strong>.
          </p>
          <p>
            TrueHealthAge combines AI, clinical science, and decades of coaching experience into practical guidance designed to help you improve your health one step at a time.
          </p>
        </>
      ),
    },
    {
      headline: 'How It Works',
      body: (
        <>
          <p>
            <strong>Answer 20 questions.</strong> It takes about 5 minutes.
          </p>
          <p>You'll discover:</p>
          <ul className="coach-intro-list">
            <li>Your True Health Age</li>
            <li>What may be aging you faster</li>
            <li>What's helping protect your health</li>
          </ul>
          <p>
            Then you'll get personalized guidance with simple, realistic actions you can actually follow.
          </p>
          <p>
            <strong>Be honest with your answers.</strong> The more accurate your input, the more valuable your results.
          </p>
        </>
      ),
    },
    {
      headline: 'One Promise',
      body: (
        <>
          <p>
            I'll never shame you for where you are.
          </p>
          <p>
            I'll help you focus on the next small step — not perfection.
          </p>
          <p>
            Because lasting health isn't built in one day. It's built through <strong>consistent choices over time</strong>.
          </p>
          <p style={{ marginTop: '24px', fontWeight: '600' }}>
            Let's start improving your future health — together.
          </p>
        </>
      ),
    },
  ]

  const isLast = step === slides.length - 1
  const slide = slides[step]

  const handleNext = () => {
    if (isLast) {
      onContinue()
    } else {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step === 0) {
      if (onBack) onBack()
    } else {
      setStep(step - 1)
    }
  }

  return (
    <div className="coach-intro">
      <div className="coach-intro-card">
        <div className="coach-intro-progress">
          {slides.map((_, idx) => (
            <span
              key={idx}
              className={`progress-dot ${idx === step ? 'active' : ''} ${idx < step ? 'completed' : ''}`}
            />
          ))}
        </div>

        <div className="coach-intro-content">
          <h1>{slide.headline}</h1>
          <div className="coach-intro-body">
            {slide.body}
          </div>
        </div>

        <div className="coach-intro-footer">
          <button
            type="button"
            className="back-btn"
            onClick={handleBack}
          >
            ← Back
          </button>
          <button
            type="button"
            className="continue-btn"
            onClick={handleNext}
          >
            {isLast ? "Let's start" : 'Continue →'}
          </button>
        </div>

        {!isLast && (
          <button
            type="button"
            className="skip-btn"
            onClick={onContinue}
          >
            Skip intro
          </button>
        )}
      </div>
    </div>
  )
}
