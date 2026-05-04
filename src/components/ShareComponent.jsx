import { useState } from 'react'
import axios from 'axios'
import '../styles/ShareComponent.css'

export default function ShareComponent({ trueHealthAge, grade, resultId }) {
  const [shared, setShared] = useState({})

  const shareUrl = `${window.location.origin}?result=${resultId}`
  const shareText = `My True Health Age is ${trueHealthAge} with a grade of ${grade}! I'm taking the True Health Age quiz. What's yours?`

  const handleShare = async (platform) => {
    try {
      // Log share event
      await axios.post(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/share_events`, {
        result_id: resultId,
        platform: platform,
        true_health_age: trueHealthAge,
        grade: grade,
      }, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        }
      })

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
      <h3>Share Your Results</h3>
      <p>Let others know about your True Health Age</p>

      <div className="share-buttons">
        <button
          className={`share-btn twitter ${shared.twitter ? 'shared' : ''}`}
          onClick={() => handleShare('twitter')}
        >
          𝕏 Twitter
        </button>
        <button
          className={`share-btn facebook ${shared.facebook ? 'shared' : ''}`}
          onClick={() => handleShare('facebook')}
        >
          f Facebook
        </button>
        <button
          className={`share-btn linkedin ${shared.linkedin ? 'shared' : ''}`}
          onClick={() => handleShare('linkedin')}
        >
          in LinkedIn
        </button>
        <button
          className={`share-btn whatsapp ${shared.whatsapp ? 'shared' : ''}`}
          onClick={() => handleShare('whatsapp')}
        >
          💬 WhatsApp
        </button>
        <button
          className={`share-btn copy ${shared.copy ? 'shared' : ''}`}
          onClick={() => handleShare('copy')}
        >
          📋 Copy Link
        </button>
      </div>
    </div>
  )
}
