import '../styles/ProtocolDetail.css'

export default function ProtocolDetail({ protocol }) {
  return (
    <div className="protocol-detail">
      {/* Daily Micro-Wins */}
      {protocol.daily_micro_wins && protocol.daily_micro_wins.length > 0 && (
        <div className="detail-section">
          <h5>Daily Actions</h5>
          <p className="section-intro">Start with these small, daily changes:</p>
          <ul className="actions-list">
            {protocol.daily_micro_wins.map((action, idx) => (
              <li key={idx}>{action}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Weekly Micro-Wins */}
      {protocol.weekly_micro_wins && protocol.weekly_micro_wins.length > 0 && (
        <div className="detail-section">
          <h5>Weekly Goals</h5>
          <p className="section-intro">Aim for these each week:</p>
          <ul className="actions-list">
            {protocol.weekly_micro_wins.map((action, idx) => (
              <li key={idx}>{action}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions to Avoid */}
      {protocol.avoid && (
        <div className="detail-section">
          <h5>Things to Avoid</h5>
          <p className="avoid-note">
            ⚠️ {protocol.avoid}
          </p>
        </div>
      )}

      {/* Tracking */}
      {protocol.tracking_metric && (
        <div className="detail-section">
          <h5>How to Track Progress</h5>
          <p className="tracking-text">
            📊 {protocol.tracking_metric}
          </p>
        </div>
      )}

      {/* Review Period */}
      {protocol.review_period && (
        <div className="detail-notes">
          <p className="note-text">
            💡 <strong>Timeline:</strong> Review your progress every {protocol.review_period} days. Small changes compound over time—consistency matters more than perfection.
          </p>
        </div>
      )}
    </div>
  )
}
