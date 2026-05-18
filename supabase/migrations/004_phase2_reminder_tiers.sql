-- Migration: phase2_reminder_tiers
--
-- Replaces the single-email phase 2 reminder with a tiered 3-email sequence:
--   Tier 1: 36-72 hrs after Phase 1 (the original full-length pitch)
--   Tier 2: 48+ hrs after tier 1     ("Maybe you missed my last email")
--   Tier 3: 72+ hrs after tier 2     ("If I gave you a pill...")
--
-- After tier 3, we stop. We also stop immediately if:
--   - The user opted out (opted_in = false on users row)
--   - The user completed Phase 2 (any user_protocols row exists)
--
-- The eligibility helper now returns the tier the user should get NEXT, so
-- the edge function dispatches one of three email bodies.

-- Drop the old single-tier signature so we can change the return-column list.
drop function if exists public.eligible_for_phase2_reminder();

-- Expand the email_events.event_type CHECK so we can log the new tiered
-- reminders + unsubscribe events. Existing values stay valid.
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
    -- new phase 2 reminder sequence
    'phase2_reminder_sent',         -- legacy single tier (pre-2026-05-18)
    'phase2_reminder_1_sent',
    'phase2_reminder_2_sent',
    'phase2_reminder_3_sent',
    'reminder_unsubscribed'
  ));

create or replace function public.eligible_for_phase2_reminder()
returns table (
  id uuid,
  email text,
  name text,
  chrono_age int,
  true_health_age int,
  age_diff int,
  tier int
)
language sql
security definer
set search_path = public
as $$
  with phase1 as (
    select
      u.id,
      u.email,
      u.name,
      q.chrono_age,
      q.true_health_age,
      q.age_diff,
      q.created_at as phase1_completed_at,
      (
        select max(created_at) from public.email_events e
        where e.user_id = u.id and e.event_type = 'phase2_reminder_1_sent'
      ) as tier1_created_at,
      (
        select max(created_at) from public.email_events e
        where e.user_id = u.id and e.event_type = 'phase2_reminder_2_sent'
      ) as tier2_created_at,
      (
        select max(created_at) from public.email_events e
        where e.user_id = u.id and e.event_type = 'phase2_reminder_3_sent'
      ) as tier3_created_at
    from public.users u
    join lateral (
      select chrono_age, true_health_age, age_diff, created_at
      from public.quiz_results
      where user_id = u.id
      order by created_at desc
      limit 1
    ) q on true
    where
      -- Never email opted-out users
      coalesce(u.opted_in, true) = true
      -- Never email users who completed Phase 2 (have a protocol assigned)
      and not exists (select 1 from public.user_protocols p where p.user_id = u.id)
  )
  select
    id, email, name, chrono_age, true_health_age, age_diff,
    case
      when tier1_created_at is null
        and phase1_completed_at between now() - interval '72 hours' and now() - interval '36 hours'
        then 1
      when tier1_created_at is not null
        and tier2_created_at is null
        and tier1_created_at < now() - interval '48 hours'
        then 2
      when tier2_created_at is not null
        and tier3_created_at is null
        and tier2_created_at < now() - interval '72 hours'
        then 3
      else null
    end as tier
  from phase1
  where
    case
      when tier1_created_at is null
        and phase1_completed_at between now() - interval '72 hours' and now() - interval '36 hours'
        then 1
      when tier1_created_at is not null
        and tier2_created_at is null
        and tier1_created_at < now() - interval '48 hours'
        then 2
      when tier2_created_at is not null
        and tier3_created_at is null
        and tier2_created_at < now() - interval '72 hours'
        then 3
      else null
    end is not null;
$$;

comment on function public.eligible_for_phase2_reminder is
  'Returns users due for their next phase 2 reminder. Tier 1 = first reminder 36-72h post Phase 1. Tier 2 = follow-up 48h+ after tier 1. Tier 3 = final 72h+ after tier 2. Stops after tier 3 OR if user completes Phase 2 OR opts out.';
