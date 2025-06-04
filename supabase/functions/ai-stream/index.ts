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

function validateEnvironment() {
  if (!geminiKey && !openaiKey) {
    throw new Error('Neither GEMINI_API_KEY nor OPENAI_API_KEY environment variables are set');
  }
}

Deno.serve(async (req) => {
  try {
    validateEnvironment();
  } catch (error) {
    console.error('Environment validation failed:', error);
    return new Response(
      JSON.stringify({ error: 'Service configuration error. Please contact support.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!req.body) {
      throw new Error('Request body is required');
    }

    const { prompt, model } = await req.json() as RequestBody;

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const encoder = new TextEncoder();

    if (model === 'codex' || model === 'gpt-4') {
      if (!openaiKey) {
        throw new Error('OpenAI API key is not configured');
      }

      const stream = new ReadableStream({
        async start(controller) {
          try {
            const openai = initializeOpenAIClient();
            const completion = await openai.chat.completions.create({
              model: 'gpt-4',
              messages: [
                {
                  role: 'system',
                  content: 'You are an expert programmer. Provide detailed, production-ready code solutions.'
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
            controller.error(error instanceof Error ? error.message : 'Unknown error occurred');
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
      if (!geminiKey) {
        throw new Error('Gemini API key is not configured');
      }

      const stream = new ReadableStream({
        async start(controller) {
          try {
            const genAI = initializeGeminiClient();
            const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
            
            const result = await geminiModel.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            const chunkSize = 100;
            for (let i = 0; i < text.length; i += chunkSize) {
              const chunk = text.slice(i, i + chunkSize);
              controller.enqueue(encoder.encode(chunk));
              await new Promise(resolve => setTimeout(resolve, 20));
            }
            controller.close();
          } catch (error) {
            console.error('Gemini API Error:', error);
            controller.error(error instanceof Error ? error.message : 'Unknown error occurred');
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

    const stream = new ReadableStream({
      start(controller) {
        const message = `Model '${model}' is not supported. Please use 'gemini-pro' or 'codex'.`;
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