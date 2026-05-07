/**
 * PHASE 2 - Personalized Behavior-Change Protocol Engine
 *
 * Philosophy:
 * - Phase 1 = Awareness (What's your health age?)
 * - Phase 2 = Behavior Change (What micro-wins can you start TODAY?)
 * - Phase 3 = Clinical precision (Biomarkers, blood tests, wearables)
 *
 * Output: Simple, actionable daily/weekly micro-wins, NOT clinical diagnosis
 */

export const PHASE2_CATEGORIES = [
  {
    id: 'energy_fatigue',
    name: 'Energy & Fatigue',
    description: 'How you feel throughout the day',
    icon: '⚡',
    max_score: 18,
    protocol_theme: 'Restore Energy'
  },
  {
    id: 'weight_metabolism',
    name: 'Weight & Metabolism',
    description: 'Your body composition and eating patterns',
    icon: '⚖️',
    max_score: 18,
    protocol_theme: 'Optimize Metabolism'
  },
  {
    id: 'heart_fitness',
    name: 'Heart Health & Fitness',
    description: 'Cardiovascular strength and activity',
    icon: '❤️',
    max_score: 18,
    protocol_theme: 'Build Cardiovascular Strength'
  },
  {
    id: 'sleep_recovery',
    name: 'Sleep & Recovery',
    description: 'Sleep quality and restoration',
    icon: '😴',
    max_score: 18,
    protocol_theme: 'Optimize Sleep'
  },
  {
    id: 'stress_mental',
    name: 'Stress & Mental Health',
    description: 'Your emotional state and stress level',
    icon: '🧘',
    max_score: 18,
    protocol_theme: 'Build Resilience'
  },
  {
    id: 'brain_performance',
    name: 'Brain Performance',
    description: 'Focus, memory, and cognitive clarity',
    icon: '🧠',
    max_score: 18,
    protocol_theme: 'Sharpen Your Mind'
  },
  {
    id: 'longevity_prevention',
    name: 'Longevity & Prevention',
    description: 'Your health habits and proactive care',
    icon: '🎯',
    max_score: 18,
    protocol_theme: 'Build Sustainable Habits'
  }
]

