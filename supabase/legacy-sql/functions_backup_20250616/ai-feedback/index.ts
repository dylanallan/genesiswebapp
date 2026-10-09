import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import { corsHeaders } from "../_shared/cors.ts";

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface FeedbackRequest {
  responseId?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedback?: string;
  model: string;
  promptId?: string;
  responseTime?: number;
  wasHelpful: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
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
      responseId,
      rating,
      feedback,
      model,
      promptId,
      responseTime,
      wasHelpful
    } = await req.json() as FeedbackRequest;

    // Validate required fields
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Store feedback in database
    const { data, error } = await supabase
      .from('ai_response_feedback')
      .insert({
        user_id: user.id,
        response_id: responseId || crypto.randomUUID(),
        rating,
        feedback,
        model,
        prompt_id: promptId,
        response_time_ms: responseTime,
        was_helpful: wasHelpful,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update model performance metrics based on feedback
    await supabase
      .from('model_performance_metrics')
      .insert({
        model_id: await getModelIdFromName(model),
        metric_type: 'user_satisfaction',
        value: rating / 5, // Normalize to 0-1 scale
        timestamp: new Date().toISOString()
      });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Feedback recorded successfully',
        feedbackId: data.id
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('AI feedback error:', error);
    
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

async function getModelIdFromName(modelName: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('ai_models')
      .select('id')
      .eq('name', modelName)
      .single();

    if (error) {
      // If model doesn't exist, create it
      const { data: newModel, error: createError } = await supabase
        .from('ai_models')
        .insert({
          name: modelName,
          version: '1.0',
          capabilities: ['chat'],
          context_window: 4096
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      return newModel.id;
    }

    return data.id;
  } catch (error) {
    console.error('Error getting model ID:', error);
    // Return a placeholder UUID if we can't get or create the model
    return '00000000-0000-0000-0000-000000000000';
  }
}