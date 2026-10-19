import { createClient } from 'npm:@supabase/supabase-js@2'
import { encodeBase64 } from 'jsr:@std/encoding@1/base64'
import { corsFor } from '../_shared/cors.ts'
import { requireUser, json, errorResponse } from '../_shared/auth.ts'
import { takeDailyUse } from '../_shared/quota.ts'
import { cfg } from '../_shared/runtime-config.ts'

// Estimates when an old photo the person uploaded to their own private folder was taken, with Google's Gemini model:
// a range of years and the clues behind it (clothing, hair, the kind of print, cars, buildings). It is always a guess,
// and the app says so. Nothing is saved here.
const MODEL = cfg('GEMINI_TEXT_MODEL') ?? 'gemini-2.5-flash'
const FREE_DAILY = Number(cfg('DATE_PHOTO_FREE_DAILY') ?? '5')
const PRO_DAILY = Number(cfg('DATE_PHOTO_PRO_DAILY') ?? '50')
const MAX_BYTES = 8 * 1024 * 1024
const BUCKETS = new Set(['family-photos', 'media-uploads'])
const LANG_NAME: Record<string, string> = { en: 'English', fr: 'Canadian French' }

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    earliest: { type: 'INTEGER' },
    latest: { type: 'INTEGER' },
    confidence: { type: 'STRING', enum: ['low', 'medium', 'high'] },
    clues: { type: 'ARRAY', items: { type: 'STRING' } },
    written_date: { type: 'STRING' },
    not_a_photo: { type: 'BOOLEAN' },
  },
  required: ['earliest', 'latest', 'confidence', 'clues', 'not_a_photo'],
}

const prompt = (lang: string) => [
  'Estimate when this family photograph was taken.',
  'earliest and latest: the range of years it was most likely taken in. Keep the range honest: wide (20 years or more) when the clues are weak.',
  'confidence: how sure the estimate is.',
  `clues: up to five short points in ${LANG_NAME[lang]} about what in the picture points to that time, such as clothing, hairstyles, the type of photo or print, cars, furniture or buildings.`,
  'written_date: a date or year printed or written on the photo, exactly as shown, or empty.',
  'not_a_photo: true if this is not a photograph (for example a document or a drawing).',
  'Do not guess who the people are, their ages, ethnicity or relationships.',
].join(' ')

Deno.serve(async (req) => {
  const cors = corsFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405, cors)
  try {
    const user = await requireUser(req)
    const { bucket = 'family-photos', path, lang = 'en' } = await req.json()
    if (!BUCKETS.has(bucket) || typeof path !== 'string' || !path.startsWith(`${user.id}/`) || path.includes('..')) {
      return json({ error: 'That photo could not be found.' }, 400, cors)
    }
    const apiKey = cfg('GEMINI_API_KEY')
    if (!apiKey) return json({ error: 'Photo dating is not switched on yet.' }, 503, cors)

    const use = await takeDailyUse(user.id, 'photo-date', FREE_DAILY, PRO_DAILY, 'photo dates')
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
        contents: [{ parts: [{ text: prompt(lang === 'fr' ? 'fr' : 'en') }, { inline_data: { mime_type: mimeType, data } }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0 },
      }),
    })
    if (r.status === 429 || r.status === 403) {
      console.error('date-photo: Gemini refused', r.status, (await r.text()).slice(0, 300))
      return await fail(503, 'Photo dating is being switched on and will be ready soon. Please check back shortly.', 'PROVIDER_LIMIT')
    }
    if (!r.ok) {
      console.error('date-photo: Gemini error', r.status, (await r.text()).slice(0, 300))
      return await fail(502, 'The photo could not be dated. Please try a different photo.')
    }
    const text = (await r.json())?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
    let estimate: unknown
    try { estimate = JSON.parse(text) } catch { return await fail(502, 'The photo could not be dated. Please try a different photo.') }
    return json({ estimate }, 200, cors)
  } catch (e) {
    return errorResponse(e, cors)
  }
})
