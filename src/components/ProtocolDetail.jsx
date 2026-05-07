import '../styles/ProtocolDetail.css'

export default function ProtocolDetail({ protocol }) {
  return (
    <div className="protocol-detail">
      {/* Coach intro — sets the relationship for newly-assigned protocols */}
      {protocol.coach_intro && (
        <div className="detail-section coach-block">
          <p className="coach-intro">{protocol.coach_intro}</p>
        </div>
      )}

      {/* This week — the actual prescription, in Coach K's voice */}
      {protocol.this_week && (
        <div className="detail-section">
          <h5>This Week</h5>
          <p className="this-week-text">{protocol.this_week}</p>
        </div>
      )}

      {/* Coach story — Coach K's personal experience that humanizes the advice */}
      {protocol.coach_story && (
        <div className="detail-section coach-story-block" style={{ background: '#f8f7f3', borderLeft: '3px solid #0D9488', padding: '14px 16px', borderRadius: '6px', marginTop: '14px' }}>
          <h5 style={{ marginTop: 0 }}>From Coach K</h5>
          <p style={{ fontStyle: 'italic', whiteSpace: 'pre-line' }}>{protocol.coach_story}</p>
        </div>
      )}

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

      {/* Weekly Goals (legacy field, kept for older library entries) */}
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

      {/* What you'll notice — milestone preview keeps users motivated */}
      {protocol.what_youll_notice && (
        <div className="detail-section">
          <h5>What You'll Notice</h5>
          <p>{protocol.what_youll_notice}</p>
        </div>
      )}

      {/* Things to Avoid */}
      {protocol.avoid && (
        <div className="detail-section">
          <h5>Things to Avoid</h5>
          <p className="avoid-note">
            ⚠️ {protocol.avoid}
          </p>
        </div>
      )}

      {/* Red Flags — when to involve a doctor (separate from generic disclaimer) */}
      {protocol.red_flags && (
        <div className="detail-notes" style={{ borderLeft: '3px solid #c62828', paddingLeft: '12px', marginTop: '12px', background: '#fff5f5', padding: '12px 16px', borderRadius: '4px' }}>
          <h5 style={{ marginTop: 0, color: '#c62828' }}>Talk to a doctor if…</h5>
          <p className="note-text" style={{ margin: 0 }}>{protocol.red_flags}</p>
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
      {(protocol.review_days || protocol.review_period) && (
        <div className="detail-notes">
          <p className="note-text">
            💡 <strong>Timeline:</strong> Review your progress every {protocol.review_days || protocol.review_period} days. Small changes compound over time — consistency matters more than perfection.
          </p>
        </div>
      )}

      {/* Legacy escalation field — kept for older library entries that use it */}
      {protocol.escalation && !protocol.red_flags && (
        <div className="detail-notes" style={{ borderLeft: '3px solid #c62828', paddingLeft: '12px', marginTop: '12px' }}>
          <p className="note-text">
            ⚕️ <strong>Important:</strong> {protocol.escalation}
          </p>
        </div>
      )}
    </div>
  )
}
