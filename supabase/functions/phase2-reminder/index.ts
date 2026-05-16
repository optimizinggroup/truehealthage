// Edge Function: phase2-reminder
//
// Sends a reminder email to users who completed Phase 1 but never finished
// Phase 2 (no user_protocols row written) within a 36-72 hour window after
// signup. Goal: drive Phase 2 completion → unlock the personalized coaching
// program → improve overall compliance.
//
// TRIGGERS
// --------
// Designed to be called by Supabase's pg_cron once daily (e.g. 10am ET).
// SQL setup:
//   select cron.schedule(
//     'phase2-reminder-daily',
//     '0 14 * * *',     -- 14:00 UTC = 10am ET
//     $$
//       select net.http_post(
//         url:='https://ssckphhvxftbhpylhfmy.supabase.co/functions/v1/phase2-reminder',
//         headers:='{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
//       );
//     $$
//   );
//
// Can also be invoked manually for testing:
//   curl -X POST https://ssckphhvxftbhpylhfmy.supabase.co/functions/v1/phase2-reminder \
//     -H "Authorization: Bearer $SERVICE_ROLE_KEY"
//
// SECRETS REQUIRED
//   RESEND_API_KEY        (already set for send-welcome-email)
//   WELCOME_FROM          (already set for send-welcome-email)
//   APP_URL               (e.g. https://app.truehealthage.com)
//
// Deploy:
//   supabase functions deploy phase2-reminder --project-ref ssckphhvxftbhpylhfmy
//
// SAFETY
// ------
// - Logs to email_events to prevent re-sending. We only send phase2_reminder
//   once per user.
// - 36-72 hour window so we don't spam users mid-flow, and we don't chase
//   people who signed up 2 weeks ago.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const WELCOME_FROM = Deno.env.get('WELCOME_FROM') || 'Coach K <coach@truehealthage.com>'
const APP_URL = Deno.env.get('APP_URL') || 'https://app.truehealthage.com'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    // Find users who:
    //   1) Completed Phase 1 between 36 and 72 hours ago (have a quiz_results row)
    //   2) Have NO user_protocols row (never finished Phase 2 priority pick)
    //   3) Haven't been sent a phase2_reminder yet
    // The 36-72 hour window strikes a balance: long enough that they've had
    // time to come back on their own, short enough to still be relevant.
    const { data: candidates, error: queryError } = await admin.rpc('eligible_for_phase2_reminder')

    if (queryError) {
      console.error('Query failed:', queryError)
      return json({ error: 'Query failed', details: queryError.message }, 500)
    }

    if (!candidates || candidates.length === 0) {
      return json({ ok: true, sent: 0, message: 'No eligible users' }, 200)
    }

    let sent = 0
    let failed = 0
    for (const u of candidates) {
      try {
        await sendReminderEmail(admin, u)
        sent++
      } catch (err) {
        console.warn('Failed to send to', u.email, err)
        failed++
      }
    }

    return json({ ok: true, sent, failed, total_candidates: candidates.length }, 200)
  } catch (err) {
    console.error('Unexpected error:', err)
    return json({ error: 'unexpected', message: (err as Error).message }, 500)
  }
})

async function sendReminderEmail(admin: any, user: { id: string; email: string; name: string | null; chrono_age: number; true_health_age: number; age_diff: number }) {
  const firstName = (user.name || user.email).split(/[\s@]/)[0] || 'there'
  const ageGap = user.age_diff
  const direction = ageGap > 0 ? 'older' : 'younger'

  const subject = ageGap > 0
    ? `${firstName}, your free coaching program is still waiting`
    : `${firstName}, let's keep that lead — your free coaching is waiting`

  const text = `Hi ${firstName},

You took the TrueHealth Age assessment and learned your body is running ${Math.abs(ageGap)} years ${direction} than the calendar says.

That number isn't a verdict — it's a starting line.

I set aside a FREE personalized health coaching program for everyone who completes the assessment, and your spot is still open. But I only have a limited number of spots, and I want to make sure the people who actually use it get one.

It takes about 5 minutes. You'll get:
  - A personalized plan in the area that matters most to you
  - Three small daily actions — not 30
  - A weekly check-in I do with every member
  - Weekly emails from me (you'll get one tomorrow either way)

Pick up where you left off:
  → ${APP_URL}

If this isn't for you, no hard feelings — you can ignore this email. But if you've been on the fence, this is your nudge.

— Coach K
TrueHealth Protocols

---
You're getting this because you completed the TrueHealth Age assessment but didn't finish the coaching setup. We only send this reminder once.
`

  const html = text
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>')
    .replace(/→ (https?:\/\/\S+)/g, '<a href="$1" style="background:#0D9488;color:#fff;padding:14px 30px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;margin:10px 0">Pick up where you left off →</a>')
  const htmlWrapped = `<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:20px;line-height:1.55;color:#1f2937"><p>${html}</p></div>`

  const resendResp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: WELCOME_FROM,
      to: user.email,
      subject,
      text,
      html: htmlWrapped,
    }),
  })

  if (!resendResp.ok) {
    const body = await resendResp.text()
    throw new Error(`Resend ${resendResp.status}: ${body}`)
  }

  // Log so we never re-send to the same user
  await admin.from('email_events').insert({
    user_id: user.id,
    event_type: 'phase2_reminder_sent',
    sent_at: new Date().toISOString(),
  })
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
