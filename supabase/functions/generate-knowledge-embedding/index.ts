// Follow this pattern to import other modules from the Deno registry.
// import * as mod from "https://deno.land/std@0.170.0/node/module.ts";

import { createClient } from 'npm:@supabase/supabase-js@2'
import OpenAI from "npm:openai@4.28.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, metadata: requestMetadata } = await req.json();

    if (!text) {
      throw new Error("Missing 'text' in request body");
    }

    // 1. Generate embedding with OpenAI
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small", // A cost-effective and performant model
      input: text,
    });
    const embedding = embeddingResponse.data[0].embedding;

    // 2. Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 3. Store in knowledge_base table
    const { data, error } = await supabaseClient
      .from('knowledge_base')
      .insert({
        content: text,
        content_length: text.length,
        content_tokens: Math.round(text.length / 4), // Estimate tokens
        embedding: embedding,
        metadata: requestMetadata || { source: 'api' }
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    return new Response(String(err?.message ?? err), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}) 