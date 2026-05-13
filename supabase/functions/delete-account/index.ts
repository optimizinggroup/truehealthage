// Edge Function: delete-account
//
// Apple App Store Review Guideline 5.1.1(v) requires apps that let users
// create accounts to also let them delete those accounts from inside the
// app. This function does the real deletion — wiping both public.users
// (which cascades to quiz_results, user_protocols, etc. via FK ON DELETE
// CASCADE) AND auth.users (so the email can be re-used to sign up later).
//
// Auth model:
//   - Client passes the user's bearer JWT (from the active Supabase session)
//   - We validate it server-side with an anon-key client to confirm whose
//     account they're asking to delete — that's the only account they can
//     touch. There is NO "delete arbitrary user" path here.
//   - We then use a service-role client (which bypasses RLS) to do the
//     actual auth.users delete via admin.deleteUser.
//
// Deploy:
//   supabase functions deploy delete-account --project-ref ssckphhvxftbhpylhfmy
//
// verify_jwt: true (default) — only signed-in users can call this.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'Missing or invalid Authorization header' }, 401)
    }
    const accessToken = authHeader.slice('Bearer '.length)

    // 1. Validate the caller's JWT to discover WHO they are.
    //    The anon-key client + the user's access token only allows
    //    auth-related lookups for that user.
    const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false },
    })

    const { data: { user }, error: userErr } = await anonClient.auth.getUser()
    if (userErr || !user?.id) {
      return json({ error: 'Could not verify caller identity', details: userErr }, 401)
    }

    const userId = user.id
    const userEmail = user.email

    // 2. Service-role client for the actual deletes.
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    })

    // 3. Delete the public.users row. FK ON DELETE CASCADE on quiz_results,
    //    user_protocols, protocol_checkins, email_events, share_events,
    //    waitlist will sweep everything else.
    const { error: pubErr } = await admin.from('users').delete().eq('id', userId)
    if (pubErr) {
      return json({ error: 'Failed to delete public.users row', details: pubErr }, 500)
    }

    // 4. Delete the auth.users row. This frees the email for re-signup.
    const { error: authErr } = await admin.auth.admin.deleteUser(userId)
    if (authErr) {
      return json({
        error: 'Failed to delete auth user — public data was already removed',
        details: authErr,
      }, 500)
    }

    return json({ ok: true, deleted_user_id: userId, deleted_email: userEmail }, 200)
  } catch (err) {
    return json({ error: 'Unexpected', message: (err as Error).message }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
