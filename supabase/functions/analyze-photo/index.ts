import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsFor } from '../_shared/cors.ts'
import { requireUser, json, errorResponse } from '../_shared/auth.ts'
import { takeDailyUse } from '../_shared/quota.ts'
import { cfg } from '../_shared/runtime-config.ts'

// Analyses one of the caller's own photos (bucket "family-photos", folder = their user id) with the
// Google Cloud Vision REST API: faces (positions only), labels, landmarks, objects and printed text.
// Vision does not estimate age, gender or family relationships, and neither do we.
// Env: GOOGLE_VISION_API_KEY
const LIKELIHOOD: Record<string, number> = {
  VERY_UNLIKELY: 0.05, UNLIKELY: 0.25, POSSIBLE: 0.5, LIKELY: 0.75, VERY_LIKELY: 0.95,
}
const MAX_BYTES = 10 * 1024 * 1024 // Vision's limit for inline images

interface Vertex { x?: number; y?: number }
interface VisionFace {
  boundingPoly?: { vertices?: Vertex[] }
  detectionConfidence?: number
  landmarks?: Array<{ type?: string; position?: { x?: number; y?: number } }>
  joyLikelihood?: string; sorrowLikelihood?: string; angerLikelihood?: string; surpriseLikelihood?: string
}
interface VisionResponse {
  faceAnnotations?: VisionFace[]
  labelAnnotations?: Array<{ description?: string; score?: number }>
  landmarkAnnotations?: Array<{ description?: string }>
  localizedObjectAnnotations?: Array<{ name?: string }>
  textAnnotations?: Array<{ description?: string }>
  error?: { message?: string }
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

Deno.serve(async (req) => {
  const cors = corsFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405, cors)

  try {
    const user = await requireUser(req)
    const apiKey = cfg('GOOGLE_VISION_API_KEY')
    if (!apiKey) return json({ error: 'Photo analysis is not configured' }, 503, cors)

    const { photoPath } = await req.json()
    if (typeof photoPath !== 'string' || !photoPath.startsWith(`${user.id}/`) || photoPath.includes('..')) {
      return json({ error: 'You can only analyse your own photos' }, 403, cors)
    }

    const use = await takeDailyUse(user.id, 'photo-analysis', 20, 200, 'photo analyses')
    if (!use.ok) return json({ error: use.message, code: use.pro ? 'LIMIT_REACHED' : 'UPGRADE_REQUIRED' }, 429, cors)
    // Any failure from here gives the day's use back.
    const fail = async (status: number, error: string) => { await use.refund(); return json({ error }, status, cors) }

    const db = createClient(cfg('SUPABASE_URL') ?? '', cfg('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const { data: file, error: dlError } = await db.storage.from('family-photos').download(photoPath)
    if (dlError || !file) return await fail(404, 'Photo not found')
    const bytes = new Uint8Array(await file.arrayBuffer())
    if (bytes.length > MAX_BYTES) return await fail(400, 'Photo is larger than 10 MB')

    const res = await fetch('https://vision.googleapis.com/v1/images:annotate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        requests: [{
          image: { content: toBase64(bytes) },
          features: [
            { type: 'FACE_DETECTION', maxResults: 50 },
            { type: 'LABEL_DETECTION', maxResults: 15 },
            { type: 'LANDMARK_DETECTION', maxResults: 3 },
            { type: 'OBJECT_LOCALIZATION', maxResults: 20 },
            { type: 'TEXT_DETECTION' },
          ],
        }],
      }),
    })
    const body = await res.json()
    const result: VisionResponse = body.responses?.[0] ?? {}
    if (!res.ok || result.error) {
      console.error('Vision error', res.status, result.error?.message ?? JSON.stringify(body).slice(0, 500))
      return await fail(502, 'Photo analysis failed. Please try again.')
    }

    const faces = (result.faceAnnotations ?? []).map((f) => {
      const v = f.boundingPoly?.vertices ?? []
      const left = v[0]?.x ?? 0, top = v[0]?.y ?? 0
      return {
        boundingBox: { left, top, width: (v[2]?.x ?? left) - left, height: (v[2]?.y ?? top) - top },
        confidence: f.detectionConfidence ?? 0,
        landmarks: (f.landmarks ?? []).map((l) => ({ type: l.type ?? '', position: { x: l.position?.x ?? 0, y: l.position?.y ?? 0 } })),
        emotions: [
          { type: 'joy', confidence: LIKELIHOOD[f.joyLikelihood ?? ''] ?? 0 },
          { type: 'sorrow', confidence: LIKELIHOOD[f.sorrowLikelihood ?? ''] ?? 0 },
          { type: 'anger', confidence: LIKELIHOOD[f.angerLikelihood ?? ''] ?? 0 },
          { type: 'surprise', confidence: LIKELIHOOD[f.surpriseLikelihood ?? ''] ?? 0 },
        ],
      }
    })

    const text = result.textAnnotations?.[0]?.description ?? ''
    // A date written on the photo (e.g. "12/25/1958" or "1958") is a useful clue; only report what is printed.
    const date = text.match(/\b\d{1,2}[-/.]\d{1,2}[-/.](?:\d{2}|\d{4})\b/)?.[0] ?? text.match(/\b(18|19|20)\d{2}\b/)?.[0]

    return json({
      faces,
      labels: (result.labelAnnotations ?? []).map((l) => l.description ?? '').filter(Boolean),
      location: result.landmarkAnnotations?.[0]?.description,
      objects: [...new Set((result.localizedObjectAnnotations ?? []).map((o) => o.name ?? '').filter(Boolean))],
      text: text.slice(0, 2000),
      date,
      relationships: [], // never guessed from a photo; users record relationships in the family tree
    }, 200, cors)
  } catch (e) {
    return errorResponse(e, cors)
  }
})
