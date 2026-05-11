import { useState, useEffect } from 'react'
import { getAddOnsForCategory, ADDON_DISCLAIMER } from '../utils/optionalAddOns'
import '../styles/OptionalAddOns.css'

/**
 * OptionalAddOns — educational supplement + therapy layer for the active protocol.
 *
 * Per the May 2026 developer handoff (UPDATE-PROTOCOLS FROM OPEN AI):
 *   - Always opt-in. Default = lifestyle only.
 *   - Show food-first content before supplements; supplements before therapies.
 *   - Every entry needs a safety note. Peptides are educational-reference-only.
 *   - The user must acknowledge the disclaimer once per category before the
 *     content opens (stored in localStorage).
 */
export default function OptionalAddOns({ categoryId }) {
  const data = getAddOnsForCategory(categoryId)
  const ackKey = `tha_addons_ack_${categoryId}`
  const [open, setOpen] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)

  useEffect(() => {
    try {
      setAcknowledged(localStorage.getItem(ackKey) === '1')
    } catch (_) {
      // private-mode/disabled storage — fall back to ephemeral acknowledgement
    }
  }, [ackKey])

  if (!data) return null

  const handleAcknowledge = () => {
    setAcknowledged(true)
    try { localStorage.setItem(ackKey, '1') } catch (_) { /* ignore */ }
  }

  return (
    <div className="addons-block">
      <button
        type="button"
        className="addons-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="addons-title">
          Optional supplements & therapies <em>· educational only</em>
        </span>
        <span className="addons-chev">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="addons-body">
          {!acknowledged ? (
            <div className="addons-gate">
              <h4>Before we open this section</h4>
              <p>{ADDON_DISCLAIMER}</p>
              <p className="addons-coach">{data.coach_intro}</p>
              <button
                type="button"
                className="addons-ack-btn"
                onClick={handleAcknowledge}
              >
                I understand — show educational options
              </button>
            </div>
          ) : (
            <>
              <p className="addons-coach">{data.coach_intro}</p>

              {data.food_first?.length > 0 && (
                <section className="addons-section">
                  <h4>1 · Food first <span className="tier-label tier-1">Foundational</span></h4>
                  <ul>
                    {data.food_first.map((item, idx) => (
                      <li key={idx}>
                        <strong>{item.name}.</strong> {item.action}
                        {item.note && <span className="addons-note"> {item.note}</span>}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {data.supplements?.length > 0 && (
                <section className="addons-section">
                  <h4>2 · Supplements to discuss with your clinician <span className="tier-label tier-2">Optional</span></h4>
                  <ul>
                    {data.supplements.map((item, idx) => (
                      <li key={idx}>
                        <strong>{item.name}</strong>
                        {item.tier && <span className="addons-tier"> · {item.tier}</span>}
                        <div>{item.action}</div>
                        <div className="addons-safety">⚠ {item.safety_note}</div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {data.therapies?.length > 0 && (
                <section className="addons-section">
                  <h4>3 · Therapies & devices to consider <span className="tier-label tier-3">Discuss with clinician</span></h4>
                  <ul>
                    {data.therapies.map((item, idx) => (
                      <li key={idx}>
                        <strong>{item.name}</strong>
                        {item.tier && <span className="addons-tier"> · {item.tier}</span>}
                        <div>{item.action}</div>
                        <div className="addons-safety">⚠ {item.safety_note}</div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {data.peptide_note && (
                <section className="addons-section peptide-section">
                  <h4>Peptides — medical only</h4>
                  <p>{data.peptide_note}</p>
                </section>
              )}

              {data.red_flags && (
                <section className="addons-section red-flag-section">
                  <h4>When to skip this and get medical care</h4>
                  <p>{data.red_flags}</p>
                </section>
              )}

              <p className="addons-footer-disclaimer">{ADDON_DISCLAIMER}</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}
