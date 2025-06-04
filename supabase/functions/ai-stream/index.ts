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

// Initialize API clients
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

Deno.serve(async (req) => {
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

    if (model === 'codex') {
      try {
        const openai = initializeOpenAIClient();
        const stream = new ReadableStream({
          async start(controller) {
            try {
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
              controller.enqueue(encoder.encode('Error generating code from OpenAI API'));
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
        console.error('OpenAI Setup Error:', error);
        throw error;
      }
    }

    if (model === 'gemini-pro') {
      try {
        const genAI = initializeGeminiClient();
        const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
        
        const stream = new ReadableStream({
          async start(controller) {
            try {
              const result = await geminiModel.generateContent(prompt);
              const response = await result.response;
              const text = response.text();
              
              const chunkSize = 100;
              for (let i = 0; i < text.length; i += chunkSize) {
                const chunk = text.slice(i, i + chunkSize);
                controller.enqueue(encoder.encode(chunk));
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
        throw error;
      }
    }

    // For unsupported models, return a temporary response
    const stream = new ReadableStream({
      start(controller) {
        const message = `I apologize, but ${model} is not yet available. Please try using 'gemini-pro' or 'codex' model instead.`;
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