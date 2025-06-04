import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.2.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const geminiKey = Deno.env.get('GEMINI_API_KEY');

interface RequestBody {
  prompt: string;
  model: 'gpt-4' | 'claude-3' | 'gemini-pro';
}

// Verify Gemini API key and create client
function initializeGeminiClient() {
  if (!geminiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return new GoogleGenerativeAI(geminiKey);
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate request
    if (!req.body) {
      throw new Error('Request body is required');
    }

    const { prompt, model } = await req.json() as RequestBody;

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    // For non-Gemini models, return a temporary response
    if (model !== 'gemini-pro') {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          const message = `I apologize, but ${model} is not yet available. I'm falling back to a simple response. Please try using 'gemini-pro' model instead.`;
          controller.enqueue(encoder.encode(message));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Handle Gemini-pro model
    try {
      const genAI = initializeGeminiClient();
      const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      // Create a text encoder for streaming
      const encoder = new TextEncoder();
      
      // Create a ReadableStream that will handle the Gemini response
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const result = await geminiModel.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            // Send the text in chunks
            const chunkSize = 100;
            for (let i = 0; i < text.length; i += chunkSize) {
              const chunk = text.slice(i, i + chunkSize);
              controller.enqueue(encoder.encode(chunk));
              // Add a small delay between chunks to simulate streaming
              await new Promise(resolve => setTimeout(resolve, 50));
            }
            controller.close();
          } catch (error) {
            console.error('Error generating content:', error);
            controller.enqueue(encoder.encode('Error generating response from Gemini API'));
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } catch (error) {
      console.error('Gemini API Error:', error);
      return new Response(
        JSON.stringify({ 
          error: error instanceof Error ? 
            `Gemini API Error: ${error.message}` : 
            'Failed to generate content from Gemini API'
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
  } catch (error) {
    console.error('AI Stream Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred'
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