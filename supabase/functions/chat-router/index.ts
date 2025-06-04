import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.2.1";
import OpenAI from "npm:openai@4.28.0";
import Anthropic from "npm:@anthropic-ai/sdk@0.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  prompt: string;
  model: 'gpt-4' | 'claude-3' | 'gemini-pro' | 'deepseek-1';
  context?: {
    courseId?: string;
    lessonId?: string;
    userId?: string;
    progress?: number;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, model, context } = await req.json() as RequestBody;

    // Validate request
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    // Initialize clients based on model
    let response: ReadableStream;
    const encoder = new TextEncoder();

    switch (model) {
      case 'gpt-4': {
        const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });
        response = new ReadableStream({
          async start(controller) {
            try {
              const completion = await openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [{ role: 'user', content: prompt }],
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
              // Try Claude as fallback
              try {
                const anthropic = new Anthropic({
                  apiKey: Deno.env.get('CLAUDE_API_KEY')!
                });

                const message = await anthropic.messages.create({
                  model: 'claude-3-opus-20240229',
                  max_tokens: 4096,
                  messages: [{ role: 'user', content: prompt }]
                });

                controller.enqueue(encoder.encode(message.content[0].text));
                controller.close();
              } catch (fallbackError) {
                controller.error('Both primary and fallback models failed');
              }
            }
          }
        });
        break;
      }

      case 'claude-3': {
        const anthropic = new Anthropic({
          apiKey: Deno.env.get('CLAUDE_API_KEY')!
        });

        response = new ReadableStream({
          async start(controller) {
            try {
              const message = await anthropic.messages.create({
                model: 'claude-3-opus-20240229',
                max_tokens: 4096,
                messages: [{ role: 'user', content: prompt }]
              });

              controller.enqueue(encoder.encode(message.content[0].text));
              controller.close();
            } catch (error) {
              controller.error(error);
            }
          }
        });
        break;
      }

      case 'gemini-pro': {
        const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        
        response = new ReadableStream({
          async start(controller) {
            try {
              const result = await model.generateContentStream(prompt);
              for await (const chunk of result.stream) {
                const text = chunk.text();
                if (text) {
                  controller.enqueue(encoder.encode(text));
                }
              }
              controller.close();
            } catch (error) {
              controller.error(error);
            }
          }
        });
        break;
      }

      default:
        throw new Error(`Unsupported model: ${model}`);
    }

    // Log interaction to Supabase
    if (context?.userId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );

      await supabase.from('learning_interactions').insert({
        user_id: context.userId,
        course_id: context.courseId,
        lesson_id: context.lessonId,
        model: model,
        prompt: prompt,
        timestamp: new Date().toISOString()
      });
    }

    return new Response(response, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});