import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import { corsHeaders } from "../_shared/cors.ts";

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("Debug AI stream function called");
    
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    console.log("Auth header present:", !!authHeader);
    
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    console.log("Auth error:", authError?.message);
    console.log("User authenticated:", !!user);

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Parse request body
    const requestData = await req.json();
    console.log("Request data:", JSON.stringify({
      prompt: requestData.prompt?.substring(0, 50) + "...",
      model: requestData.model
    }));

    // Check for API keys
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    
    console.log("API keys available:", {
      openai: !!openaiKey,
      anthropic: !!anthropicKey,
      gemini: !!geminiKey
    });

    // Create a simple streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        const messages = [
          "This is a debug response from the AI stream function.",
          "If you can see this text appearing word by word,",
          "then your streaming functionality is working correctly.",
          "The issue might be with your AI provider configuration",
          "or with how your frontend is handling the response.",
          "",
          "API Keys Status:",
          `OpenAI: ${!!openaiKey ? "Available" : "Missing"}`,
          `Anthropic: ${!!anthropicKey ? "Available" : "Missing"}`,
          `Gemini: ${!!geminiKey ? "Available" : "Missing"}`
        ];
        
        let index = 0;
        
        const sendNextChunk = () => {
          if (index < messages.length) {
            controller.enqueue(encoder.encode(messages[index] + " "));
            index++;
            setTimeout(sendNextChunk, 100);
          } else {
            controller.close();
          }
        };
        
        sendNextChunk();
      }
    });

    console.log("Returning streaming response");
    
    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Debug AI stream error:', error);
    
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