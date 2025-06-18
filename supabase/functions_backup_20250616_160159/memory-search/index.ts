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
  query: string;
  sessionId?: string;
  threshold?: number;
  limit?: number;
  includeContent?: boolean;
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
    const { 
      query, 
      sessionId, 
      threshold = 0.7, 
      limit = 5,
      includeContent = true
    } = await req.json() as RequestBody;

    if (!query) {
      throw new Error('Query is required');
    }

    // Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: query,
      encoding_format: "float"
    });
    
    const embedding = embeddingResponse.data[0].embedding;
    
    // Search for similar messages in conversation history
    let queryBuilder = supabase.rpc('find_similar_messages', {
      p_embedding: embedding,
      p_match_threshold: threshold,
      p_match_count: limit,
      p_user_id: user.id
    });
    
    // Filter by session if provided
    if (sessionId) {
      queryBuilder = queryBuilder.eq('session_id', sessionId);
    }
    
    const { data, error } = await queryBuilder;

    if (error) throw error;
    
    // Format the response
    const results = data?.map(item => ({
      id: item.id,
      role: item.role,
      similarity: item.similarity,
      timestamp: item.created_at,
      session_id: item.session_id,
      ...(includeContent && { content: item.content })
    })) || [];

    return new Response(
      JSON.stringify({
        success: true,
        results,
        count: results.length
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Memory search error:', error);
    
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