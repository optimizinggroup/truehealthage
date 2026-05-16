import { useState } from 'react'

/**
 * ScoreCitations — collapsible "The Science Behind Your Health Age" section.
 *
 * Shown at the bottom of the results page so users (and reviewers) can
 * validate that the categories are evidence-based. We intentionally do NOT
 * expose:
 *   - year-impact values per answer
 *   - the additive formula
 *   - confidence tiers
 *
 * We only show what the research validates: each category is backed by a
 * named, real peer-reviewed study. Reviewers can look those studies up
 * themselves. The exact "ingredient list" of how we combine answers stays
 * proprietary.
 */
const CITATION_GROUPS = [
  {
    category: 'Smoking',
    studies: [
      "Doll et al., BMJ 2004 — 50-year British Doctors Study, the foundational evidence that smoking shortens life expectancy ~10 years.",
      "Jha et al., NEJM 2013 — 216,000-person US cohort confirming smokers lose ~10 years of life expectancy, and quitting before 40 recovers ~90% of that loss.",
    ],
  },
  {
    category: 'Alcohol',
    studies: [
      "Wood et al., Lancet 2018 — 599,912-participant pooled analysis showing alcohol's dose-response relationship with mortality.",
      "GBD Alcohol Collaborators, Lancet 2018 — Global Burden of Disease analysis concluding no safe alcohol threshold for total health (debunking the J-curve).",
    ],
  },
  {
    category: 'Diabetes',
    studies: [
      "Emerging Risk Factors Collaboration, NEJM 2011 — diabetes reduces life expectancy ~6 years at age 50.",
      "Rawshani et al., NEJM 2018 — well-controlled Type 2 diabetes brings life expectancy close to the general population when key risk factors are managed.",
      "Livingstone et al., JAMA 2015 — Scotland Type 1 cohort showing life expectancy gap (improving with modern care).",
    ],
  },
  {
    category: 'Cardiovascular',
    studies: [
      "Lewington et al., Lancet 2002 — ~1 million adults; every 20/10 mmHg blood pressure increase doubles cardiovascular mortality.",
      "SPRINT Trial, NEJM 2015 — intensive blood pressure control reduces cardiovascular events ~25%.",
      "Benjamin et al., Circulation 2019 — AHA Statistics Update (AFib, heart failure mortality).",
      "Bansilal et al., AHJ 2014 — secondary prevention life-expectancy gap post-heart-attack.",
      "Framingham Heart Study — foundational longitudinal cardiovascular research.",
    ],
  },
  {
    category: 'Cancer',
    studies: [
      "SEER Cancer Statistics Review (NCI) — population-level cancer survival and stage-stratified outcomes.",
      "Rogers et al., JAMA Dermatol 2015 — non-melanoma skin cancer life-expectancy data.",
    ],
  },
  {
    category: 'Body Composition (BMI + Body Shape)',
    studies: [
      "Prospective Studies Collaboration, Lancet 2009 — 894,576 adults; J-curve of BMI vs mortality.",
      "Berrington de Gonzalez et al., NEJM 2010 — 1.46 million participants on BMI and mortality.",
      "Thomas et al., Obesity 2013 — original Body Roundness Index (BRI) development.",
      "Frontiers in Public Health 2025 — BRI and biological-age acceleration research.",
      "Srikanthan & Karlamangla, Am J Med 2014 — NHANES; muscle mass and all-cause mortality.",
      "Atkins et al., J Am Geriatr Soc 2014 — sarcopenic obesity and mortality (the \"skinny fat\" finding).",
      "Snijder et al., Diabetes Care 2003 — lower-body fat as metabolically protective.",
    ],
  },
  {
    category: 'Blood Pressure & Resting Heart Rate',
    studies: [
      "Jouven et al., NEJM 2005 — elevated resting heart rate (>75 bpm) and sudden cardiac death.",
      "Copenhagen City Heart Study — resting heart rate and longevity.",
      "JNC 8 / 2017 AHA blood pressure guidelines.",
    ],
  },
  {
    category: 'Self-Rated Health',
    studies: [
      "Idler & Benyamini, J Health Soc Behav 1997 — self-rated health as one of the strongest mortality predictors.",
      "DeSalvo et al., JGIM 2006 — meta-analysis of 22 studies confirming the self-rated health → mortality link.",
    ],
  },
  {
    category: 'Movement & Exercise',
    studies: [
      "Lear et al., Lancet 2017 — PURE study, 130,000 participants on physical activity and mortality.",
      "Wen et al., Lancet 2011 — Taiwan cohort (n=416,000); 15 min/day exercise adds ~3 years of life expectancy.",
      "Arem et al., JAMA Intern Med 2015 — exercise dose-response; 3-5x guidelines = maximum benefit.",
      "Ekelund et al., Lancet 2016 — sitting-time meta-analysis (>1 million participants).",
      "Patel et al., Am J Epidemiol 2010 — independent mortality risk of prolonged sitting.",
      "Mandsager et al., JAMA Netw Open 2018 — 122,007 patients; cardiorespiratory fitness is the strongest single mortality predictor.",
      "WHO Physical Activity Guidelines 2020.",
    ],
  },
  {
    category: 'Sleep',
    studies: [
      "Cappuccio et al., Sleep 2010 — meta-analysis showing the U-shaped curve of sleep duration and mortality.",
      "Punjabi et al., PLoS Med 2009 — untreated severe obstructive sleep apnea triples all-cause mortality.",
      "Marin et al., Lancet 2005 — CPAP treatment largely normalizes sleep-apnea mortality.",
      "Hublin et al., Sleep 2011 — sleep quality (PSQI) and mortality.",
    ],
  },
  {
    category: 'Nutrition',
    studies: [
      "Estruch et al., NEJM 2013 (PREDIMED) — Mediterranean diet reduces cardiovascular events ~30%.",
      "Crous-Bou et al., BMJ 2014 — Nurses' Health Study; Mediterranean diet and longer telomeres.",
      "Alonso-Pedrero et al., AJCN 2020 — ultra-processed food intake and shorter telomeres.",
      "Schnabel et al., JAMA Intern Med 2019 — 44,551 adults; 10% UPF increase = 14% mortality increase.",
      "Leung et al., AJPH 2014 — sugar-sweetened beverages and biological-age acceleration.",
      "Malik et al., Circulation 2019 — sugary drinks and cardiovascular/all-cause mortality.",
    ],
  },
  {
    category: 'Stress & Mental Health',
    studies: [
      "Rosengren et al., Lancet 2004 (INTERHEART) — psychosocial stress and heart attack risk across 52 countries.",
      "Epel et al., PNAS 2004 — chronic psychological stress and telomere shortening.",
      "Cuijpers et al., Br J Psychiatry 2014 — depression and all-cause mortality meta-analysis.",
      "Penninx et al., JAMA 2001 — depression's independent mortality risk.",
    ],
  },
  {
    category: 'Social Connection & Purpose',
    studies: [
      "Holt-Lunstad et al., PLoS Med 2010 — landmark meta-analysis: social isolation has mortality risk comparable to smoking 15 cigarettes/day.",
      "Holt-Lunstad et al., Perspect Psychol Sci 2015 — loneliness/isolation and mortality (HR 1.26-1.32).",
      "Boyle et al., Arch Gen Psychiatry 2010 — sense of purpose predicts reduced mortality and slower cognitive decline.",
      "Cohen et al., Psychosom Med 2016 — purpose meta-analysis; higher purpose = lower all-cause mortality.",
      "Blue Zones research (Buettner) — cross-population longevity findings on purpose (\"ikigai\") as a universal factor.",
    ],
  },
]

