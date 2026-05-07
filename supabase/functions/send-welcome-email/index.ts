// Edge Function: send-welcome-email
// Triggered by the React app right after a user finishes Phase 1 + creates an
// account. Reads the quiz result, builds a personalized welcome email in
// Coach K's voice, sends via Resend, logs to email_events.
//
// Deploy: supabase functions deploy send-welcome-email --project-ref ssckphhvxftbhpylhfmy
// Secrets: supabase secrets set RESEND_API_KEY=re_...  WELCOME_FROM='Coach K <coach@truehealthage.com>'

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const WELCOME_FROM = Deno.env.get('WELCOME_FROM') || 'Coach K <coach@truehealthage.com>'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
  user_id: string
  result_id?: string | null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, result_id } = (await req.json()) as RequestBody
    if (!user_id) {
      return json({ error: 'user_id required' }, 400)
    }

    // Service-role client to read across RLS
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    const { data: user, error: userErr } = await admin
      .from('users')
      .select('id, email, name')
      .eq('id', user_id)
      .single()

    if (userErr || !user) {
      return json({ error: 'user lookup failed', details: userErr }, 404)
    }

    let result: { true_health_age: number; chrono_age: number; age_diff: number; grade: string; result_label: string } | null = null
    if (result_id) {
      const { data } = await admin
        .from('quiz_results')
        .select('true_health_age, chrono_age, age_diff, grade, result_label')
        .eq('id', result_id)
        .single()
      result = data
    }

    const subject = result
      ? `${user.name?.split(' ')[0] || 'there'} — your True Health Age is ${result.true_health_age}`
      : `Welcome to TrueHealthAge`

    const html = renderWelcomeEmail({ name: user.name || 'there', result })

    // Resend send
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: WELCOME_FROM,
        to: [user.email],
        subject,
        html,
      }),
    })

    const resendBody = await resendRes.json()
    if (!resendRes.ok) {
      // Log the failure to email_events so it's visible in dashboards
      await admin.from('email_events').insert({
        user_id: user.id,
        result_id: result_id || null,
        event_type: 'welcome_sent',
        email_subject: subject,
        metadata: { error: resendBody, status: resendRes.status },
      })
      return json({ error: 'resend send failed', details: resendBody }, 502)
    }

    await admin.from('email_events').insert({
      user_id: user.id,
      result_id: result_id || null,
      event_type: 'welcome_sent',
      email_subject: subject,
      resend_id: resendBody.id,
    })

    return json({ ok: true, resend_id: resendBody.id }, 200)
  } catch (err) {
    return json({ error: 'unexpected', message: (err as Error).message }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function renderWelcomeEmail(opts: {
  name: string
  result: { true_health_age: number; chrono_age: number; age_diff: number; grade: string; result_label: string } | null
}): string {
  const firstName = opts.name.split(' ')[0]
  const resultBlock = opts.result
    ? `
        <p style="font-size: 18px; line-height: 1.6;">
          Your True Health Age came in at <strong>${opts.result.true_health_age}</strong> —
          ${opts.result.age_diff < 0 ? `${Math.abs(opts.result.age_diff)} years younger` : opts.result.age_diff > 0 ? `${opts.result.age_diff} years older` : 'right at'}
          your chronological age of ${opts.result.chrono_age}.
        </p>
        <p style="font-size: 18px; line-height: 1.6;">
          Grade: <strong>${opts.result.grade}</strong> — ${opts.result.result_label}.
        </p>`
    : ''

  return `<!doctype html>
<html><body style="margin:0; padding:0; background:#f6f8fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color:#222;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding: 24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:white; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
        <tr><td style="padding: 32px 32px 8px;">
          <h1 style="margin:0; color:#0D9488; font-size: 28px;">Welcome, ${firstName}.</h1>
          <p style="font-size: 16px; color: #666; margin: 4px 0 24px;">— Coach K</p>
          ${resultBlock}
          <p style="font-size: 16px; line-height: 1.6;">
            I'm glad you took the first step. Most people don't. The fact that you finished
            the assessment tells me you're serious about understanding where your health
            actually stands — and that's the hard part.
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            Here's what happens next: I'll send you a check-in at the end of your first week
            with one small action — based on whichever area you chose to start with.
            One. Not a list. Small wins compound, big plans collapse.
          </p>
          <p style="font-size: 16px; line-height: 1.6;">
            If you have questions, just reply to this email. It comes to me directly.
          </p>

          <!-- Newsletter soft mention - users not opted-in already get this -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0 8px; background: #f0fdfa; border-left: 3px solid #0D9488; border-radius: 6px;">
            <tr><td style="padding: 14px 16px;">
              <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #0D9488;">
                Want longevity content between check-ins?
              </p>
              <p style="margin: 0 0 10px; font-size: 14px; line-height: 1.55; color: #2d3748;">
                I send the <strong>TrueHealth Protocols</strong> newsletter once or twice a week — the science behind what you're working on, in plain language. And later this year, the podcast launches under the same name.
              </p>
              <a href="https://truehealthprotocols.beehiiv.com/subscribe?utm_source=welcome_email&utm_medium=email&utm_campaign=onboarding"
                 style="display: inline-block; padding: 8px 14px; background: #0D9488; color: white; text-decoration: none; border-radius: 6px; font-size: 13px; font-weight: 600;">
                Subscribe — it's free
              </a>
            </td></tr>
          </table>

          <!-- Feedback prompt - powers podcast research pipeline -->
          <p style="font-size: 14px; color: #4b5563; line-height: 1.55; margin: 20px 0 8px;">
            <em>One question for you:</em> what topic are you hoping I cover most? Reply with one word — sleep, stress, nutrition, energy, anything. It helps me write what you actually need.
          </p>

          <p style="font-size: 16px; line-height: 1.6; margin-top: 32px;">
            Talk soon,<br/>
            <strong>Coach K</strong>
          </p>
        </td></tr>
        <tr><td style="padding: 16px 32px 24px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
          You're getting this because you completed your True Health Age assessment at truehealthage.com.
          This email is educational and not medical advice — please consult your healthcare provider for medical concerns.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}
