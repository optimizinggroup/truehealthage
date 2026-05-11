import { getAddOnsForCategory, ADDON_DISCLAIMER } from '../utils/optionalAddOns'
import '../styles/OptionalAddOns.css'

/**
 * OptionalAddOns — educational supplement + therapy layer for the active protocol.
 *
 * Per Keith's May 2026 feedback: don't hide this behind a click-to-reveal.
 * Users were missing the content entirely. Show it directly with a clear
 * disclaimer banner up top — same legal protection, much better discoverability.
 *
 * Tiered display: Food-first → Supplements → Therapies/devices.
 * Every entry carries its own safety note. Peptides are educational-only.
 */
export default function OptionalAddOns({ categoryId }) {
  const data = getAddOnsForCategory(categoryId)
  if (!data) return null

  return (
    <div className="addons-block">
      <div className="addons-banner">
        <span className="addons-banner-tag">Educational only</span>
        <span className="addons-banner-text">{ADDON_DISCLAIMER}</span>
      </div>

      <div className="addons-body">
        <h3 className="addons-h">Optional supplements & therapies</h3>
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
      </div>
    </div>
  )
}
