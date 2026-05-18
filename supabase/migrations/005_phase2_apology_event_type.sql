-- Add phase2_apology_sent to the email_events.event_type allowlist so the
-- one-shot apology function (phase2-apology) can log successful sends.
-- Lesson learned from the original phase2-reminder bug.
alter table public.email_events drop constraint if exists email_events_event_type_check;
alter table public.email_events add constraint email_events_event_type_check
  check (event_type in (
    'welcome_sent',
    'results_sent',
    'action_plan_sent',
    'retake_reminder_sent',
    'reclaimed_years_sent',
    'podcast_promo_sent',
    'waitlist_confirm_sent',
    'opened',
    'clicked',
    'unsubscribed',
    'bounced',
    'complained',
    'phase2_reminder_sent',
    'phase2_reminder_1_sent',
    'phase2_reminder_2_sent',
    'phase2_reminder_3_sent',
    'reminder_unsubscribed',
    'phase2_apology_sent'
  ));