export const PHASE2_QUESTIONS = {
  energy_fatigue: [
    {
      id: 'ef_q1',
      question: 'How is your energy most days?',
      answer_type: 'single-select',
      options: [
        { label: 'Consistent all day', value: 'consistent', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Drops in the afternoon', value: 'afternoon_drop', score: 1, risk_tags: ['LOW_ENERGY'], protocol_triggers: ['ENERGY_DIP'] },
        { label: 'Low most of the day', value: 'low', score: 2, risk_tags: ['LOW_ENERGY', 'POOR_RECOVERY'], protocol_triggers: ['LOW_ENERGY'] },
        { label: 'Very low / hard to function', value: 'very_low', score: 3, risk_tags: ['LOW_ENERGY', 'POOR_RECOVERY', 'BURNOUT_PATTERN'], protocol_triggers: ['SEVERE_FATIGUE'] }
      ]
    },
    {
      id: 'ef_q2',
      question: 'How do you usually feel when you wake up?',
      answer_type: 'single-select',
      options: [
        { label: 'Refreshed', value: 'refreshed', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Okay, but not fully rested', value: 'okay', score: 1, risk_tags: ['POOR_RECOVERY'], protocol_triggers: ['SLEEP_QUALITY'] },
        { label: 'Tired', value: 'tired', score: 2, risk_tags: ['POOR_RECOVERY', 'SHORT_SLEEP'], protocol_triggers: ['SLEEP_QUALITY'] },
        { label: 'Exhausted', value: 'exhausted', score: 3, risk_tags: ['POOR_RECOVERY', 'SHORT_SLEEP', 'SLEEP_APNEA_RISK'], protocol_triggers: ['SLEEP_APNEA_CHECK'] }
      ]
    },
    {
      id: 'ef_q3',
      question: 'Do you rely on caffeine to get through the day?',
      answer_type: 'single-select',
      options: [
        { label: 'No', value: 'no', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: '1–2 drinks/day', value: 'moderate', score: 1, risk_tags: ['CAFFEINE_DEPENDENCE'], protocol_triggers: ['CAFFEINE_TIMING'] },
        { label: '3+ drinks/day', value: 'high', score: 2, risk_tags: ['CAFFEINE_DEPENDENCE', 'LOW_ENERGY'], protocol_triggers: ['CAFFEINE_REDUCTION'] },
        { label: 'I feel dependent on caffeine', value: 'dependent', score: 3, risk_tags: ['CAFFEINE_DEPENDENCE', 'LOW_ENERGY'], protocol_triggers: ['CAFFEINE_REDUCTION'] }
      ]
    },
    {
      id: 'ef_q4',
      question: 'How often do you crash or feel sleepy after meals?',
      answer_type: 'single-select',
      options: [
        { label: 'Rarely', value: 'rarely', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Sometimes', value: 'sometimes', score: 1, risk_tags: ['BLOOD_SUGAR_SWINGS'], protocol_triggers: ['BALANCED_MEALS'] },
        { label: 'Often', value: 'often', score: 2, risk_tags: ['BLOOD_SUGAR_SWINGS'], protocol_triggers: ['PROTEIN_INTAKE'] },
        { label: 'Almost daily', value: 'daily', score: 3, risk_tags: ['BLOOD_SUGAR_SWINGS'], protocol_triggers: ['PROTEIN_INTAKE', 'MEAL_TIMING'] }
      ]
    },
    {
      id: 'ef_q5',
      question: 'How active are you during a normal day, outside formal exercise?',
      answer_type: 'single-select',
      options: [
        { label: 'Very active', value: 'very_active', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Moderately active', value: 'moderate', score: 1, risk_tags: [], protocol_triggers: [] },
        { label: 'Mostly sitting', value: 'sitting', score: 2, risk_tags: ['SEDENTARY_PATTERN'], protocol_triggers: ['DAILY_MOVEMENT'] },
        { label: 'Almost completely sedentary', value: 'sedentary', score: 3, risk_tags: ['SEDENTARY_PATTERN'], protocol_triggers: ['START_MOVING'] }
      ]
    },
    {
      id: 'ef_q6',
      question: 'How often do you feel physically or mentally burned out?',
      answer_type: 'single-select',
      options: [
        { label: 'Rarely', value: 'rarely', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Sometimes', value: 'sometimes', score: 1, risk_tags: ['BURNOUT_PATTERN'], protocol_triggers: ['RECOVERY_TIME'] },
        { label: 'Often', value: 'often', score: 2, risk_tags: ['BURNOUT_PATTERN', 'HIGH_STRESS'], protocol_triggers: ['RECOVERY_PROTOCOL'] },
        { label: 'Most days', value: 'most_days', score: 3, risk_tags: ['BURNOUT_PATTERN', 'HIGH_STRESS'], protocol_triggers: ['BURNOUT_RECOVERY'] }
      ]
    }
  ],

  weight_metabolism: [
    {
      id: 'wm_q1',
      question: 'What is your main weight goal?',
      answer_type: 'single-select',
      options: [
        { label: 'Lose weight', value: 'lose', score: 0, risk_tags: [], protocol_triggers: ['WEIGHT_LOSS_GOAL'] },
        { label: 'Maintain weight', value: 'maintain', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Gain healthy muscle', value: 'gain_muscle', score: 0, risk_tags: [], protocol_triggers: ['MUSCLE_GAIN_GOAL'] },
        { label: 'Improve body composition', value: 'composition', score: 0, risk_tags: [], protocol_triggers: ['COMPOSITION_GOAL'] }
      ]
    },
    {
      id: 'wm_q2',
      question: 'How often do you have strong cravings for sugar, snacks, or refined carbs?',
      answer_type: 'single-select',
      options: [
        { label: 'Rarely', value: 'rarely', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Sometimes', value: 'sometimes', score: 1, risk_tags: ['CRAVINGS'], protocol_triggers: ['BALANCED_MEALS'] },
        { label: 'Often', value: 'often', score: 2, risk_tags: ['CRAVINGS', 'BLOOD_SUGAR_SWINGS'], protocol_triggers: ['PROTEIN_INTAKE'] },
        { label: 'Daily', value: 'daily', score: 3, risk_tags: ['CRAVINGS', 'BLOOD_SUGAR_SWINGS'], protocol_triggers: ['CRAVINGS_PROTOCOL'] }
      ]
    },
    {
      id: 'wm_q3',
      question: 'How often do you eat late at night?',
      answer_type: 'single-select',
      options: [
        { label: 'Rarely', value: 'rarely', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: '1–2 nights/week', value: 'occasional', score: 1, risk_tags: ['LATE_EATING'], protocol_triggers: ['EATING_WINDOW'] },
        { label: '3–5 nights/week', value: 'frequent', score: 2, risk_tags: ['LATE_EATING', 'SLEEP_IMPACT'], protocol_triggers: ['EATING_CUTOFF'] },
        { label: 'Most nights', value: 'daily', score: 3, risk_tags: ['LATE_EATING', 'SLEEP_IMPACT'], protocol_triggers: ['DINNER_PROTOCOL'] }
      ]
    },
    {
      id: 'wm_q4',
      question: 'How often do you feel hungry again within 2 hours after eating?',
      answer_type: 'single-select',
      options: [
        { label: 'Rarely', value: 'rarely', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Sometimes', value: 'sometimes', score: 1, risk_tags: ['POOR_SATIETY'], protocol_triggers: ['BALANCED_MEALS'] },
        { label: 'Often', value: 'often', score: 2, risk_tags: ['POOR_SATIETY'], protocol_triggers: ['PROTEIN_INTAKE'] },
        { label: 'Almost always', value: 'always', score: 3, risk_tags: ['POOR_SATIETY', 'BLOOD_SUGAR_SWINGS'], protocol_triggers: ['NUTRITION_PROTOCOL'] }
      ]
    },
    {
      id: 'wm_q5',
      question: 'Where do you carry most extra weight?',
      answer_type: 'single-select',
      options: [
        { label: 'I do not carry extra weight', value: 'none', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Mostly hips/thighs', value: 'hips_thighs', score: 1, risk_tags: [], protocol_triggers: [] },
        { label: 'Mostly abdomen/waist', value: 'abdomen', score: 2, risk_tags: ['ABDOMINAL_WEIGHT', 'METABOLIC_RISK'], protocol_triggers: ['ABDOMINAL_PROTOCOL'] },
        { label: 'Not sure', value: 'unsure', score: 1, risk_tags: [], protocol_triggers: ['BODY_AWARENESS'] }
      ]
    },
    {
      id: 'wm_q6',
      question: 'How consistent is your eating schedule?',
      answer_type: 'single-select',
      options: [
        { label: 'Very consistent', value: 'consistent', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Somewhat consistent', value: 'somewhat', score: 1, risk_tags: ['IRREGULAR_EATING'], protocol_triggers: ['MEAL_TIMING'] },
        { label: 'Irregular', value: 'irregular', score: 2, risk_tags: ['IRREGULAR_EATING', 'BLOOD_SUGAR_SWINGS'], protocol_triggers: ['MEAL_SCHEDULE'] },
        { label: 'Chaotic / unpredictable', value: 'chaotic', score: 3, risk_tags: ['IRREGULAR_EATING', 'BLOOD_SUGAR_SWINGS'], protocol_triggers: ['EATING_STRUCTURE'] }
      ]
    }
  ],

  heart_fitness: [
    {
      id: 'hf_q1',
      question: 'Can you walk up 2 flights of stairs without stopping?',
      answer_type: 'single-select',
      options: [
        { label: 'Easily', value: 'easily', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'With effort', value: 'effort', score: 1, risk_tags: ['LOW_CARDIO_FITNESS'], protocol_triggers: ['CARDIO_BUILDING'] },
        { label: 'With difficulty', value: 'difficulty', score: 2, risk_tags: ['LOW_CARDIO_FITNESS', 'SHORTNESS_OF_BREATH'], protocol_triggers: ['GRADUAL_CARDIO'] },
        { label: 'Unable', value: 'unable', score: 3, risk_tags: ['LOW_CARDIO_FITNESS', 'SHORTNESS_OF_BREATH'], protocol_triggers: ['MEDICAL_EVAL', 'GENTLE_MOVEMENT'] }
      ]
    },
    {
      id: 'hf_q2',
      question: 'How often do you get short of breath during normal activities?',
      answer_type: 'single-select',
      options: [
        { label: 'Rarely', value: 'rarely', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Sometimes', value: 'sometimes', score: 1, risk_tags: ['SHORTNESS_OF_BREATH'], protocol_triggers: ['CARDIO_BUILDING'] },
        { label: 'Often', value: 'often', score: 2, risk_tags: ['SHORTNESS_OF_BREATH'], protocol_triggers: ['MEDICAL_EVAL', 'GRADUAL_CARDIO'] },
        { label: 'Very often', value: 'very_often', score: 3, risk_tags: ['SHORTNESS_OF_BREATH'], escalation_flag: true, protocol_triggers: ['MEDICAL_EVAL'] }
      ]
    },
    {
      id: 'hf_q3',
      question: 'Do you monitor your blood pressure?',
      answer_type: 'single-select',
      options: [
        { label: 'Yes, and it is usually normal', value: 'monitor_normal', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Yes, and it is sometimes high', value: 'sometimes_high', score: 1, risk_tags: ['BLOOD_PRESSURE_RISK'], protocol_triggers: ['BP_MONITORING'] },
        { label: 'No', value: 'no_monitor', score: 1, risk_tags: ['BLOOD_PRESSURE_RISK'], protocol_triggers: ['BP_CHECK'] },
        { label: 'I know it is high or uncontrolled', value: 'uncontrolled', score: 3, risk_tags: ['BLOOD_PRESSURE_RISK'], escalation_flag: true, protocol_triggers: ['MEDICAL_EVAL'] }
      ]
    },
    {
      id: 'hf_q4',
      question: 'How often do you feel chest discomfort, tightness, or pressure?',
      answer_type: 'single-select',
      options: [
        { label: 'Never', value: 'never', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Rarely', value: 'rarely', score: 1, risk_tags: ['CHEST_SYMPTOMS'], protocol_triggers: ['MONITOR_SYMPTOMS'] },
        { label: 'Sometimes', value: 'sometimes', score: 2, risk_tags: ['CHEST_SYMPTOMS'], escalation_flag: true, protocol_triggers: ['MEDICAL_EVAL'] },
        { label: 'Often', value: 'often', score: 3, risk_tags: ['CHEST_SYMPTOMS'], escalation_flag: true, protocol_triggers: ['URGENT_MEDICAL_EVAL'] }
      ]
    },
    {
      id: 'hf_q5',
      question: 'How often do you do intentional cardio exercise?',
      answer_type: 'single-select',
      options: [
        { label: '4+ days/week', value: '4plus', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: '2–3 days/week', value: '2_3', score: 1, risk_tags: [], protocol_triggers: [] },
        { label: '1 day/week', value: '1', score: 2, risk_tags: ['LOW_CARDIO_ACTIVITY'], protocol_triggers: ['CARDIO_BUILDING'] },
        { label: 'Rarely/never', value: 'never', score: 3, risk_tags: ['LOW_CARDIO_ACTIVITY'], protocol_triggers: ['START_CARDIO'] }
      ]
    },
    {
      id: 'hf_q6',
      question: 'How many steps do you average per day?',
      answer_type: 'single-select',
      options: [
        { label: '8,000+', value: '8000plus', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: '5,000–7,999', value: '5000_7999', score: 1, risk_tags: ['LOW_STEPS'], protocol_triggers: ['ADD_STEPS'] },
        { label: '3,000–4,999', value: '3000_4999', score: 2, risk_tags: ['LOW_STEPS'], protocol_triggers: ['INCREASE_STEPS'] },
        { label: 'Under 3,000 / not sure', value: 'under_3000', score: 3, risk_tags: ['LOW_STEPS', 'SEDENTARY_PATTERN'], protocol_triggers: ['START_WALKING'] }
      ]
    }
  ],

  sleep_recovery: [
    {
      id: 'sr_q1',
      question: 'What is your primary sleep goal?',
      answer_type: 'single-select',
      // Options reframed per Keith: focus on the sleep OUTCOME the user
      // wants, not the schedule mechanic. "Get to bed earlier" / "Wake
      // earlier" prescribed timing changes that don't fit early sleepers.
      // The new options are universal — anyone can want any of these.
      options: [
        { label: 'Improve sleep consistency', value: 'consistency', score: 1, risk_tags: ['INCONSISTENT_SLEEP'], protocol_triggers: ['SLEEP_SCHEDULE'] },
        { label: 'Fall asleep faster', value: 'fall_asleep_faster', score: 1, risk_tags: ['SLEEP_ONSET_DELAY'], protocol_triggers: ['BEDTIME_PROTOCOL', 'SLEEP_QUALITY'] },
        { label: 'Stay asleep through the night', value: 'stay_asleep', score: 1, risk_tags: ['NIGHT_WAKING'], protocol_triggers: ['SLEEP_QUALITY', 'HYDRATION_SLEEP'] },
        { label: 'Wake up feeling more rested', value: 'wake_rested', score: 1, risk_tags: ['POOR_RECOVERY'], protocol_triggers: ['SLEEP_QUALITY', 'CIRCADIAN_ALIGNMENT'] }
      ]
    },
    {
      id: 'sr_q2',
      question: 'What time do you typically wake up?',
      answer_type: 'single-select',
      options: [
        { label: 'Before 6:00 AM', value: 'before_6', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: '6:00 – 7:00 AM', value: '6_7am', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: '7:00 – 8:00 AM', value: '7_8am', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'After 8:00 AM', value: 'after_8', score: 1, risk_tags: ['LATE_WAKEUP'], protocol_triggers: ['CIRCADIAN_RESET'] }
      ]
    },
    {
      id: 'sr_q3',
      question: 'Do you get morning light exposure (sun or bright light) within 1 hour of waking?',
      answer_type: 'single-select',
      options: [
        { label: 'Yes, regularly', value: 'yes', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Yes, sometimes', value: 'sometimes', score: 1, risk_tags: ['LOW_LIGHT_EXPOSURE'], protocol_triggers: ['MORNING_LIGHT'] },
        { label: 'Rarely', value: 'rarely', score: 2, risk_tags: ['LOW_LIGHT_EXPOSURE'], protocol_triggers: ['MORNING_LIGHT_PROTOCOL'] },
        { label: 'I wake in the dark (shift work or timing)', value: 'dark', score: 3, risk_tags: ['DARK_WAKING', 'CIRCADIAN_MISALIGNMENT'], protocol_triggers: ['CIRCADIAN_LIGHT_THERAPY', 'SHIFT_ADJUSTMENT'] }
      ]
    },
    {
      id: 'sr_q4',
      question: 'If you had no commitments the next day, what time would you naturally go to bed?',
      answer_type: 'single-select',
      // Reframed as chronotype rather than current behavior — surfaces natural
      // bedtime preference, accommodates early sleepers (before 9 PM is healthy
      // for early chronotypes) and decouples from shift workers (Q5).
      options: [
        { label: 'Before 9:00 PM', value: 'before_9pm', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: '9:00 – 11:00 PM', value: '9_11pm', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: '11:00 PM – 1:00 AM', value: '11pm_1am', score: 1, risk_tags: ['LATE_CHRONOTYPE'], protocol_triggers: ['EARLIER_BEDTIME'] },
        { label: 'After 1:00 AM', value: 'after_1am', score: 2, risk_tags: ['LATE_CHRONOTYPE', 'SHORT_SLEEP'], protocol_triggers: ['SLEEP_EXTENSION', 'CIRCADIAN_RESET'] },
        { label: 'My schedule is shifted (night shift / rotating)', value: 'shift_worker', score: 1, risk_tags: ['SHIFT_WORK'], protocol_triggers: ['SHIFT_PROTOCOL'] }
      ]
    },
    {
      id: 'sr_q5',
      question: 'Do you work night shift or have rotating shift work?',
      answer_type: 'single-select',
      options: [
        { label: 'No', value: 'no', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Occasionally', value: 'occasional', score: 1, risk_tags: ['SHIFT_WORK'], protocol_triggers: ['SHIFT_RECOVERY'] },
        { label: 'Regular shift work', value: 'regular', score: 2, risk_tags: ['SHIFT_WORK', 'CIRCADIAN_MISALIGNMENT'], protocol_triggers: ['SHIFT_PROTOCOL'] },
        { label: 'Rotating or on-call', value: 'rotating', score: 3, risk_tags: ['SHIFT_WORK', 'CIRCADIAN_MISALIGNMENT'], protocol_triggers: ['SHIFT_MANAGEMENT', 'CIRCADIAN_SUPPORT'] }
      ]
    },
    {
      id: 'sr_q6',
      question: 'How consistent is your wake-up time?',
      answer_type: 'single-select',
      options: [
        { label: 'Very consistent', value: 'consistent', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Somewhat consistent', value: 'somewhat', score: 1, risk_tags: ['IRREGULAR_SLEEP'], protocol_triggers: ['SCHEDULE_CONSISTENCY'] },
        { label: 'Irregular', value: 'irregular', score: 2, risk_tags: ['IRREGULAR_SLEEP'], protocol_triggers: ['SLEEP_SCHEDULE'] },
        { label: 'Very inconsistent', value: 'very_inconsistent', score: 3, risk_tags: ['IRREGULAR_SLEEP'], protocol_triggers: ['CIRCADIAN_RESET'] }
      ]
    }
  ],

  stress_mental: [
    {
      id: 'sm_q1',
      question: 'How would you rate your current stress level?',
      answer_type: 'single-select',
      options: [
        { label: 'Low', value: 'low', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Moderate', value: 'moderate', score: 1, risk_tags: ['HIGH_STRESS'], protocol_triggers: ['STRESS_MANAGEMENT'] },
        { label: 'High', value: 'high', score: 2, risk_tags: ['HIGH_STRESS'], protocol_triggers: ['STRESS_PROTOCOL'] },
        { label: 'Extreme', value: 'extreme', score: 3, risk_tags: ['HIGH_STRESS'], protocol_triggers: ['PROFESSIONAL_SUPPORT'] }
      ]
    },
    {
      id: 'sm_q2',
      question: 'How often do you feel overwhelmed?',
      answer_type: 'single-select',
      options: [
        { label: 'Rarely', value: 'rarely', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Sometimes', value: 'sometimes', score: 1, risk_tags: ['OVERWHELM'], protocol_triggers: ['PRIORITIZATION'] },
        { label: 'Often', value: 'often', score: 2, risk_tags: ['OVERWHELM'], protocol_triggers: ['BOUNDARY_SETTING'] },
        { label: 'Most days', value: 'most_days', score: 3, risk_tags: ['OVERWHELM'], protocol_triggers: ['LIFE_RESTRUCTURING', 'PROFESSIONAL_SUPPORT'] }
      ]
    },
    {
      id: 'sm_q3',
      question: 'How often have you felt anxious, depressed, or emotionally low recently?',
      answer_type: 'single-select',
      options: [
        { label: 'Rarely', value: 'rarely', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Sometimes', value: 'sometimes', score: 1, risk_tags: ['LOW_MOOD'], protocol_triggers: ['MOOD_SUPPORT'] },
        { label: 'Often', value: 'often', score: 2, risk_tags: ['LOW_MOOD'], escalation_flag: true, protocol_triggers: ['PROFESSIONAL_SUPPORT'] },
        { label: 'Most days', value: 'most_days', score: 3, risk_tags: ['LOW_MOOD'], escalation_flag: true, protocol_triggers: ['URGENT_PROFESSIONAL_SUPPORT'] }
      ]
    },
    {
      id: 'sm_q4',
      question: 'Do you have time each day to relax or decompress?',
      answer_type: 'single-select',
      options: [
        { label: 'Yes, daily', value: 'daily', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'A few days/week', value: 'few_days', score: 1, risk_tags: ['NO_RECOVERY_TIME'], protocol_triggers: ['SCHEDULE_RECOVERY'] },
        { label: 'Rarely', value: 'rarely', score: 2, risk_tags: ['NO_RECOVERY_TIME'], protocol_triggers: ['PRIORITY_RECOVERY'] },
        { label: 'Almost never', value: 'never', score: 3, risk_tags: ['NO_RECOVERY_TIME', 'BURNOUT_PATTERN'], protocol_triggers: ['URGENT_RECOVERY'] }
      ]
    },
    {
      id: 'sm_q5',
      question: 'How in control do you feel of your schedule?',
      answer_type: 'single-select',
      options: [
        { label: 'Very in control', value: 'control', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Somewhat in control', value: 'somewhat', score: 1, risk_tags: ['SCHEDULE_STRESS'], protocol_triggers: ['TIME_MANAGEMENT'] },
        { label: 'Not very in control', value: 'not_control', score: 2, risk_tags: ['SCHEDULE_STRESS'], protocol_triggers: ['BOUNDARY_SETTING'] },
        { label: 'Completely overwhelmed', value: 'overwhelmed', score: 3, risk_tags: ['SCHEDULE_STRESS', 'OVERWHELM'], protocol_triggers: ['LIFE_RESTRUCTURING'] }
      ]
    },
    {
      id: 'sm_q6',
      question: 'Do you have people you can rely on for support?',
      answer_type: 'single-select',
      options: [
        { label: 'Strong support', value: 'strong', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Some support', value: 'some', score: 1, risk_tags: ['LOW_SOCIAL_SUPPORT'], protocol_triggers: ['BUILD_CONNECTIONS'] },
        { label: 'Very little support', value: 'little', score: 2, risk_tags: ['LOW_SOCIAL_SUPPORT'], protocol_triggers: ['COMMUNITY_BUILDING'] },
        { label: 'No support', value: 'none', score: 3, risk_tags: ['LOW_SOCIAL_SUPPORT'], escalation_flag: true, protocol_triggers: ['PROFESSIONAL_SUPPORT', 'COMMUNITY_BUILDING'] }
      ]
    }
  ],

  brain_performance: [
    {
      id: 'bp_q1',
      question: 'How is your focus during the day?',
      answer_type: 'single-select',
      options: [
        { label: 'Strong and steady', value: 'strong', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Good but variable', value: 'variable', score: 1, risk_tags: ['LOW_FOCUS'], protocol_triggers: ['FOCUS_ENVIRONMENT'] },
        { label: 'Poor', value: 'poor', score: 2, risk_tags: ['LOW_FOCUS'], protocol_triggers: ['FOCUS_PROTOCOL'] },
        { label: 'Very poor', value: 'very_poor', score: 3, risk_tags: ['LOW_FOCUS', 'BRAIN_FOG'], protocol_triggers: ['MEDICAL_CHECK'] }
      ]
    },
    {
      id: 'bp_q2',
      question: 'How often do you experience brain fog?',
      answer_type: 'single-select',
      options: [
        { label: 'Rarely', value: 'rarely', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Sometimes', value: 'sometimes', score: 1, risk_tags: ['BRAIN_FOG'], protocol_triggers: ['HYDRATION_SLEEP'] },
        { label: 'Often', value: 'often', score: 2, risk_tags: ['BRAIN_FOG'], protocol_triggers: ['BRAIN_FOG_PROTOCOL'] },
        { label: 'Daily', value: 'daily', score: 3, risk_tags: ['BRAIN_FOG'], protocol_triggers: ['MEDICAL_EVAL'] }
      ]
    },
    {
      id: 'bp_q3',
      question: 'How is your memory compared to one year ago?',
      answer_type: 'single-select',
      options: [
        { label: 'Better', value: 'better', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'About the same', value: 'same', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Slightly worse', value: 'slightly', score: 1, risk_tags: ['MEMORY_DECLINE'], protocol_triggers: ['COGNITIVE_TRAINING'] },
        { label: 'Much worse', value: 'much_worse', score: 3, risk_tags: ['MEMORY_DECLINE'], escalation_flag: true, protocol_triggers: ['MEDICAL_EVAL'] }
      ]
    },
    {
      id: 'bp_q4',
      question: 'How often do you multitask or switch between tasks?',
      answer_type: 'single-select',
      options: [
        { label: 'Rarely', value: 'rarely', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Sometimes', value: 'sometimes', score: 1, risk_tags: ['TASK_SWITCHING'], protocol_triggers: ['SINGLE_FOCUS'] },
        { label: 'Often', value: 'often', score: 2, risk_tags: ['TASK_SWITCHING'], protocol_triggers: ['FOCUS_BLOCKS'] },
        { label: 'Constantly', value: 'constantly', score: 3, risk_tags: ['TASK_SWITCHING', 'HIGH_COGNITIVE_LOAD'], protocol_triggers: ['DEEP_WORK_PROTOCOL'] }
      ]
    },
    {
      id: 'bp_q5',
      question: 'How mentally demanding is your work or daily life?',
      answer_type: 'single-select',
      options: [
        { label: 'Low', value: 'low', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Moderate', value: 'moderate', score: 1, risk_tags: [], protocol_triggers: [] },
        { label: 'High', value: 'high', score: 2, risk_tags: ['HIGH_COGNITIVE_LOAD'], protocol_triggers: ['RECOVERY_PROTOCOL'] },
        { label: 'Very high', value: 'very_high', score: 3, risk_tags: ['HIGH_COGNITIVE_LOAD'], protocol_triggers: ['BURNOUT_PREVENTION'] }
      ]
    },
    {
      id: 'bp_q6',
      question: 'How often do you learn new things or challenge your brain?',
      answer_type: 'single-select',
      options: [
        { label: 'Daily', value: 'daily', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Weekly', value: 'weekly', score: 1, risk_tags: ['LOW_COGNITIVE_STIMULATION'], protocol_triggers: [] },
        { label: 'Monthly', value: 'monthly', score: 2, risk_tags: ['LOW_COGNITIVE_STIMULATION'], protocol_triggers: ['LEARNING_PROTOCOL'] },
        { label: 'Rarely', value: 'rarely', score: 3, risk_tags: ['LOW_COGNITIVE_STIMULATION'], protocol_triggers: ['COGNITIVE_ENGAGEMENT'] }
      ]
    }
  ],

  longevity_prevention: [
    {
      id: 'lp_q1',
      question: 'How proactive are you about your health?',
      answer_type: 'single-select',
      options: [
        { label: 'Very proactive', value: 'very', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Somewhat proactive', value: 'somewhat', score: 1, risk_tags: [], protocol_triggers: [] },
        { label: 'Reactive only when something is wrong', value: 'reactive', score: 2, risk_tags: ['LOW_PREVENTION'], protocol_triggers: ['PREVENTION_PROTOCOL'] },
        { label: 'I avoid dealing with it', value: 'avoidant', score: 3, risk_tags: ['LOW_PREVENTION'], protocol_triggers: ['ENGAGEMENT_PROTOCOL'] }
      ]
    },
    {
      id: 'lp_q2',
      question: 'Do you get regular preventive checkups?',
      answer_type: 'single-select',
      options: [
        { label: 'Yes, annually', value: 'annual', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Sometimes', value: 'sometimes', score: 1, risk_tags: ['LOW_CHECKUPS'], protocol_triggers: ['SCHEDULE_CHECKUP'] },
        { label: 'Rarely', value: 'rarely', score: 2, risk_tags: ['LOW_CHECKUPS'], protocol_triggers: ['MEDICAL_REMINDER'] },
        { label: 'Never', value: 'never', score: 3, risk_tags: ['LOW_CHECKUPS'], protocol_triggers: ['URGENT_CHECKUP'] }
      ]
    },
    {
      id: 'lp_q3',
      question: 'Do you track your health metrics? (e.g., blood pressure, glucose, cholesterol, weight, or other wellness data)',
      answer_type: 'single-select',
      options: [
        { label: 'Multiple metrics regularly', value: 'multiple', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'One or two metrics occasionally', value: 'one_two', score: 1, risk_tags: ['NO_TRACKING'], protocol_triggers: [] },
        { label: 'Rarely track anything', value: 'rarely', score: 2, risk_tags: ['NO_TRACKING'], protocol_triggers: ['SIMPLE_TRACKING'] },
        { label: 'Never track health metrics', value: 'none', score: 3, risk_tags: ['NO_TRACKING'], protocol_triggers: ['START_TRACKING'] }
      ]
    },
    {
      id: 'lp_q4',
      question: 'How consistently do you maintain healthy behaviors? (e.g., exercise, nutrition, sleep, stress management)',
      answer_type: 'single-select',
      options: [
        { label: 'Very consistent', value: 'very', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Somewhat consistent', value: 'somewhat', score: 1, risk_tags: ['LOW_CONSISTENCY'], protocol_triggers: [] },
        { label: 'Inconsistent', value: 'inconsistent', score: 2, risk_tags: ['LOW_CONSISTENCY'], protocol_triggers: ['HABIT_BUILDING'] },
        { label: 'I struggle to maintain habits', value: 'struggle', score: 3, risk_tags: ['LOW_CONSISTENCY'], protocol_triggers: ['HABIT_SYSTEM'] }
      ]
    },
    {
      id: 'lp_q5',
      question: 'How motivated are you to improve your health right now?',
      answer_type: 'single-select',
      options: [
        { label: 'Very motivated', value: 'very', score: 0, risk_tags: [], protocol_triggers: [] },
        { label: 'Somewhat motivated', value: 'somewhat', score: 1, risk_tags: ['LOW_MOTIVATION'], protocol_triggers: [] },
        { label: 'Unsure', value: 'unsure', score: 2, risk_tags: ['LOW_MOTIVATION'], protocol_triggers: ['MOTIVATION_BUILDING'] },
        { label: 'Not motivated', value: 'not', score: 3, risk_tags: ['LOW_MOTIVATION'], protocol_triggers: ['FIND_YOUR_WHY'] }
      ]
    },
    {
      id: 'lp_q6',
      question: 'What kind of plan works best for you?',
      answer_type: 'single-select',
      options: [
        { label: 'Simple daily checklist', value: 'checklist', score: 0, risk_tags: [], protocol_triggers: ['CHECKLIST_PLAN'] },
        { label: 'Weekly goals', value: 'weekly', score: 0, risk_tags: [], protocol_triggers: ['WEEKLY_PLAN'] },
        { label: 'Coaching/accountability', value: 'coaching', score: 0, risk_tags: [], protocol_triggers: ['ACCOUNTABILITY_PLAN'] },
        { label: 'Detailed data-driven plan', value: 'detailed', score: 0, risk_tags: [], protocol_triggers: ['DETAILED_PLAN'] }
      ]
    }
  ]
}

// Re-export the v2 coaching library so existing imports keep working.
// The original 27 protocols below are kept as fallback for any trigger
// not yet authored in the new library; the spread order means new entries
// override old ones when keys collide.
export { COACHING_PROTOCOLS } from './coachingProtocols.js'
import { COACHING_PROTOCOLS as _COACHING_PROTOCOLS_V2 } from './coachingProtocols.js'

const _LEGACY_PROTOCOL_LIBRARY = {
  // Energy & Fatigue Protocols
  ENERGY_DIP: {
    category: 'energy_fatigue',
    daily_micro_wins: [
      'Drink 16 oz water within 30 minutes of waking',
      'Get 10 minutes of outdoor light before noon',
      'Take a 5–10 minute walk after lunch'
    ],
    weekly_micro_wins: [
      'Add a protein-based breakfast 4 days this week',
      'Do one 10-minute movement session before 3 PM'
    ],
    avoid: 'Caffeine after 2 PM',
    tracking_metric: 'Energy score 1–10 each afternoon',
    review_days: 14
  },

  LOW_ENERGY: {
    category: 'energy_fatigue',
    daily_micro_wins: [
      'Drink 16 oz water within 30 minutes of waking',
      'Get 10 minutes of outdoor light before noon',
      'Eat protein + fat + fiber at breakfast'
    ],
    weekly_micro_wins: [
      'Complete 3 short movement sessions (10 min each)',
      'Sleep 30 minutes earlier 3 nights this week'
    ],
    avoid: 'Late-night eating, excessive caffeine',
    tracking_metric: 'Daily energy 1–10, wake-up mood',
    review_days: 7
  },

  SEVERE_FATIGUE: {
    category: 'energy_fatigue',
    daily_micro_wins: [
      'Prioritize 7+ hours sleep',
      'Drink 16 oz water every 2 hours',
      'Eat balanced meals every 4 hours'
    ],
    weekly_micro_wins: [
      'Take 1 full rest day',
      'Schedule a health checkup to rule out medical causes'
    ],
    avoid: 'Overexertion, skipped meals, poor sleep',
    tracking_metric: 'Sleep hours, energy, meals eaten',
    review_days: 3,
    escalation: 'Severe fatigue may indicate sleep, nutrition, stress, or medical issues. Consider a checkup.'
  },

  CAFFEINE_REDUCTION: {
    category: 'energy_fatigue',
    daily_micro_wins: [
      'No caffeine after 2 PM',
      'Replace one coffee with herbal tea or water',
      'Drink 16 oz water each morning instead of rushing to caffeine'
    ],
    weekly_micro_wins: [
      'Reduce total caffeine by 25% this week',
      'Try one caffeine-free morning and note your energy'
    ],
    avoid: 'Cold turkey quit (causes headaches); late caffeine',
    tracking_metric: 'Caffeine intake, afternoon energy, sleep quality',
    review_days: 14
  },

  BLOOD_SUGAR_SWINGS: {
    category: 'energy_fatigue',
    daily_micro_wins: [
      'Add 25–35g protein to breakfast',
      'Have a balanced snack (fruit + nuts) instead of sugary snacks',
      'Eat meals within 2 hours of waking'
    ],
    weekly_micro_wins: [
      'Prepare 2 high-protein lunch options',
      'Replace one sugary snack with whole fruit + nut butter'
    ],
    avoid: 'Eating large carbs alone, skipping meals, sugary drinks',
    tracking_metric: 'Post-meal energy, blood sugar crashes, cravings',
    review_days: 14
  },

  SEDENTARY_PATTERN: {
    category: 'energy_fatigue',
    daily_micro_wins: [
      'Take a 5–10 minute walk after each meal',
      'Stand during phone calls',
      'Do 10 bodyweight squats or stretches every 60 minutes'
    ],
    weekly_micro_wins: [
      'Add 1,000 more steps per day',
      'Complete one 20-minute movement session'
    ],
    avoid: 'Sitting for 2+ hours without movement',
    tracking_metric: 'Daily steps, energy levels, mood',
    review_days: 14
  },

  BURNOUT_RECOVERY: {
    category: 'energy_fatigue',
    daily_micro_wins: [
      'Schedule 15 minutes of uninterrupted rest',
      'Do 5 minutes of deep breathing',
      'Disconnect from work at a set time each day'
    ],
    weekly_micro_wins: [
      'Take one full day off from work',
      'Do one activity purely for enjoyment (no productivity goal)'
    ],
    avoid: 'Overcommitting, working weekends, skipping rest',
    tracking_metric: 'Energy, mood, hours worked, rest time',
    review_days: 7,
    escalation: 'Burnout is a signal to examine your workload and life balance. Consider talking to a counselor or coach.'
  },

  // Weight & Metabolism Protocols
  WEIGHT_LOSS_GOAL: {
    category: 'weight_metabolism',
    daily_micro_wins: [
      'Add 25–35g protein to first meal',
      'Eat vegetables at 2 meals today',
      'Take a 10-minute walk after dinner'
    ],
    weekly_micro_wins: [
      'Replace one sugary snack with fruit, Greek yogurt, or nuts',
      'Stop eating 2–3 hours before bed',
      'Complete 3 short movement sessions'
    ],
    avoid: 'Fad diets, skipped meals, eating standing up',
    tracking_metric: 'Weight 1–2x per week, waist measurement weekly',
    review_days: 28
  },

  MUSCLE_GAIN_GOAL: {
    category: 'weight_metabolism',
    daily_micro_wins: [
      'Eat 30g protein at breakfast and lunch',
      'Drink 16 oz water before noon',
      'Do one 10-minute strength session'
    ],
    weekly_micro_wins: [
      'Complete 2–3 strength training sessions',
      'Prepare protein-rich meals for the week'
    ],
    avoid: 'Too much cardio without strength, inadequate protein',
    tracking_metric: 'Weight, muscle measurements, strength gains',
    review_days: 28
  },

  CRAVINGS_PROTOCOL: {
    category: 'weight_metabolism',
    daily_micro_wins: [
      'Eat a protein + fat snack when cravings hit (nuts, cheese, eggs)',
      'Drink 16 oz water instead of reaching for sugar',
      'Have one 10-minute walk to break the craving cycle'
    ],
    weekly_micro_wins: [
      'Replace 2 sugary snacks with real-food alternatives',
      'Identify your craving trigger (boredom, stress, time of day)'
    ],
    avoid: 'Keeping trigger foods at home, eating while distracted',
    tracking_metric: 'Cravings frequency, energy, food choices',
    review_days: 14
  },

  DINNER_PROTOCOL: {
    category: 'weight_metabolism',
    daily_micro_wins: [
      'Eat dinner 2–3 hours before bed',
      'Make dinner the smallest meal of the day',
      'Include fiber and protein at dinner'
    ],
    weekly_micro_wins: [
      'Replace 3 late-night snacks with herbal tea or water',
      'Prepare 3 simple, balanced dinner options'
    ],
    avoid: 'Large meals close to bedtime, eating while working',
    tracking_metric: 'Sleep quality, morning hunger, weight',
    review_days: 14
  },

  NUTRITION_PROTOCOL: {
    category: 'weight_metabolism',
    daily_micro_wins: [
      'Eat a balanced breakfast with protein, fat, and fiber',
      'Include vegetables in 2 meals',
      'Stay hydrated (8+ cups water)'
    ],
    weekly_micro_wins: [
      'Meal prep 2 high-protein, fiber-rich meals',
      'Track what you eat for 3 days to identify patterns'
    ],
    avoid: 'Skipped meals, eating standing up, processed foods',
    tracking_metric: 'Satiety, energy, cravings, digestion',
    review_days: 14
  },

  // Heart Health & Fitness Protocols
  CARDIO_BUILDING: {
    category: 'heart_fitness',
    daily_micro_wins: [
      'Walk 10 minutes daily',
      'Use stairs instead of elevator',
      'Add one 5-minute movement break'
    ],
    weekly_micro_wins: [
      'Complete one 20-minute moderate cardio session',
      'Add 1,000 more steps per day'
    ],
    avoid: 'Overdoing it too soon, all-or-nothing thinking',
    tracking_metric: 'Daily steps, weekly cardio sessions, breathing ease',
    review_days: 14
  },

  GRADUAL_CARDIO: {
    category: 'heart_fitness',
    daily_micro_wins: [
      'Walk 5–10 minutes at a comfortable pace',
      'Do gentle stretching',
      'Focus on consistency over intensity'
    ],
    weekly_micro_wins: [
      'Add 2 short walks (5–10 minutes each)',
      'Check how stairs feel—gradually building capacity'
    ],
    avoid: 'Intense exercise too soon, comparison to others',
    tracking_metric: 'Activity duration, breathing, energy',
    review_days: 7,
    escalation: 'If shortness of breath occurs with minimal activity, consult a healthcare provider before increasing intensity.'
  },

  GENTLE_MOVEMENT: {
    category: 'heart_fitness',
    daily_micro_wins: [
      'Gentle stretching (5–10 minutes)',
      'Slow walking at a conversational pace',
      'Light movements like tai chi or yoga'
    ],
    weekly_micro_wins: [
      'Three 10-minute gentle sessions',
      'Focus on feeling better, not breaking sweat'
    ],
    avoid: 'Overexertion, high-intensity exercise without clearance',
    tracking_metric: 'How you feel, breathing, any chest/health symptoms',
    review_days: 7,
    escalation: 'Get medical clearance before increasing activity intensity. Your healthcare provider can guide what is safe for you.'
  },

  STEPS_PROTOCOL: {
    category: 'heart_fitness',
    daily_micro_wins: [
      'Park farther away from store entrances',
      'Take a 10-minute walk after one meal',
      'Stand while on phone calls'
    ],
    weekly_micro_wins: [
      'Add 1,000 more steps per day than last week',
      'Plan one longer walk (20+ minutes)'
    ],
    avoid: 'Sitting for 2+ hours without movement',
    tracking_metric: 'Daily steps, energy, cardiovascular ease',
    review_days: 14
  },

  // Sleep & Recovery Protocols
  SLEEP_PROTOCOL: {
    category: 'sleep_recovery',
    daily_micro_wins: [
      'Set a fixed wake-up time (even on weekends)',
      'No screens 30–60 minutes before bed',
      'Keep bedroom cool, dark, and quiet'
    ],
    weekly_micro_wins: [
      'Sleep 30 minutes earlier for 3 nights',
      'Create a 10-minute wind-down routine'
    ],
    avoid: 'Caffeine after 2 PM, blue light before bed, sleeping in',
    tracking_metric: 'Sleep hours, bedtime, wake-up time, sleep quality',
    review_days: 14
  },

  SLEEP_EXTENSION: {
    category: 'sleep_recovery',
    daily_micro_wins: [
      'Go to bed 15 minutes earlier',
      'Set a consistent wake-up time',
      'Remove one caffeine drink'
    ],
    weekly_micro_wins: [
      'Sleep 30 minutes earlier 4 nights this week',
      'Track sleep hours and how you feel'
    ],
    avoid: 'Hitting snooze, inconsistent bedtimes',
    tracking_metric: 'Total sleep hours, daytime energy, alertness',
    review_days: 14
  },

  NO_SCREENS_PROTOCOL: {
    category: 'sleep_recovery',
    daily_micro_wins: [
      'No screens 1 hour before bed',
      'Replace screen time with a book or stretching',
      'Use an alarm clock, not your phone'
    ],
    weekly_micro_wins: [
      'Zero phone time in the bedroom for 3 nights',
      'Create a phone-free wind-down routine'
    ],
    avoid: 'Doom scrolling, work emails before bed',
    tracking_metric: 'Screen time before bed, sleep quality, alertness',
    review_days: 14
  },

  SLEEP_APNEA_CHECK: {
    category: 'sleep_recovery',
    daily_micro_wins: [
      'Sleep on your side (not back)',
      'Maintain healthy weight through diet and movement',
      'Track snoring or gasping episodes'
    ],
    weekly_micro_wins: [
      'Ask your partner about snoring patterns',
      'Schedule a sleep study screening if symptoms persist'
    ],
    avoid: 'Sedatives without medical guidance, dismissing symptoms',
    tracking_metric: 'Snoring frequency, gasping, alertness, sleep quality',
    review_days: 7,
    escalation: 'Untreated sleep apnea increases heart and stroke risk. Consult a doctor for a sleep study if you suspect it.'
  },

  // Stress & Mental Health Protocols
  STRESS_PROTOCOL: {
    category: 'stress_mental',
    daily_micro_wins: [
      '5-minute breathing practice (4 counts in, 6 out)',
      '10-minute walk without phone',
      'One activity purely for relaxation'
    ],
    weekly_micro_wins: [
      'Block one "recovery hour" in your calendar',
      'Reach out to one supportive person'
    ],
    avoid: 'Overcommitting, avoiding stress, screen time as escape',
    tracking_metric: 'Stress level 1–10, mood, sleep quality',
    review_days: 7
  },

  PROFESSIONAL_SUPPORT: {
    category: 'stress_mental',
    daily_micro_wins: [
      '5-minute daily grounding exercise',
      'One activity that brings joy',
      'Connect with one supportive person'
    ],
    weekly_micro_wins: [
      'Schedule a session with a therapist or counselor',
      'Complete one stress-relief activity'
    ],
    avoid: 'Isolating, dismissing the need for support, self-criticism',
    tracking_metric: 'Mood, anxiety level, connection',
    review_days: 3,
    escalation: 'Professional mental health support can be transformative. A therapist, counselor, or coach can help you develop sustainable coping strategies.'
  },

  // Brain Performance Protocols
  FOCUS_PROTOCOL: {
    category: 'brain_performance',
    daily_micro_wins: [
      'One 25-minute focused work block (Pomodoro)',
      'Reduce multitasking during key tasks',
      'Take a 5-minute movement break every 60–90 minutes'
    ],
    weekly_micro_wins: [
      'Designate 3 "deep work" sessions with no interruptions',
      'Turn off notifications during focus time'
    ],
    avoid: 'Constant task switching, open browser tabs, phone nearby',
    tracking_metric: 'Focus duration, task completion, clarity',
    review_days: 14
  },

  BRAIN_FOG_PROTOCOL: {
    category: 'brain_performance',
    daily_micro_wins: [
      'Drink 16 oz water every 2 hours',
      'Get 10 minutes of outdoor light',
      'Move your body for 5 minutes when fog hits'
    ],
    weekly_micro_wins: [
      'Sleep 30 minutes earlier 3 nights this week',
      'Add omega-3 foods (fish, flax, walnuts)'
    ],
    avoid: 'Dehydration, poor sleep, prolonged sitting',
    tracking_metric: 'Mental clarity, energy, sleep quality',
    review_days: 14
  },

  COGNITIVE_TRAINING: {
    category: 'brain_performance',
    daily_micro_wins: [
      'Learn one new word or concept',
      'Do a simple puzzle or brain game',
      'Read for 10 minutes on an unfamiliar topic'
    ],
    weekly_micro_wins: [
      'Learn a new skill (language, instrument, coding)',
      'Teach someone something you know'
    ],
    avoid: 'Routine-only thinking, avoiding new challenges',
    tracking_metric: 'Learning consistency, memory, engagement',
    review_days: 28
  },

  // Longevity & Prevention Protocols
  PREVENTION_PROTOCOL: {
    category: 'longevity_prevention',
    daily_micro_wins: [
      'Drink water consistently throughout the day',
      'Move your body for 10 minutes',
      'Eat one vegetable at lunch or dinner'
    ],
    weekly_micro_wins: [
      'Track one health metric (steps, weight, mood)',
      'Plan one preventive health action (appointment, screening)'
    ],
    avoid: 'Waiting until illness strikes',
    tracking_metric: 'Health actions completed, consistency',
    review_days: 28
  },

  CHECKLIST_PLAN: {
    category: 'longevity_prevention',
    daily_micro_wins: [
      'Morning: Water + 10 min movement',
      'Midday: Balanced meal + 5 min breathwork',
      'Evening: No screens 1 hour before bed'
    ],
    weekly_micro_wins: [
      'Track 3 daily habits (yes/no checklist)',
      'Review checklist on Sunday'
    ],
    avoid: 'Perfectionism, all-or-nothing thinking',
    tracking_metric: 'Checklist completion %',
    review_days: 14
  }
}

// Merge: v2 coaching library overrides legacy entries when keys collide.
// Triggers not yet authored in v2 fall back to the legacy protocol.
export const PROTOCOL_LIBRARY = {
  ..._LEGACY_PROTOCOL_LIBRARY,
  ..._COACHING_PROTOCOLS_V2,
}

export const getScoreStatus = (score) => {
  if (score <= 4) return { label: 'Optimal', level: 'optimal', color: '#28a745' }
  if (score <= 9) return { label: 'Needs Attention', level: 'needs-attention', color: '#ffc107' }
  return { label: 'High Priority', level: 'high-priority', color: '#dc3545' }
}

export const calculateCategoryScore = (answers, categoryQuestions) => {
  let totalScore = 0
  categoryQuestions.forEach(q => {
    const answer = answers[q.id]
    if (answer) {
      // Answer could be an object with score property or just the value
      const score = answer.score !== undefined ? answer.score : 0
      totalScore += score
    }
  })
  return totalScore
}

export const aggregateRiskTags = (answers, categoryQuestions) => {
  const tags = {}
  categoryQuestions.forEach(q => {
    const answer = answers[q.id]
    if (answer) {
      // Answer object has risk_tags property
      const riskTags = answer.risk_tags || []
      riskTags.forEach(tag => {
        tags[tag] = (tags[tag] || 0) + 1
      })
    }
  })
  return Object.entries(tags)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag)
}

export const checkEscalationFlags = (answers, categoryQuestions) => {
  const flagMessages = []
  categoryQuestions.forEach(q => {
    const answer = answers[q.id]
    if (answer && answer.escalation_flag) {
      flagMessages.push({
        message: `${q.question} — Response: ${answer.label}`,
        category: q.id
      })
    }
  })
  return flagMessages
}
