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
      headline: "Hi, I'm Coach K.",
      body: (
        <>
          <p>
            I built TrueHealthAge because I was tired of watching people get either generic wellness advice that didn't apply to them — or clinical jargon that made them feel like a problem to be solved.
          </p>
          <p>
            You deserve neither. You deserve a coach who understands where you are, knows the science, and gives you small things you can actually do.
          </p>
        </>
      ),
    },
    {
      headline: "A bit about my background.",
      body: (
        <>
          <p>
            I've been coaching high school wrestlers for over <strong>40 years</strong> — that's where I learned how behavior change really works. It's not motivation. It's small wins, repeated.
          </p>
          <p>
            On the medical side, I founded multiple companies that built FDA-cleared devices: balance and vestibular testing, autonomic nervous system testing (HRV), pain treatment, cognitive testing, hyperbaric chambers, supplement protocols. I've trained thousands of clinicians on how to use them.
          </p>
          <p>
            I'm not a doctor, and this app isn't medical advice. But what I've learned from 40 years on both sides of clinical practice and athletic coaching is what shapes every protocol you'll see here.
          </p>
        </>
      ),
    },
    {
      headline: "How this works.",
      body: (
        <>
          <p>
            <strong>First</strong> — you'll answer 20 questions. About 5 minutes. You'll get your True Health Age, plus the top factors aging you and protecting you.
          </p>
          <p>
            <strong>Then</strong> — you can pick the areas you want to work on, and I'll give you protocols. Not a list of tips. Real coaching: one small action this week, a check-in next week, and we adjust based on how it went.
          </p>
          <p>
            <strong>The whole thing only works if you're honest.</strong> No one sees your answers but you. Tell the truth — even the parts you'd rather not.
          </p>
        </>
      ),
    },
    {
      headline: "One promise.",
      body: (
        <>
          <p>
            I'll never shame you for missing a week. I'll never pile on more rules when one is already too many. I'll never sell you a supplement you don't need.
          </p>
          <p>
            What I will do: meet you where you are, give you the smallest next step, and stick with you week after week until things start to click.
          </p>
          <p style={{ marginTop: '24px', fontWeight: '600' }}>
            That's the work. Let's start.
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
