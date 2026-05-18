// Edge Function: phase2-apology
//
// ONE-SHOT. Sends a brief apology email to the small test cohort that
// received the same Phase 2 reminder multiple days in a row due to a
// CHECK-constraint bug in the original phase2-reminder function (fixed
// 2026-05-18 via migration 004).
//
// Targets: any user with quiz_results older than 36 hours, no user_protocols
// row, opted_in = true, and no prior apology already logged.
//
// This function is intentionally not on a cron — invoke manually:
//   curl -X POST .../functions/v1/phase2-apology -H "Authorization: Bearer <service_role>"
//
// After running successfully it can be left deployed (no harm) or deleted.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const WELCOME_FROM = Deno.env.get('WELCOME_FROM') || 'Coach K <coach@truehealthage.com>'
const APP_URL = Deno.env.get('APP_URL') || 'https://app.truehealthage.com'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const UNSUBSCRIBE_SECRET = Deno.env.get('UNSUBSCRIBE_SECRET')!

async function signToken(userId: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(UNSUBSCRIBE_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(userId))
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

async function unsubscribeUrl(userId: string): Promise<string> {
  const token = await signToken(userId)
  return `${SUPABASE_URL}/functions/v1/unsubscribe-reminders?uid=${encodeURIComponent(userId)}&token=${token}`
}

function buildEmail(firstName: string, ctaUrl: string, unsubUrl: string) {
  const subject = `${firstName}, I owe you an apology — same email three days running`

  const text = `Hi ${firstName},

Quick note from me.

You may have gotten the same email from me three days in a row this past week. That isn't how this is supposed to work — there was a bug in our reminder system that caused duplicates while we were still working out the kinks with this early test group.

It's fixed now. Going forward, if you don't pick up your coaching program, you'll hear from me one more time after a couple of days, then once more a few days after that. Then I'll stop. No more daily emails. Promise.

If you've been on the fence about jumping in, your FREE personalized coaching plan is still waiting. No credit card, no catch — just a chance to take that True Health Age number and start moving it the right direction.

  ${ctaUrl}

And thank you for being one of the early testers. You helped catch this. That matters.

— Coach K
TrueHealth Protocols

---
Unsubscribe (one-click): ${unsubUrl}
You're getting this because you completed the TrueHealth Age assessment.`

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc">
<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#fff;line-height:1.6;color:#1f2937">
  <p style="margin:0 0 14px">Hi ${firstName},</p>
  <p style="margin:0 0 14px">Quick note from me.</p>
  <p style="margin:0 0 14px">You may have gotten the same email from me three days in a row this past week. That isn't how this is supposed to work — there was a bug in our reminder system that caused duplicates while we were still working out the kinks with this early test group.</p>
  <p style="margin:0 0 14px">It's fixed now. Going forward, if you don't pick up your coaching program, you'll hear from me one more time after a couple of days, then once more a few days after that. Then I'll stop. No more daily emails. Promise.</p>
  <p style="margin:0 0 14px">If you've been on the fence about jumping in, your FREE personalized coaching plan is still waiting. No credit card, no catch — just a chance to take that True Health Age number and start moving it the right direction.</p>
  <p style="text-align:center;margin:18px 0"><a href="${ctaUrl}" style="background:#0D9488;color:#fff;padding:14px 30px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">Get my FREE Coaching →</a></p>
  <p style="margin:0 0 14px">And thank you for being one of the early testers. You helped catch this. That matters.</p>
  <p style="margin:0 0 14px">— Coach K<br>TrueHealth Protocols</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 16px">
  <p style="font-size:12px;color:#6b7280;line-height:1.5;margin:0">
    You're getting this because you completed the TrueHealth Age assessment.
    <br>If you'd rather not receive any more emails,
    <a href="${unsubUrl}" style="color:#0D9488">unsubscribe with one click</a>.
  </p>
</div>
</body></html>`

  return { subject, text, html }
}

Deno.serve(async () => {
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  // Find users who: completed Phase 1 36+ hrs ago, have no protocol, are opted in,
  // and have NOT already received this apology email.
  const cutoff = new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()

  // Step 1 — get user_ids with old quiz_results
  const { data: phase1Users, error: e1 } = await admin
    .from('quiz_results')
    .select('user_id')
    .lt('created_at', cutoff)
  if (e1) return json({ error: 'phase1 query', details: e1.message }, 500)

  const userIds = [...new Set((phase1Users || []).map(r => r.user_id))]
  if (userIds.length === 0) return json({ ok: true, sent: 0, message: 'No candidates' })

  // Step 2 — exclude users who completed Phase 2
  const { data: withProtocols, error: e2 } = await admin
    .from('user_protocols')
    .select('user_id')
    .in('user_id', userIds)
  if (e2) return json({ error: 'protocols query', details: e2.message }, 500)
  const completedSet = new Set((withProtocols || []).map(r => r.user_id))
  const noProtocol = userIds.filter(id => !completedSet.has(id))

  // Step 3 — exclude users who already got the apology
  const { data: alreadySent, error: e3 } = await admin
    .from('email_events')
    .select('user_id')
    .eq('event_type', 'phase2_apology_sent')
    .in('user_id', noProtocol)
  if (e3) return json({ error: 'apology query', details: e3.message }, 500)
  const apologySet = new Set((alreadySent || []).map(r => r.user_id))
  const targets = noProtocol.filter(id => !apologySet.has(id))

  if (targets.length === 0) return json({ ok: true, sent: 0, message: 'All eligible users already received apology' })

  // Step 4 — fetch user emails / names + opted_in filter
  const { data: users, error: e4 } = await admin
    .from('users')
    .select('id, email, name, opted_in')
    .in('id', targets)
  if (e4) return json({ error: 'users query', details: e4.message }, 500)

  const recipients = (users || []).filter(u => u.opted_in !== false && !!u.email)

  let sent = 0
  let failed = 0
  const failures: { email: string; reason: string }[] = []

  for (const u of recipients) {
    const firstName = (u.name || u.email).split(/[\s@]/)[0] || 'there'
    const unsubUrl = await unsubscribeUrl(u.id)
    const { subject, text, html } = buildEmail(firstName, APP_URL, unsubUrl)

    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: WELCOME_FROM,
          to: u.email,
          subject,
          text,
          html,
          headers: {
            'List-Unsubscribe': `<${unsubUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }),
      })
      if (!resp.ok) {
        const body = await resp.text()
        failures.push({ email: u.email, reason: `Resend ${resp.status}: ${body.slice(0, 200)}` })
        failed++
        continue
      }
      await admin.from('email_events').insert({
        user_id: u.id,
        event_type: 'phase2_apology_sent',
        email_subject: subject,
      })
      sent++
    } catch (err) {
      failures.push({ email: u.email, reason: String(err) })
      failed++
    }
  }

  return json({
    ok: true,
    sent,
    failed,
    total_candidates: recipients.length,
    failures: failures.slice(0, 10),
  })
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}
