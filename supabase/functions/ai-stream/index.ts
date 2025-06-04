import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.2.1";
import OpenAI from "npm:openai@4.28.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const geminiKey = Deno.env.get('GEMINI_API_KEY');
const openaiKey = Deno.env.get('OPENAI_API_KEY');

interface RequestBody {
  prompt: string;
  model: 'gpt-4' | 'claude-3' | 'gemini-pro' | 'codex';
}

function initializeGeminiClient() {
  if (!geminiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  return new GoogleGenerativeAI(geminiKey);
}

function initializeOpenAIClient() {
  if (!openaiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({ apiKey: openaiKey });
}

function validateEnvironment(model: string) {
  if (model === 'gemini-pro' && !geminiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  if ((model === 'codex' || model === 'gpt-4') && !openaiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate request
    if (!req.body) {
      return new Response(
        JSON.stringify({ 
          error: 'Request body is required',
          details: 'The request body is missing'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { prompt, model } = await req.json() as RequestBody;

    if (!prompt) {
      return new Response(
        JSON.stringify({ 
          error: 'Prompt is required',
          details: 'The prompt field is missing in the request body'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate environment configuration
    try {
      validateEnvironment(model);
    } catch (error) {
      console.error('Environment validation error:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Configuration Error',
          details: error instanceof Error ? error.message : 'The requested AI model is not currently available. Please try a different model or contact support.'
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const encoder = new TextEncoder();

    if (model === 'codex' || model === 'gpt-4') {
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const openai = initializeOpenAIClient();
            const completion = await openai.chat.completions.create({
              model: model === 'codex' ? 'gpt-4-turbo-preview' : 'gpt-4',
              messages: [
                {
                  role: 'system',
                  content: model === 'codex' 
                    ? 'You are an expert programmer. Provide detailed, production-ready code solutions.'
                    : 'You are a helpful AI assistant with expertise in various domains.'
                },
                { role: 'user', content: prompt }
              ],
              stream: true
            });

            for await (const chunk of completion) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            }
            controller.close();
          } catch (error) {
            console.error('OpenAI API Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'OpenAI API error occurred';
            controller.enqueue(encoder.encode(`Error: ${errorMessage}`));
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
    }

    if (model === 'gemini-pro') {
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const genAI = initializeGeminiClient();
            const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
            
            const result = await geminiModel.generateContentStream(prompt);
            
            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
            }
            controller.close();
          } catch (error) {
            console.error('Gemini API Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Gemini API error occurred';
            controller.enqueue(encoder.encode(`Error: ${errorMessage}`));
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
    }

    return new Response(
      JSON.stringify({ 
        error: 'Unsupported model',
        details: `Model '${model}' is not supported. Please use 'gemini-pro' or 'gpt-4'.`
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('AI Stream Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'An unknown error occurred while processing your request'
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