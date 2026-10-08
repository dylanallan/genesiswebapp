import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsFor } from '../_shared/cors.ts'
import { requireUser, json, errorResponse } from '../_shared/auth.ts'
import { searchAll } from '../_shared/records-connectors.ts'

serve(async (req) => {
  const cors = corsFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405, cors)
  try {
    await requireUser(req)
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
