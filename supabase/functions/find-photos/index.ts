import { createClient } from 'npm:@supabase/supabase-js@2'
import { encodeBase64 } from 'jsr:@std/encoding@1/base64'
import { corsFor } from '../_shared/cors.ts'
import { requireUser, json, errorResponse } from '../_shared/auth.ts'
import { takeDailyUse } from '../_shared/quota.ts'
import { cfg } from '../_shared/runtime-config.ts'

// Finds each separate photo on a picture of a whole album page (uploaded to the person's own private folder) with
// Google's Gemini model, and returns where each one is. The app crops them in the browser and the person chooses
// which to keep. Nothing is saved here.
const MODEL = cfg('GEMINI_TEXT_MODEL') ?? 'gemini-2.5-flash'
const FREE_DAILY = Number(cfg('ALBUM_SCAN_FREE_DAILY') ?? '3')
const PRO_DAILY = Number(cfg('ALBUM_SCAN_PRO_DAILY') ?? '30')
const MAX_BYTES = 8 * 1024 * 1024
const BUCKETS = new Set(['family-photos', 'media-uploads'])

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    photos: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          box_2d: { type: 'ARRAY', items: { type: 'INTEGER' } },
          turn: { type: 'INTEGER', enum: [0, 90, 180, 270] },
        },
        required: ['box_2d', 'turn'],
      },
    },
  },
  required: ['photos'],
}

const PROMPT = [
  'This is a picture of a page from a family photo album, or of several prints laid on a table.',
  'Find every separate photograph on it. Ignore captions, stickers, corners and the album page itself.',
  'For each photograph give box_2d as [ymin, xmin, ymax, xmax], scaled from 0 to 1000, tightly around the print.',
  'turn: the clockwise rotation in degrees (0, 90, 180 or 270) that would make that photo upright.',
  'If the picture shows a single photo, return just that one. If there are no photographs, return an empty list.',
].join(' ')

Deno.serve(async (req) => {
  const cors = corsFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405, cors)
  try {
    const user = await requireUser(req)
    const { bucket = 'family-photos', path } = await req.json()
    if (!BUCKETS.has(bucket) || typeof path !== 'string' || !path.startsWith(`${user.id}/`) || path.includes('..')) {
      return json({ error: 'That photo could not be found.' }, 400, cors)
    }
    const apiKey = cfg('GEMINI_API_KEY')
    if (!apiKey) return json({ error: 'Album scanning is not switched on yet.' }, 503, cors)

    const use = await takeDailyUse(user.id, 'album-scan', FREE_DAILY, PRO_DAILY, 'album pages')
    if (!use.ok) return json({ error: use.message, code: use.pro ? 'LIMIT_REACHED' : 'UPGRADE_REQUIRED' }, 429, cors)
    const fail = async (status: number, error: string, code?: string) => { await use.refund(); return json({ error, ...(code ? { code } : {}) }, status, cors) }

    const db = createClient(cfg('SUPABASE_URL') ?? '', cfg('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const { data: file, error: dlError } = await db.storage.from(bucket).download(path)
    if (dlError || !file) return await fail(404, 'That photo could not be found.')
    if (file.size > MAX_BYTES) return await fail(413, 'Please use a photo smaller than 8 MB.')
    const mimeType = file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg'
    const data = encodeBase64(new Uint8Array(await file.arrayBuffer()))

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      signal: AbortSignal.timeout(60000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType, data } }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0 },
      }),
    })
    if (r.status === 429 || r.status === 403) {
      console.error('find-photos: Gemini refused', r.status, (await r.text()).slice(0, 300))
      return await fail(503, 'Album scanning is being switched on and will be ready soon. Please check back shortly.', 'PROVIDER_LIMIT')
    }
    if (!r.ok) {
      console.error('find-photos: Gemini error', r.status, (await r.text()).slice(0, 300))
      return await fail(502, 'The album page could not be scanned. Please try again.')
    }
    const text = (await r.json())?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
    let found: { photos?: unknown }
    try { found = JSON.parse(text) } catch { return await fail(502, 'The album page could not be scanned. Please try again.') }
    return json({ photos: Array.isArray(found?.photos) ? found.photos.slice(0, 30) : [] }, 200, cors)
  } catch (e) {
    return errorResponse(e, cors)
  }
})
