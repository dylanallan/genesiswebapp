import { createClient } from 'npm:@supabase/supabase-js@2'
import { encodeBase64 } from 'jsr:@std/encoding@1/base64'
import { corsFor } from '../_shared/cors.ts'
import { requireUser, json, errorResponse } from '../_shared/auth.ts'
import { takeDailyUse } from '../_shared/quota.ts'
import { cfg } from '../_shared/runtime-config.ts'

// Reads a photo of an old document the person uploaded to their own private folder (a baptism, marriage or burial
// record, a letter, a certificate) with Google's Gemini model: a faithful transcription, a plain-language translation
// into the reader's language, a short summary and the key facts. Nothing is saved here; the person checks the result
// and chooses what to add to their tree.
const MODEL = cfg('GEMINI_TEXT_MODEL') ?? 'gemini-2.5-flash'
const FREE_DAILY = Number(cfg('READ_DOC_FREE_DAILY') ?? '3')
const PRO_DAILY = Number(cfg('READ_DOC_PRO_DAILY') ?? '30')
const MAX_BYTES = 8 * 1024 * 1024
const BUCKETS = new Set(['family-photos', 'media-uploads'])
const LANG_NAME: Record<string, string> = { en: 'English', fr: 'Canadian French' }

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    kind: { type: 'STRING', enum: ['baptism', 'birth', 'marriage', 'burial', 'death', 'census', 'letter', 'other'] },
    language: { type: 'STRING' },
    transcription: { type: 'STRING' },
    translation: { type: 'STRING' },
    summary: { type: 'STRING' },
    date: { type: 'STRING' },
    place: { type: 'STRING' },
    people: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { name: { type: 'STRING' }, role: { type: 'STRING' } },
        required: ['name', 'role'],
      },
    },
    unclear: { type: 'BOOLEAN' },
  },
  required: ['kind', 'language', 'transcription', 'translation', 'summary', 'people', 'unclear'],
}

const prompt = (lang: string) => [
  'This is a photo of an old family document, such as a parish register entry (baptism, marriage or burial), a civil record, a census page or a letter.',
  'Many come from Quebec and are handwritten in old French or Latin.',
  'transcription: copy the text exactly as written, keeping the original spelling and line breaks. Write [?] for any word you cannot read. Never guess or invent words.',
  `translation: the same text in plain, modern ${LANG_NAME[lang]}, easy for someone who is not a genealogist.`,
  `summary: one or two sentences in ${LANG_NAME[lang]} saying what the document records.`,
  'kind: the type of record. date: the main event date as YYYY-MM-DD, or YYYY-MM or YYYY if only that is clear; leave it empty if the date is not written.',
  'place: the parish, town or place of the event as written, or empty.',
  `people: everyone named, with their role in ${LANG_NAME[lang]} (for example the child, father, mother, godfather, groom, bride, the deceased, witness, priest).`,
  'unclear: true if the photo is too blurry or the handwriting too hard to read for a reliable transcription.',
  'Only report what the document says. Do not add facts from outside it.',
].join(' ')

Deno.serve(async (req) => {
  const cors = corsFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405, cors)
  try {
    const user = await requireUser(req)
    const { bucket = 'family-photos', path, lang = 'en' } = await req.json()
    if (!BUCKETS.has(bucket) || typeof path !== 'string' || !path.startsWith(`${user.id}/`) || path.includes('..')) {
      return json({ error: 'That document could not be found.' }, 400, cors)
    }
    const apiKey = cfg('GEMINI_API_KEY')
    if (!apiKey) return json({ error: 'The document reader is not switched on yet.' }, 503, cors)

    const use = await takeDailyUse(user.id, 'document-read', FREE_DAILY, PRO_DAILY, 'documents')
    if (!use.ok) return json({ error: use.message, code: use.pro ? 'LIMIT_REACHED' : 'UPGRADE_REQUIRED' }, 429, cors)
    // From here on, any failure gives the day's use back.
    const fail = async (status: number, error: string, code?: string) => { await use.refund(); return json({ error, ...(code ? { code } : {}) }, status, cors) }

    const db = createClient(cfg('SUPABASE_URL') ?? '', cfg('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const { data: file, error: dlError } = await db.storage.from(bucket).download(path)
    if (dlError || !file) return await fail(404, 'That document could not be found.')
    if (file.size > MAX_BYTES) return await fail(413, 'Please use a photo smaller than 8 MB.')
    const mimeType = file.type && (file.type.startsWith('image/') || file.type === 'application/pdf') ? file.type : 'image/jpeg'
    const data = encodeBase64(new Uint8Array(await file.arrayBuffer()))

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      signal: AbortSignal.timeout(90000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt(lang === 'fr' ? 'fr' : 'en') }, { inline_data: { mime_type: mimeType, data } }] }],
        generationConfig: { responseMimeType: 'application/json', responseSchema: SCHEMA, temperature: 0 },
      }),
    })
    if (r.status === 429 || r.status === 403) {
      console.error('read-document: Gemini refused', r.status, (await r.text()).slice(0, 300))
      return await fail(503, 'The document reader is being switched on and will be ready soon. Please check back shortly.', 'PROVIDER_LIMIT')
    }
    if (!r.ok) {
      console.error('read-document: Gemini error', r.status, (await r.text()).slice(0, 300))
      return await fail(502, 'The document could not be read. Please try a clearer photo.')
    }
    const text = (await r.json())?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
    let reading: unknown
    try { reading = JSON.parse(text) } catch { return await fail(502, 'The document could not be read. Please try a clearer photo.') }
    return json({ reading }, 200, cors)
  } catch (e) {
    return errorResponse(e, cors)
  }
})
