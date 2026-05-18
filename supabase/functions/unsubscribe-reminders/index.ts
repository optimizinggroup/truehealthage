// Edge Function: unsubscribe-reminders
//
// Public, no-auth-required endpoint that handles the one-click "unsubscribe"
// link in our reminder emails. We embed a signed HMAC token in every email
// link so this endpoint can verify the request is legitimate (only the
// holder of UNSUBSCRIBE_SECRET could have generated it for that user_id).
//
// On valid request: sets users.opted_in = false. The SQL eligibility helper
// excludes any user with opted_in = false, so all future reminders stop.
//
// URL format:
//   /unsubscribe-reminders?uid=<user_id>&token=<hmac-sha256-hex>
//
// Returns: simple HTML confirmation page (no JS, no React). Renders in the
// user's email-client browser without any dependencies.
//
// Deploy:
//   supabase functions deploy unsubscribe-reminders --no-verify-jwt
// Secrets:
//   UNSUBSCRIBE_SECRET  — random string used to sign tokens. Must match the
//                         value used by phase2-reminder when generating links.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const UNSUBSCRIBE_SECRET = Deno.env.get('UNSUBSCRIBE_SECRET')!

async function verifyToken(userId: string, token: string): Promise<boolean> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(UNSUBSCRIBE_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(userId))
  const expected = Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  // Constant-time comparison
  if (token.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ expected.charCodeAt(i)
  return diff === 0
}

function html(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

function page(headline: string, message: string, accent = '#0D9488') {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${headline}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1f2937; margin: 0; padding: 0; }
  .wrap { max-width: 480px; margin: 80px auto; padding: 40px 28px; background: #fff; border-radius: 14px; border-top: 6px solid ${accent}; box-shadow: 0 4px 16px rgba(0,0,0,0.05); text-align: center; }
  h1 { font-size: 1.4rem; margin: 0 0 14px; color: ${accent}; }
  p { font-size: 1rem; line-height: 1.6; color: #4b5563; margin: 0 0 12px; }
  .signature { margin-top: 28px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 0.95rem; color: #6b7280; font-style: italic; }
  a { color: ${accent}; }
</style>
</head>
<body>
  <div class="wrap">
    <h1>${headline}</h1>
    ${message}
    <div class="signature">— Coach K · TrueHealth Protocols</div>
  </div>
</body>
</html>`
}

Deno.serve(async (req) => {
  const url = new URL(req.url)
  const uid = url.searchParams.get('uid')
  const token = url.searchParams.get('token')

  if (!uid || !token) {
    return html(page('Invalid link', '<p>This unsubscribe link is missing parameters. Reply to any of our emails and we will remove you manually.</p>', '#dc2626'), 400)
  }

  let valid = false
  try {
    valid = await verifyToken(uid, token)
  } catch (_) {
    valid = false
  }

  if (!valid) {
    return html(page('Invalid link', '<p>This unsubscribe link could not be verified. Reply to any of our emails and we will remove you manually.</p>', '#dc2626'), 400)
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })

  const { error: updateErr } = await admin
    .from('users')
    .update({ opted_in: false })
    .eq('id', uid)

  if (updateErr) {
    return html(page('Something went wrong', `<p>We couldn't update your preferences. Please reply to the email and we'll handle this manually.</p>`, '#dc2626'), 500)
  }

  // Log the opt-out so we have an audit trail
  try {
    await admin.from('email_events').insert({
      user_id: uid,
      event_type: 'reminder_unsubscribed',
    })
  } catch (_) { /* non-fatal */ }

  return html(page(
    "You're unsubscribed",
    `<p>You won't receive any more coaching reminders from me.</p>
     <p>If this was a mistake or you want back in later, reply to any TrueHealth email and I'll re-enable it for you.</p>
     <p>Either way — I appreciate you giving the assessment a shot. Take care of yourself.</p>`,
    '#0D9488',
  ))
})
