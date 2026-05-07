import { useState } from 'react'
import '../styles/ProtocolDetail.css'

export default function ProtocolDetail({ protocol }) {
  const [showMore, setShowMore] = useState(false)

  // Has any supplementary content worth a "Show more" toggle?
  const hasMore = !!(
    protocol.coach_story ||
    protocol.what_youll_notice ||
    protocol.avoid ||
    protocol.red_flags ||
    protocol.escalation ||
    protocol.tracking_metric ||
    protocol.review_days ||
    protocol.review_period
  )

  return (
    <div className="protocol-detail">
      {/* Always visible: this is what the user does this week. */}

      {protocol.coach_intro && (
        <div className="detail-section coach-block">
          <p className="coach-intro">{protocol.coach_intro}</p>
        </div>
      )}

      {protocol.this_week && (
        <div className="detail-section">
          <h5>This Week</h5>
          <p className="this-week-text">{protocol.this_week}</p>
        </div>
      )}

      {protocol.daily_micro_wins && protocol.daily_micro_wins.length > 0 && (
        <div className="detail-section">
          <h5>Daily Actions</h5>
          <ul className="actions-list">
            {protocol.daily_micro_wins.map((action, idx) => (
              <li key={idx}>{action}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Toggle for the longer / supplementary content */}
      {hasMore && !showMore && (
        <button
          type="button"
          className="show-more-btn"
          onClick={(e) => { e.stopPropagation(); setShowMore(true) }}
        >
          Show more from Coach K →
        </button>
      )}

      {hasMore && showMore && (
        <>
          {protocol.coach_story && (
            <div className="detail-section coach-story-block">
              <h5>From Coach K</h5>
              <p className="coach-story-text">{protocol.coach_story}</p>
            </div>
          )}

          {protocol.what_youll_notice && (
            <div className="detail-section">
              <h5>What You'll Notice</h5>
              <p>{protocol.what_youll_notice}</p>
            </div>
          )}

          {/* Legacy weekly_micro_wins — only kept for older library entries */}
          {protocol.weekly_micro_wins && protocol.weekly_micro_wins.length > 0 && (
            <div className="detail-section">
              <h5>Weekly Goals</h5>
              <ul className="actions-list">
                {protocol.weekly_micro_wins.map((action, idx) => (
                  <li key={idx}>{action}</li>
                ))}
              </ul>
            </div>
          )}

          {protocol.avoid && (
            <div className="detail-section">
              <h5>Things to Avoid</h5>
              <p className="avoid-note">⚠️ {protocol.avoid}</p>
            </div>
          )}

          {protocol.red_flags && (
            <div className="detail-notes red-flags-block">
              <h5>Talk to a doctor if…</h5>
              <p className="note-text">{protocol.red_flags}</p>
            </div>
          )}

          {protocol.tracking_metric && (
            <div className="detail-section">
              <h5>How to Track Progress</h5>
              <p className="tracking-text">📊 {protocol.tracking_metric}</p>
            </div>
          )}

          {(protocol.review_days || protocol.review_period) && (
            <div className="detail-notes">
              <p className="note-text">
                💡 <strong>Timeline:</strong> Review your progress every {protocol.review_days || protocol.review_period} days. Small changes compound — consistency matters more than perfection.
              </p>
            </div>
          )}

          {protocol.escalation && !protocol.red_flags && (
            <div className="detail-notes red-flags-block">
              <p className="note-text">⚕️ <strong>Important:</strong> {protocol.escalation}</p>
            </div>
          )}

          <button
            type="button"
            className="show-less-btn"
            onClick={() => setShowMore(false)}
          >
            Show less ↑
          </button>
        </>
      )}
    </div>
  )
}
