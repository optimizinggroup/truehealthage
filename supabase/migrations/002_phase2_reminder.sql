-- Migration: phase2_reminder support
--
-- Adds the SQL helper function that finds users eligible for a Phase 2
-- reminder email + schedules the daily cron that calls the edge function.
--
-- RUN ORDER:
--   1. Set RESEND_API_KEY, WELCOME_FROM, APP_URL as edge-function secrets:
--      supabase secrets set APP_URL=https://app.truehealthage.com
--   2. Deploy the edge function:
--      supabase functions deploy phase2-reminder
--   3. Run this migration in Supabase SQL Editor
--   4. Verify the cron job by querying cron.job
--
-- IDEMPOTENT — safe to re-run.

-- ─────────────────────────────────────────────────────────────────────────
-- Function: eligible_for_phase2_reminder
-- Returns users who completed Phase 1 between 36 and 72 hours ago and have
-- not (a) completed Phase 2 (no user_protocols row) and (b) been sent a
-- phase2_reminder yet (no email_events row of that type).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.eligible_for_phase2_reminder()
returns table (
  id uuid,
  email text,
  name text,
  chrono_age int,
  true_health_age int,
  age_diff int
)
language sql
security definer
set search_path = public
as $$
  select
    u.id,
    u.email,
    u.name,
    q.chrono_age,
    q.true_health_age,
    q.age_diff
  from public.users u
  join lateral (
    -- latest quiz_results for this user
    select chrono_age, true_health_age, age_diff, created_at
    from public.quiz_results
    where user_id = u.id
    order by created_at desc
    limit 1
  ) q on true
  where
    -- finished Phase 1 between 36 and 72 hours ago
    q.created_at between now() - interval '72 hours' and now() - interval '36 hours'
    -- has no active or graduated coaching protocol (never finished Phase 2 priority pick)
    and not exists (
      select 1 from public.user_protocols p where p.user_id = u.id
    )
    -- has not been sent a phase2_reminder yet
    and not exists (
      select 1 from public.email_events e
      where e.user_id = u.id and e.event_type = 'phase2_reminder_sent'
    )
    -- has not unsubscribed / opted out
    and coalesce(u.opted_in, true) = true;
$$;

comment on function public.eligible_for_phase2_reminder is
  'Returns users who completed Phase 1 36-72 hours ago, have no protocol assigned, and have not been sent a Phase 2 reminder yet. Called by the phase2-reminder edge function.';

-- ─────────────────────────────────────────────────────────────────────────
-- pg_cron schedule
-- Fires daily at 14:00 UTC (10am ET / 9am CT / 7am PT). pg_cron + pg_net
-- must be enabled at the Supabase Dashboard → Database → Extensions level
-- (both are available on free tier).
--
-- We post to the public edge-function URL with the service-role key. The
-- function reads candidates via the eligibility RPC and sends via Resend.
-- ─────────────────────────────────────────────────────────────────────────
-- Schedule (uncomment + replace SERVICE_ROLE_KEY after manual verification
-- of the function and SQL helper above):
--
-- select cron.unschedule('phase2-reminder-daily') where exists (
--   select 1 from cron.job where jobname = 'phase2-reminder-daily'
-- );
--
-- select cron.schedule(
--   'phase2-reminder-daily',
--   '0 14 * * *',
--   $$
--     select net.http_post(
--       url := 'https://ssckphhvxftbhpylhfmy.supabase.co/functions/v1/phase2-reminder',
--       headers := jsonb_build_object(
--         'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY_HERE',
--         'Content-Type', 'application/json'
--       ),
--       body := '{}'::jsonb
--     );
--   $$
-- );
--
-- IMPORTANT: do NOT commit the service-role key to git. Set the schedule
-- manually in the SQL Editor after deploy.
