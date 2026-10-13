import { corsFor } from '../_shared/cors.ts'
import { requireUser, json, errorResponse } from '../_shared/auth.ts'
import { searchAll } from '../_shared/records-connectors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { cfg } from '../_shared/runtime-config.ts'

// Generous for real research, far too low for anyone trying to bulk-copy the archives through us.
const DAILY_SEARCHES = Number(cfg('RECORDS_DAILY_LIMIT') ?? '300')

Deno.serve(async (req) => {
  const cors = corsFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405, cors)
  try {
    const user = await requireUser(req)
    const db = createClient(cfg('SUPABASE_URL') ?? '', cfg('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const { data: allowed, error: quotaError } = await db.rpc('consume_daily_quota', { p_user: user.id, p_kind: 'records-search', p_limit: DAILY_SEARCHES })
    if (quotaError) throw quotaError
    if (!allowed) return json({ error: `You've reached today's limit of ${DAILY_SEARCHES} record searches. It resets tomorrow.`, code: 'LIMIT_REACHED' }, 429, cors)
    const { name, place, year } = await req.json()
    if (typeof name !== 'string' || name.trim().length < 2 || name.length > 120) {
      return json({ error: 'Please enter a name of at least 2 characters' }, 400, cors)
    }
    const y = year === undefined || year === '' || year === null ? undefined : Number(year)
    if (y !== undefined && (!Number.isInteger(y) || y < 1000 || y > new Date().getFullYear())) {
      return json({ error: 'Year must be a valid year' }, 400, cors)
    }
    const outcome = await searchAll({
      name: name.trim(),
      place: typeof place === 'string' && place.trim() ? place.trim().slice(0, 80) : undefined,
      year: y,
    })
    return json(outcome, 200, cors)
  } catch (e) {
    return errorResponse(e, cors)
  }
})
