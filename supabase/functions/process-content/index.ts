import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import OpenAI from "npm:openai@4.28.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

interface RequestBody {
  content: string;
  contentType: string;
  contentId: string;
  metadata?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Parse request body
    const { content, contentType, contentId, metadata } = await req.json() as RequestBody;

    if (!content || !contentType || !contentId) {
      throw new Error('Content, contentType, and contentId are required');
    }

    // Process large content by chunking
    const chunks = chunkContent(content);
    const processedChunks = [];

    for (const [index, chunk] of chunks.entries()) {
      // Generate embedding for the chunk
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
        encoding_format: "float"
      });
      
      const embedding = embeddingResponse.data[0].embedding;
      
      // Store the chunk with its embedding
      const { data, error } = await supabase
        .from('ai_embeddings')
        .insert({
          user_id: user.id,
          content_type: contentType,
          content_id: chunks.length > 1 ? `${contentId}-chunk-${index+1}` : contentId,
          content: chunk,
          embedding,
          metadata: {
            ...metadata,
            chunkIndex: index,
            totalChunks: chunks.length,
            chunkSize: chunk.length,
            processedAt: new Date().toISOString()
          }
        })
        .select();

      if (error) throw error;
      
      processedChunks.push(data[0]);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Content processed and stored successfully in ${processedChunks.length} chunks`,
        chunks: processedChunks.length
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Content processing error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

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