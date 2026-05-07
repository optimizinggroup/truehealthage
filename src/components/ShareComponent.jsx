import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import '../styles/ShareComponent.css'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export default function ShareComponent({ trueHealthAge, grade, resultId }) {
  const [shared, setShared] = useState({})

  const shareUrl = `${window.location.origin}?result=${resultId}`
  const shareText = `My True Health Age is ${trueHealthAge} with a grade of ${grade}! I'm taking the True Health Age quiz. What's yours?`

  const handleShare = async (platform) => {
    try {
      // Log share event via Supabase JS client (uses session JWT for RLS)
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('share_events').insert({
        user_id: user?.id || null,
        result_id: resultId,
        platform,
        true_health_age: trueHealthAge,
        grade,
      })
      if (error) console.warn('share_event log failed:', error)

      setShared({ ...shared, [platform]: true })

      // Open share dialog
      switch (platform) {
        case 'twitter':
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
            '_blank'
          )
          break
        case 'facebook':
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
            '_blank'
          )
          break
        case 'linkedin':
          window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
            '_blank'
          )
          break
        case 'whatsapp':
          window.open(
            `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`,
            '_blank'
          )
          break
        case 'copy':
          navigator.clipboard.writeText(shareText + '\n' + shareUrl)
          alert('Link copied to clipboard!')
          break
      }
    } catch (error) {
      console.error('Error logging share:', error)
    }
  }

  return (
    <div className="share-component">
      <h3>Help a Friend Discover Their True Health Age</h3>
      <p>Pass it on. The more people who know where their health actually stands, the more lives we improve together.</p>

      <div className="share-buttons">
        <button
          className={`share-btn twitter ${shared.twitter ? 'shared' : ''}`}
          onClick={() => handleShare('twitter')}
        >
          <span className="share-icon" aria-hidden="true">𝕏</span>
          <span className="share-label">Twitter / X</span>
        </button>
        <button
          className={`share-btn facebook ${shared.facebook ? 'shared' : ''}`}
          onClick={() => handleShare('facebook')}
        >
          <span className="share-icon facebook-icon" aria-hidden="true">f</span>
          <span className="share-label">Facebook</span>
        </button>
        <button
          className={`share-btn linkedin ${shared.linkedin ? 'shared' : ''}`}
          onClick={() => handleShare('linkedin')}
        >
          <span className="share-icon linkedin-icon" aria-hidden="true">in</span>
          <span className="share-label">LinkedIn</span>
        </button>
        <button
          className={`share-btn whatsapp ${shared.whatsapp ? 'shared' : ''}`}
          onClick={() => handleShare('whatsapp')}
        >
          <span className="share-icon" aria-hidden="true">💬</span>
          <span className="share-label">WhatsApp</span>
        </button>
        <button
          className={`share-btn copy ${shared.copy ? 'shared' : ''}`}
          onClick={() => handleShare('copy')}
        >
          <span className="share-icon" aria-hidden="true">🔗</span>
          <span className="share-label">Copy Link</span>
        </button>
      </div>
    </div>
  )
}
