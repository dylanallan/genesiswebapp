import { createClient } from 'npm:@supabase/supabase-js@2'
import { encodeBase64, decodeBase64 } from 'jsr:@std/encoding@1/base64'
import { corsFor } from '../_shared/cors.ts'
import { requireUser, json, errorResponse } from '../_shared/auth.ts'
import { cfg } from '../_shared/runtime-config.ts'

// Repairs (and optionally colourises) an old photo the person uploaded to their own private folder,
// using Google's Gemini image model, and saves the result next to the original. The original is never changed.
const MODEL = cfg('GEMINI_IMAGE_MODEL') ?? 'gemini-2.5-flash-image'
// Each restoration costs about US$0.04 with Google, so daily limits keep costs predictable.
const FREE_DAILY = Number(cfg('RESTORE_FREE_DAILY') ?? '1')
const PRO_DAILY = Number(cfg('RESTORE_PRO_DAILY') ?? '10')
const MAX_BYTES = 8 * 1024 * 1024
const BUCKETS = new Set(['family-photos', 'media-uploads'])

const prompt = (colourise: boolean) => [
  'Restore this old family photograph.',
  'Remove scratches, dust, spots, creases, stains and tears; repair fading and improve contrast and clarity; gently sharpen.',
  'Keep every person exactly as they are: the same face, expression, age, hair, clothing and pose. Do not add, remove or change any person or object,',
  'and keep the original framing and composition.',
  colourise ? 'Then colourise it with natural, realistic colours that suit the time period.' : 'Keep the original colouring (black and white stays black and white).',
].join(' ')

Deno.serve(async (req) => {
  const cors = corsFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405, cors)
  try {
    const user = await requireUser(req)
    const { bucket = 'family-photos', path, colourise = false } = await req.json()
    if (!BUCKETS.has(bucket) || typeof path !== 'string' || !path.startsWith(`${user.id}/`) || path.includes('..')) {
      return json({ error: 'That photo could not be found.' }, 400, cors)
    }
    const apiKey = cfg('GEMINI_API_KEY')
    if (!apiKey) return json({ error: 'Photo restoration is not switched on yet.' }, 503, cors)

    const db = createClient(cfg('SUPABASE_URL') ?? '', cfg('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const { data: pro } = await db.rpc('has_pro_access', { p_user: user.id })
    const limit = pro ? PRO_DAILY : FREE_DAILY
    const { data: allowed, error: quotaError } = await db.rpc('consume_daily_quota', { p_user: user.id, p_kind: 'photo-restore', p_limit: limit })
    if (quotaError) throw quotaError
    if (!allowed) {
      return json({ error: pro ? `You've restored ${limit} photos today. You can restore more tomorrow.` : `Free accounts can restore ${limit} photos a day. Upgrade to Pro to restore more.`, code: pro ? 'LIMIT_REACHED' : 'UPGRADE_REQUIRED' }, 429, cors)
    }

    // From here on, any failure gives the day's use back, so people are never charged for an error.
    const refund = () => db.rpc('refund_daily_quota', { p_user: user.id, p_kind: 'photo-restore' })
    const fail = async (status: number, error: string, code?: string) => { await refund(); return json({ error, ...(code ? { code } : {}) }, status, cors) }

    const { data: file, error: dlError } = await db.storage.from(bucket).download(path)
    if (dlError || !file) return await fail(404, 'That photo could not be found.')
    if (file.size > MAX_BYTES) return await fail(413, 'Please use a photo smaller than 8 MB.')
    const mimeType = file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg'
    const data = encodeBase64(new Uint8Array(await file.arrayBuffer()))

    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt(!!colourise) }, { inline_data: { mime_type: mimeType, data } }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
    })
    if (r.status === 429 || r.status === 403) {
      console.error('restore-photo: Gemini refused', r.status, (await r.text()).slice(0, 300))
      return await fail(503, 'Photo restoration is being switched on and will be ready soon. Please check back shortly.', 'PROVIDER_LIMIT')
    }
    if (!r.ok) {
      console.error('restore-photo: Gemini error', r.status, (await r.text()).slice(0, 300))
      return await fail(502, 'The photo could not be restored. Please try a different photo.')
    }
    const parts = (await r.json())?.candidates?.[0]?.content?.parts ?? []
    const image = parts.map((p: Record<string, any>) => p.inlineData ?? p.inline_data).find((d: Record<string, string> | undefined) => d?.data)
    if (!image) return await fail(502, 'The photo could not be restored. Please try a clearer photo.')

    const outType = image.mimeType ?? image.mime_type ?? 'image/png'
    const outPath = `${user.id}/restored-${Date.now()}.${outType.includes('jpeg') ? 'jpg' : 'png'}`
    const { error: upError } = await db.storage.from(bucket).upload(outPath, decodeBase64(image.data), { contentType: outType, upsert: false })
    if (upError) { await refund(); throw upError }
    return json({ bucket, path: outPath }, 200, cors)
  } catch (e) {
    return errorResponse(e, cors)
  }
})
