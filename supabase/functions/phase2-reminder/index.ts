// Edge Function: phase2-reminder
//
// Sends a 3-tier reminder sequence to users who completed Phase 1 but never
// finished Phase 2 (no user_protocols row). Each email body is different —
// long pitch → short follow-up → "pill" metaphor. After tier 3 we stop.
// Stops also if user opts out or completes Phase 2.
//
// Tier schedule (enforced by eligible_for_phase2_reminder() SQL helper):
//   Tier 1: 36-72 hrs after Phase 1
//   Tier 2: 48+ hrs after tier 1
//   Tier 3: 72+ hrs after tier 2
//
// Triggered daily by pg_cron at 14:00 UTC (10am ET).
//
// SECRETS REQUIRED
//   RESEND_API_KEY
//   WELCOME_FROM
//   APP_URL
//   UNSUBSCRIBE_SECRET — for signing one-click unsubscribe links

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const WELCOME_FROM = Deno.env.get('WELCOME_FROM') || 'Coach K <coach@truehealthage.com>'
const APP_URL = Deno.env.get('APP_URL') || 'https://app.truehealthage.com'
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const UNSUBSCRIBE_SECRET = Deno.env.get('UNSUBSCRIBE_SECRET')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface Candidate {
  id: string
  email: string
  name: string | null
  chrono_age: number
  true_health_age: number
  age_diff: number
  tier: number
}

// ─── HMAC token generator for one-click unsubscribe ──────────────────────
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

// ─── Email body builders ─────────────────────────────────────────────────
// Each returns { subject, text }. HTML wrapper is shared in sendEmail().

function tier1Email(c: Candidate) {
  const firstName = (c.name || c.email).split(/[\s@]/)[0] || 'there'
  const ageGap = c.age_diff
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
  - Weekly emails from me

Pick up where you left off:
  __CTA_URL__

— Coach K
TrueHealth Protocols`

  return { subject, text }
}

function tier2Email(c: Candidate) {
  const firstName = (c.name || c.email).split(/[\s@]/)[0] || 'there'

  const subject = `${firstName}, maybe you missed my last email`

  const text = `Hi ${firstName},

Maybe you missed my last email. I know it happens.

But I really do not want you to miss out on a FREE coaching program personalized to you.

It costs you nothing now and it will not cost you anything in the future. No credit card is required. This is just me trying to help you get healthy.

Start now:
  __CTA_URL__

— Coach K
TrueHealth Protocols`

  return { subject, text }
}

function tier3Email(c: Candidate) {
  const firstName = (c.name || c.email).split(/[\s@]/)[0] || 'there'

  const subject = `${firstName}, if I gave you a pill...`

  const text = `Hi ${firstName},

Maybe this week wasn't a great week to start. That's always the toughest part. STARTING.

I know it's like a diet or going to the gym — you always mean to go, but then life gets in the way and you don't.

If I gave you a pill and told you this pill will help you lose weight, gain muscle, have tons of energy, sleep better at night, have less stress, and feel happier every day — but there's one catch. You have to take it every day, and if you miss even one day, your entire health reverts back to the starting line.

You would probably say "SIGN ME UP."

That's what the TrueHealth Protocols can do. It just takes a little longer. But once you sign up, you'll start getting Micro-Wins that lead to BIG WINS — wins that can change your health and your life.

So please take the first step for FREE today and sign up.

  __CTA_URL__

— Coach K
TrueHealth Protocols`

  return { subject, text }
}

const BUILDERS = {
  1: tier1Email,
  2: tier2Email,
  3: tier3Email,
} as const

const EVENT_TYPES = {
  1: 'phase2_reminder_1_sent',
  2: 'phase2_reminder_2_sent',
  3: 'phase2_reminder_3_sent',
} as const

// ─── HTML wrapper (shared) ───────────────────────────────────────────────
function buildHtml(text: string, ctaUrl: string, unsubUrl: string): string {
  // Replace plain-text CTA placeholder with a styled button
  const bodyWithButton = text
    .replace('__CTA_URL__', `<a href="${ctaUrl}" style="background:#0D9488;color:#fff;padding:14px 30px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block;margin:12px 0">Get my FREE Coaching →</a>`)
    .replace(/\n\n/g, '</p><p style="margin:0 0 14px">')
    .replace(/\n/g, '<br/>')

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc">
<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#fff;line-height:1.6;color:#1f2937">
  <p style="margin:0 0 14px">${bodyWithButton}</p>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0 16px">
  <p style="font-size:12px;color:#6b7280;line-height:1.5;margin:0">
    You're getting this because you completed the TrueHealth Age assessment.
    <br>If you'd rather not receive these reminders,
    <a href="${unsubUrl}" style="color:#0D9488">unsubscribe with one click</a>.
    You'll be removed immediately.
  </p>
</div>
</body></html>`
}

// ─── Send a single reminder ──────────────────────────────────────────────
async function sendReminder(admin: any, c: Candidate): Promise<void> {
  const builder = BUILDERS[c.tier as 1 | 2 | 3]
  const eventType = EVENT_TYPES[c.tier as 1 | 2 | 3]
  if (!builder || !eventType) {
    throw new Error(`No builder for tier ${c.tier}`)
  }

  const { subject, text: textTemplate } = builder(c)
  const unsubUrl = await unsubscribeUrl(c.id)
  const ctaUrl = APP_URL  // could append a tier-specific UTM later

  const textWithUrl = textTemplate.replace('__CTA_URL__', ctaUrl)
  const textWithFooter = `${textWithUrl}

---
Unsubscribe (one-click): ${unsubUrl}
You're getting this because you completed the TrueHealth Age assessment.`

  const html = buildHtml(textTemplate, ctaUrl, unsubUrl)

  const resendResp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: WELCOME_FROM,
      to: c.email,
      subject,
      text: textWithFooter,
      html,
      // List-Unsubscribe headers for Gmail/Apple Mail one-click; many clients
      // expose this as a built-in unsubscribe link separate from our footer.
      headers: {
        'List-Unsubscribe': `<${unsubUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    }),
  })

  if (!resendResp.ok) {
    const body = await resendResp.text()
    throw new Error(`Resend ${resendResp.status}: ${body}`)
  }

  // Log so the SQL helper won't pick this user again for this tier
  await admin.from('email_events').insert({
    user_id: c.id,
    event_type: eventType,
    email_subject: subject,
  })
}

// ─── Main handler ────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

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
    const byTier = { 1: 0, 2: 0, 3: 0 } as Record<number, number>

    for (const c of candidates as Candidate[]) {
      try {
        await sendReminder(admin, c)
        sent++
        byTier[c.tier] = (byTier[c.tier] || 0) + 1
      } catch (err) {
        console.warn('Failed to send tier', c.tier, 'to', c.email, err)
        failed++
      }
    }

    return json({ ok: true, sent, failed, by_tier: byTier, total_candidates: candidates.length }, 200)
  } catch (err) {
    console.error('Unexpected error:', err)
    return json({ error: 'unexpected', message: (err as Error).message }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
