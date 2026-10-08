import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsFor } from '../_shared/cors.ts'
import { json } from '../_shared/auth.ts'

// Email/password sign-in and sign-up through an Edge Function.
// Uses the public ANON key (never the service-role key) so Supabase Auth's own rate limits,
// email confirmation and password rules all apply exactly as they do from the browser.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

Deno.serve(async (req) => {
  const cors = corsFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors)

  try {
    const { email, password, isSignUp } = await req.json()
    if (typeof email !== 'string' || !EMAIL.test(email) || typeof password !== 'string' || password.length < 8 || password.length > 128) {
      return json({ error: 'A valid email and a password of 8-128 characters are required' }, 400, cors)
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data, error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Same message for unknown email and wrong password, so accounts can't be probed.
      const status = error.status && error.status >= 400 && error.status < 500 ? error.status : 400
      return json({ error: isSignUp ? error.message : 'Invalid email or password' }, status, cors)
    }
    return json({ user: data.user, session: data.session }, 200, cors)
  } catch (e) {
    console.error('auth function error:', e)
    return json({ error: 'Internal server error' }, 500, cors)
  }
})
