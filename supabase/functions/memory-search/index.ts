import { createClient } from 'npm:@supabase/supabase-js@2'
import OpenAI from 'npm:openai@4.28.0'
import { corsFor } from '../_shared/cors.ts'
import { requireUser, json, errorResponse } from '../_shared/auth.ts'

// Semantic search over the caller's own AI memory (ai_embeddings, via find_similar_messages).
// Body: { query, threshold?: 0..1, limit?: 1..20, contentType?, includeContent? }
Deno.serve(async (req) => {
  const cors = corsFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405, cors)

  try {
    const user = await requireUser(req)
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) return json({ error: 'AI memory needs an OpenAI API key to be configured' }, 503, cors)

    const body = await req.json()
    const query = typeof body.query === 'string' ? body.query.trim() : ''
    if (!query || query.length > 2000) return json({ error: 'A query of up to 2000 characters is required' }, 400, cors)
    const threshold = Math.min(1, Math.max(0, Number(body.threshold ?? 0.7)))
    const limit = Math.min(20, Math.max(1, Math.round(Number(body.limit ?? 5))))
    const includeContent = body.includeContent !== false

    const openai = new OpenAI({ apiKey })
    const embedding = (await openai.embeddings.create({ model: 'text-embedding-3-small', input: query, encoding_format: 'float' })).data[0].embedding

    const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const { data, error } = await db.rpc('find_similar_messages', {
      p_embedding: embedding, p_match_threshold: threshold, p_match_count: limit, p_user_id: user.id,
    })
    if (error) throw error

    type Match = { id: string; content: string; content_type: string | null; metadata: unknown; created_at: string; similarity: number }
    const results = ((data ?? []) as Match[])
      .filter((m) => !body.contentType || m.content_type === body.contentType)
      .map((m) => ({
        id: m.id,
        contentType: m.content_type,
        similarity: m.similarity,
        timestamp: m.created_at,
        metadata: m.metadata,
        ...(includeContent ? { content: m.content } : {}),
      }))
    return json({ success: true, results, count: results.length }, 200, cors)
  } catch (e) {
    return errorResponse(e, cors)
  }
})
