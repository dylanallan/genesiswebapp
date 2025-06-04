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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate request
    if (!req.body) {
      throw new Error('Request body is required');
    }

    // Validate Gemini API key
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { prompt, model } = await req.json() as RequestBody;

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    let response: ReadableStream;

    switch (model) {
      case 'gemini-pro': {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
        
        try {
          const result = await geminiModel.generateContentStream(prompt);
          response = result.stream;
        } catch (error) {
          console.error('Gemini API Error:', error);
          throw new Error('Failed to generate content from Gemini API');
        }
        break;
      }

      case 'gpt-4':
      case 'claude-3':
        return new Response(
          JSON.stringify({ error: `Model ${model} is not yet implemented` }),
          {
            status: 501,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );

      default:
        return new Response(
          JSON.stringify({ error: `Unsupported model: ${model}` }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
    }

    return new Response(response, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
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