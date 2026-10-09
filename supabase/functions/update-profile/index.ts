import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsFor } from '../_shared/cors.ts'
import { requireUser, json, errorResponse } from '../_shared/auth.ts'

// Updates the caller's profile fields and records each change in their profile history.
const VALID_FIELDS = new Set([
  'name', 'ancestry', 'businessGoals', 'location', 'language', 'timezone',
  'culturalBackground', 'familyTraditions', 'businessType', 'industryFocus',
])
const MAX_LENGTH = 500

Deno.serve(async (req) => {
  const cors = corsFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405, cors)

  try {
    const user = await requireUser(req)
    const { updates, reason } = await req.json()
    if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
      return json({ error: 'No updates provided' }, 400, cors)
    }
    const clean: Record<string, string> = {}
    for (const [field, value] of Object.entries(updates as Record<string, unknown>)) {
      if (!VALID_FIELDS.has(field)) return json({ error: `Invalid field: ${field}` }, 400, cors)
      if (typeof value !== 'string' || value.length > MAX_LENGTH) {
        return json({ error: `${field} must be text of at most ${MAX_LENGTH} characters` }, 400, cors)
      }
      clean[field] = value.trim()
    }

    const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const { data: profile, error } = await db.rpc('update_user_profile_batch', {
      p_updates: clean,
      p_reason: typeof reason === 'string' && reason.trim() ? reason.trim().slice(0, 200) : 'User-initiated update',
      p_user_id: user.id,
    })
    if (error) throw error
    return json({ success: true, message: 'Profile updated successfully', profile }, 200, cors)
  } catch (e) {
    return errorResponse(e, cors)
  }
})
