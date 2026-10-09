import { createClient } from 'npm:@supabase/supabase-js@2'
import OpenAI from 'npm:openai@4.28.0'
import { corsFor } from '../_shared/cors.ts'
import { requireUser, json, errorResponse } from '../_shared/auth.ts'

// Adds a document or note to the caller's private AI memory: splits it into chunks, embeds them
// (OpenAI text-embedding-3-small, 1536 dimensions) and stores them in ai_embeddings.
const MAX_CHARS = 200_000
const MAX_CHUNKS = 25

Deno.serve(async (req) => {
  const cors = corsFor(req)
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405, cors)

  try {
    const user = await requireUser(req)
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) return json({ error: 'AI memory needs an OpenAI API key to be configured' }, 503, cors)

    const { content, contentType, contentId, metadata } = await req.json()
    if (typeof content !== 'string' || !content.trim() || typeof contentType !== 'string' || typeof contentId !== 'string' || !contentId) {
      return json({ error: 'content, contentType and contentId are required' }, 400, cors)
    }
    if (content.length > MAX_CHARS) return json({ error: `That is too long to add at once (max ${MAX_CHARS.toLocaleString()} characters)` }, 400, cors)

    const chunks = chunkContent(content)
    if (chunks.length > MAX_CHUNKS) return json({ error: 'That document is too long to add at once. Please split it up.' }, 400, cors)

    // One request embeds every chunk
    const openai = new OpenAI({ apiKey })
    const embeddings = await openai.embeddings.create({ model: 'text-embedding-3-small', input: chunks, encoding_format: 'float' })

    const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const now = new Date().toISOString()
    const { error } = await db.from('ai_embeddings').insert(chunks.map((chunk, index) => ({
      user_id: user.id,
      content_type: contentType.slice(0, 50),
      content_id: (chunks.length > 1 ? `${contentId}-chunk-${index + 1}` : contentId).slice(0, 300),
      content: chunk,
      embedding: embeddings.data[index].embedding,
      metadata: { ...(metadata && typeof metadata === 'object' ? metadata : {}), chunkIndex: index, totalChunks: chunks.length, chunkSize: chunk.length, processedAt: now },
    })))
    if (error) throw error

    return json({ success: true, message: `Content processed and stored successfully in ${chunks.length} chunks`, chunks: chunks.length }, 200, cors)
  } catch (e) {
    return errorResponse(e, cors)
  }
})

/**
 * Split content into chunks of appropriate size for embeddings
 */
function chunkContent(content: string, maxChunkSize = 8000): string[] {
  if (content.length <= maxChunkSize) {
    return [content];
  }

  const chunks: string[] = [];
  let currentChunk = '';
  
  // Split by paragraphs first
  const paragraphs = content.split(/\n\s*\n/);
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed the max chunk size,
    // save the current chunk and start a new one
    if (currentChunk.length + paragraph.length > maxChunkSize) {
      // If the current chunk is not empty, add it to chunks
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      
      // If the paragraph itself is too long, split it further
      if (paragraph.length > maxChunkSize) {
        // Split by sentences
        const sentences = paragraph.split(/(?<=[.!?])\s+/);
        
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > maxChunkSize) {
            if (currentChunk) {
              chunks.push(currentChunk);
              currentChunk = '';
            }
            
            // If the sentence is still too long, split it into fixed-size chunks
            if (sentence.length > maxChunkSize) {
              let i = 0;
              while (i < sentence.length) {
                chunks.push(sentence.substring(i, i + maxChunkSize));
                i += maxChunkSize;
              }
            } else {
              currentChunk = sentence;
            }
          } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          }
        }
      } else {
        currentChunk = paragraph;
      }
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  // Add the last chunk if it's not empty
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
}