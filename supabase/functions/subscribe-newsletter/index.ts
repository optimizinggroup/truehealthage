// Edge Function: subscribe-newsletter
// Subscribes a user to the "TrueHealth Protocols" Beehiiv publication.
//
// Triggered from the frontend (EmailCapture or a "Subscribe" button later)
// when a user opts in. Beehiiv handles deduplication — re-subscribing an
// existing email is a no-op as long as reactivate_existing is false.
//
// Deploy: supabase functions deploy subscribe-newsletter
// Secrets:
//   BEEHIIV_API_KEY            (set via supabase secrets set)
//   BEEHIIV_PUBLICATION_ID     (set via supabase secrets set)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BEEHIIV_API_KEY = Deno.env.get('BEEHIIV_API_KEY')!
const BEEHIIV_PUBLICATION_ID = Deno.env.get('BEEHIIV_PUBLICATION_ID')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
  email?: string
  user_id?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  // Optional context tag — the user's first chosen protocol category, so
  // the newsletter can later send segment-specific content.
  focus_area?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = (await req.json()) as RequestBody
    let { email, user_id, focus_area, utm_source, utm_medium, utm_campaign } = body

    // If no email but a user_id is given, look up email from auth/users
    if (!email && user_id) {
      const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
      const { data: profile } = await admin
        .from('users')
        .select('email, name')
        .eq('id', user_id)
        .single()
      if (profile?.email) email = profile.email
    }

    if (!email) {
      return json({ error: 'email or user_id required' }, 400)
    }

    // Build Beehiiv subscription payload
    const subscribeBody: Record<string, unknown> = {
      email,
      reactivate_existing: false,        // don't auto-revive unsubscribed users
      send_welcome_email: false,         // we send our own welcome from Coach K
      utm_source: utm_source || 'truehealthage_app',
      utm_medium: utm_medium || 'web',
      utm_campaign: utm_campaign || 'signup',
    }
    if (focus_area) {
      // Beehiiv supports custom_fields and tags; tags are simpler for segmentation.
      subscribeBody.custom_fields = [
        { name: 'focus_area', value: focus_area },
      ]
    }

    const beehiivRes = await fetch(
      `https://api.beehiiv.com/v2/publications/${BEEHIIV_PUBLICATION_ID}/subscriptions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${BEEHIIV_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscribeBody),
      }
    )

    const beehiivBody = await beehiivRes.json()
    if (!beehiivRes.ok) {
      // Beehiiv returns 400 for "already subscribed" in some configurations —
      // surface as success so the user doesn't see an error if they re-subscribe.
      const alreadySubscribed = beehiivBody?.errors?.[0]?.code === 'ALREADY_SUBSCRIBED'
      if (alreadySubscribed) {
        return json({ ok: true, already_subscribed: true }, 200)
      }
      return json({ error: 'beehiiv subscribe failed', details: beehiivBody, status: beehiivRes.status }, 502)
    }

    return json({
      ok: true,
      subscription_id: beehiivBody?.data?.id,
      status: beehiivBody?.data?.status,
    }, 200)
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
