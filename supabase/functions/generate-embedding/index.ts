import OpenAI from 'npm:openai@4.28.0'
import { corsFor } from '../_shared/cors.ts'
import { requireUser, json, errorResponse } from '../_shared/auth.ts'

// Returns an embedding vector for a piece of text (signed-in users only).
// The model is fixed so callers cannot switch to a more expensive one.
const MODEL = 'text-embedding-3-small'
const MAX_CHARS = 8000

Deno.serve(async (req) => {
  const cors = corsFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405, cors)
  try {
    await requireUser(req)
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) return json({ error: 'Embeddings need an OpenAI API key to be configured' }, 503, cors)
    const { text } = await req.json()
    if (typeof text !== 'string' || !text.trim() || text.length > MAX_CHARS) {
      return json({ error: `text is required (max ${MAX_CHARS} characters)` }, 400, cors)
    }
    const embedding = (await new OpenAI({ apiKey }).embeddings.create({ model: MODEL, input: text, encoding_format: 'float' })).data[0].embedding
    return json({ success: true, embedding, model: MODEL, dimensions: embedding.length }, 200, cors)
  } catch (e) {
    return errorResponse(e, cors)
  }
})
