import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const geminiKey = Deno.env.get('GEMINI_API_KEY')!;

interface RequestBody {
  prompt: string;
  model: 'gpt-4' | 'claude-3' | 'gemini-pro' | 'dylan-allan';
  apiKey?: string;
  apiSecret?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { prompt, model, apiKey, apiSecret } = await req.json() as RequestBody;

    let response: ReadableStream;

    switch (model) {
      case 'dylan-allan': {
        if (!apiKey || !apiSecret) {
          throw new Error('API key and secret are required for Dylan Allan AI');
        }

        // Connect to Dylan Allan AI API
        const dylanResponse = await fetch('https://dylan-allan.ai.io/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'X-API-Secret': apiSecret
          },
          body: JSON.stringify({ prompt })
        });

        if (!dylanResponse.ok) {
          throw new Error('Failed to connect to Dylan Allan AI');
        }

        response = dylanResponse.body!;
        break;
      }

      case 'gemini-pro': {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await geminiModel.generateContentStream(prompt);
        response = result.stream;
        break;
      }

      default:
        throw new Error(`Unsupported model: ${model}`);
    }

    return new Response(response, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});