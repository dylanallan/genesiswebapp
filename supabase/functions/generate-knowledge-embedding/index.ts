// Follow this pattern to import other modules from the Deno registry.

import { createClient } from 'npm:@supabase/supabase-js@2'
import OpenAI from "npm:openai@4.28.0";

import { corsFor } from '../_shared/cors.ts'
import { requireUser, json, errorResponse } from '../_shared/auth.ts'

// Writes to the global knowledge base, so only admins (app_metadata.role = 'admin') may call it.

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

Deno.serve(async (req) => {
  const corsHeaders = corsFor(req)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const user = await requireUser(req)
    if (user.app_metadata?.role !== 'admin') return json({ error: 'Forbidden' }, 403, corsHeaders)

    const { text, metadata: requestMetadata } = await req.json();

    if (typeof text !== 'string' || !text.trim() || text.length > 20000) {
      return json({ error: "'text' is required (max 20000 characters)" }, 400, corsHeaders)
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
    return errorResponse(err, corsHeaders)
  }
}) 