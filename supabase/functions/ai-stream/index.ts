import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.2.1";
import OpenAI from "npm:openai@4.28.0";
import { Anthropic } from "npm:@anthropic-ai/sdk@0.17.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getAIConfig(service: string) {
  const { data, error } = await supabase
    .from('ai_service_config')
    .select('api_key, config')
    .eq('service_name', service)
    .eq('is_active', true)
    .single();

  if (error) throw new Error(`Failed to get ${service} configuration`);
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, model } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let response: string;

          switch (model) {
            case 'gemini-pro': {
              const config = await getAIConfig('gemini');
              const genAI = new GoogleGenerativeAI(config.api_key);
              const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
              const result = await geminiModel.generateContent(prompt);
              response = result.response.text();
              break;
            }
            case 'claude-3': {
              const config = await getAIConfig('anthropic');
              const anthropic = new Anthropic({
                apiKey: config.api_key,
              });
              const message = await anthropic.messages.create({
                model: config.config.model,
                max_tokens: 1024,
                messages: [{ role: 'user', content: prompt }]
              });
              response = message.content[0].text;
              break;
            }
            case 'gpt-4':
            default: {
              const config = await getAIConfig('openai');
              const openai = new OpenAI({ apiKey: config.api_key });
              const completion = await openai.chat.completions.create({
                model: config.config.model,
                messages: [{ role: 'user', content: prompt }]
              });
              response = completion.choices[0]?.message?.content || '';
            }
          }

          controller.enqueue(new TextEncoder().encode(response));
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      }
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});