export default function ScoreCitations() {
  const [open, setOpen] = useState(false)

  return (
    <section
      style={{
        marginTop: '36px',
        padding: '20px 22px',
        background: '#f8fafc',
        borderRadius: '10px',
        border: '1px solid #e2e8f0',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '1.05rem',
          fontWeight: 700,
          color: '#1f2937',
        }}
      >
        <span>📚 The Science Behind Your Health Age</span>
        <span style={{ fontSize: '1.3rem', color: '#64748b' }}>{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div style={{ marginTop: '18px' }}>
          <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.55, marginBottom: '18px' }}>
            Every category in your assessment is grounded in published, peer-reviewed research. We don't share the exact formula behind the score itself, but you can verify the science by looking up any of the studies below.
          </p>

          {CITATION_GROUPS.map((group) => (
            <div key={group.category} style={{ marginBottom: '20px' }}>
              <h4 style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#0D9488',
                marginBottom: '8px',
                borderBottom: '1px solid #cbd5e1',
                paddingBottom: '4px',
              }}>
                {group.category}
              </h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {group.studies.map((s, idx) => (
                  <li key={idx} style={{
                    fontSize: '0.85rem',
                    color: '#475569',
                    lineHeight: 1.55,
                    marginBottom: '6px',
                    paddingLeft: '14px',
                    position: 'relative',
                  }}>
                    <span style={{ position: 'absolute', left: 0, color: '#0D9488' }}>•</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <p style={{
            fontSize: '0.8rem',
            color: '#64748b',
            fontStyle: 'italic',
            marginTop: '20px',
            paddingTop: '14px',
            borderTop: '1px solid #cbd5e1',
            lineHeight: 1.5,
          }}>
            Your TrueHealth Age is an evidence-informed estimate of how your lifestyle and current health may be influencing your long-term health and rate of aging — it is not a substitute for medical biomarker testing (methylation clocks, GrimAge, PhenoAge, DunedinPACE) or a diagnosis. Talk with your clinician before making medical decisions.
          </p>
        </div>
      )}
    </section>
  )
}
