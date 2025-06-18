import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { processMessageWithContext, callAI, AIMessage } from '../_shared/ai-utils.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { message, userId, conversationId, provider, model } = await req.json()

    if (!message || !userId) {
      return new Response(
        JSON.stringify({ error: 'Message and userId are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get conversation history for context
    let context = {};
    if (conversationId) {
      const { data: history } = await supabase
        .from('ai_conversation_history')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10);

      if (history && history.length > 0) {
        const conversationHistory: AIMessage[] = history.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.message
        }));
        context = { conversation_history: conversationHistory };
      }
    }

    // Get user profile for context
    try {
      const { data: userProfile } = await supabase
        .from('user_data')
        .select('preferences')
        .eq('user_id', userId)
        .single();

      if (userProfile?.preferences) {
        context = { ...context, user_profile: userProfile.preferences };
      }
    } catch (error) {
      // User profile not found, continue without it
    }

    // Log the user message
    const userMessageId = await supabase
      .from('ai_conversation_history')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        message: message,
        role: 'user',
        provider: provider || 'auto',
        model: model || 'auto'
      })
      .select('id')
      .single();

    // Get AI response
    let aiResponse;
    try {
      if (provider) {
        // Use specific provider
        const messages: AIMessage[] = [
          { role: 'user', content: message }
        ];
        aiResponse = await callAI({ messages, provider, model });
      } else {
        // Use context-aware processing
        aiResponse = await processMessageWithContext(message, userId, context);
      }
    } catch (error) {
      console.error('AI call failed:', error);
      aiResponse = {
        content: "I apologize, but I'm having trouble connecting to my AI services right now. Please try again in a moment.",
        provider: 'fallback',
        model: 'fallback',
        timestamp: new Date().toISOString()
      };
    }

    // Log the AI response
    await supabase
      .from('ai_conversation_history')
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        message: aiResponse.content,
        role: 'assistant',
        provider: aiResponse.provider,
        model: aiResponse.model,
        metadata: aiResponse.usage
      });

    return new Response(
      JSON.stringify({ 
        response: aiResponse.content,
        provider: aiResponse.provider,
        model: aiResponse.model,
        timestamp: aiResponse.timestamp,
        conversationId: conversationId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
}) 