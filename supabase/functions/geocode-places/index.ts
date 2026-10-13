import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsFor } from '../_shared/cors.ts'
import { requireUser, json, errorResponse } from '../_shared/auth.ts'
import { cfg } from '../_shared/runtime-config.ts'

// Turns place names ("Oaxaca, México") into map coordinates for the family map.
// Uses OpenStreetMap Nominatim (free; at most 1 request per second, with a real contact address) and a shared
// cache, so each place is only ever looked up once for everyone.
const MAX_LOOKUPS_PER_CALL = 20
const DAILY_LOOKUPS = Number(cfg('GEOCODE_DAILY_LIMIT') ?? '500')
const UA = `GenesisHeritage/1.0 (${cfg('CONTACT_EMAIL') ?? 'contact-not-set'})`
const key = (place: string) => place.trim().toLowerCase().replace(/\s+/g, ' ')
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

Deno.serve(async (req) => {
  const cors = corsFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405, cors)
  try {
    const user = await requireUser(req)
    const { places } = await req.json()
    if (!Array.isArray(places)) return json({ error: 'places must be a list' }, 400, cors)
    const wanted = [...new Map(places
      .filter((p): p is string => typeof p === 'string' && p.trim().length > 1 && p.length <= 200)
      .map((p) => [key(p), p.trim()])).entries()].slice(0, 300)

    const db = createClient(cfg('SUPABASE_URL') ?? '', cfg('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const { data: cached, error } = await db.from('place_geocodes').select('place_key,lat,lon,display_name,country_code').in('place_key', wanted.map(([k]) => k))
    if (error) throw error
    const results: Record<string, { lat: number | null; lon: number | null; name: string | null }> = {}
    for (const c of cached ?? []) results[c.place_key] = { lat: c.lat, lon: c.lon, name: c.display_name }

    const missing = wanted.filter(([k]) => !(k in results))
    let looked = 0
    for (const [k, place] of missing.slice(0, MAX_LOOKUPS_PER_CALL)) {
      const { data: ok } = await db.rpc('consume_daily_quota', { p_user: user.id, p_kind: 'geocode', p_limit: DAILY_LOOKUPS })
      if (!ok) break
      if (looked++) await sleep(1100) // Nominatim's usage policy: one request per second
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&q=${encodeURIComponent(place)}`
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en' } })
      if (!res.ok) break
      const hit = (await res.json())?.[0]
      const row = {
        place_key: k, place,
        lat: hit ? Number(hit.lat) : null, lon: hit ? Number(hit.lon) : null,
        display_name: hit?.display_name ?? null, country_code: hit?.address?.country_code ?? null,
      }
      await db.from('place_geocodes').upsert(row)
      results[k] = { lat: row.lat, lon: row.lon, name: row.display_name }
    }
    const pending = wanted.filter(([k]) => !(k in results)).length
    return json({ results, pending }, 200, cors)
  } catch (e) {
    return errorResponse(e, cors)
  }
})
