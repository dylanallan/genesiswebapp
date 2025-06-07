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

interface AIRequest {
  prompt: string;
  model?: string;
  context?: string;
  type?: string;
  maxTokens?: number;
  temperature?: number;
}

async function getAIConfig(serviceName: string) {
  try {
    const { data, error } = await supabase
      .from('ai_service_config')
      .select('api_key, config')
      .eq('service_name', serviceName)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new Error(`${serviceName} configuration not found or inactive`);
    }
    
    return data;
  } catch (error) {
    console.error(`Failed to get ${serviceName} configuration:`, error);
    throw error;
  }
}

async function routeRequest(request: AIRequest, userId: string): Promise<{ provider: string; stream: ReadableStream }> {
  const { prompt, type, context } = request;
  
  // Determine best provider based on request type and content
  let selectedProvider = 'openai-gpt4'; // default
  
  if (type === 'business' || prompt.toLowerCase().includes('automation') || prompt.toLowerCase().includes('workflow')) {
    selectedProvider = 'dylanallan-assistant';
  } else if (type === 'cultural' || prompt.toLowerCase().includes('heritage') || prompt.toLowerCase().includes('tradition')) {
    selectedProvider = 'anthropic-claude';
  } else if (type === 'coding' || prompt.toLowerCase().includes('code') || prompt.toLowerCase().includes('programming')) {
    selectedProvider = 'openai-gpt4';
  } else if (type === 'analysis' || prompt.toLowerCase().includes('analyze')) {
    selectedProvider = 'google-gemini';
  }

  const startTime = Date.now();
  
  try {
    const stream = await generateResponse(selectedProvider, request);
    
    // Log successful request (we'll update with actual metrics after streaming)
    await logRequest(userId, selectedProvider, request, Date.now() - startTime, true);
    
    return { provider: selectedProvider, stream };
  } catch (error) {
    console.error(`Error with provider ${selectedProvider}:`, error);
    
    // Log failed request
    await logRequest(userId, selectedProvider, request, Date.now() - startTime, false, error.message);
    
    // Try fallback provider
    const fallbackProvider = selectedProvider === 'openai-gpt4' ? 'google-gemini' : 'openai-gpt4';
    try {
      const stream = await generateResponse(fallbackProvider, request);
      await logRequest(userId, fallbackProvider, request, Date.now() - startTime, true);
      return { provider: fallbackProvider, stream };
    } catch (fallbackError) {
      await logRequest(userId, fallbackProvider, request, Date.now() - startTime, false, fallbackError.message);
      throw fallbackError;
    }
  }
}

async function generateResponse(provider: string, request: AIRequest): Promise<ReadableStream> {
  const { prompt, maxTokens = 1000, temperature = 0.7 } = request;
  
  switch (provider) {
    case 'openai-gpt4': {
      const config = await getAIConfig('openai-gpt4');
      if (!config.api_key) throw new Error('OpenAI API key not configured');
      
      const openai = new OpenAI({ apiKey: config.api_key });
      
      const stream = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant specialized in coding and technical analysis.' },
          { role: 'user', content: prompt }
        ],
        stream: true,
        max_tokens: maxTokens,
        temperature
      });

      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              const content = chunk.choices[0]?.delta?.content;
              if (content) {
                controller.enqueue(new TextEncoder().encode(content));
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });
    }
    
    case 'anthropic-claude': {
      const config = await getAIConfig('anthropic-claude');
      if (!config.api_key) throw new Error('Anthropic API key not configured');
      
      const anthropic = new Anthropic({ apiKey: config.api_key });
      
      const stream = await anthropic.messages.stream({
        model: 'claude-3-opus-20240229',
        max_tokens: maxTokens,
        messages: [{ 
          role: 'user', 
          content: `As a cultural heritage and analysis specialist: ${prompt}` 
        }]
      });

      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                controller.enqueue(new TextEncoder().encode(chunk.delta.text));
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });
    }
    
    case 'google-gemini': {
      const config = await getAIConfig('google-gemini');
      if (!config.api_key) throw new Error('Google API key not configured');
      
      const genAI = new GoogleGenerativeAI(config.api_key);
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const result = await model.generateContentStream(prompt);
      
      return new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of result.stream) {
              const text = chunk.text();
              if (text) {
                controller.enqueue(new TextEncoder().encode(text));
              }
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        }
      });
    }
    
    case 'dylanallan-assistant': {
      // Try to connect to DylanAllan.io API
      try {
        const response = await fetch('https://dylanallan.io/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Genesis-Heritage-AI-Router/1.0'
          },
          body: JSON.stringify({
            message: prompt,
            context: 'business_automation',
            stream: true
          })
        });

        if (!response.ok) {
          throw new Error(`DylanAllan API error: ${response.statusText}`);
        }

        return response.body!;
      } catch (error) {
        console.error('DylanAllan API error:', error);
        
        // Fallback to business-focused response
        const fallbackResponse = `As a business automation specialist, I understand you're looking for guidance on: ${prompt}

While I'm currently unable to connect to the specialized DylanAllan.io business consultant, I can provide general automation recommendations:

1. **Process Analysis**: Identify repetitive tasks that consume significant time
2. **Workflow Mapping**: Document current processes to find optimization opportunities  
3. **Tool Integration**: Connect your existing business tools for seamless data flow
4. **Automation Priorities**: Start with high-impact, low-complexity automations

For detailed business strategy and automation consulting, I recommend visiting dylanallan.io directly for personalized guidance.

Would you like me to help you with any specific aspect of business automation?`;

        return new ReadableStream({
          start(controller) {
            const words = fallbackResponse.split(' ');
            let index = 0;
            
            const sendWord = () => {
              if (index < words.length) {
                controller.enqueue(new TextEncoder().encode(words[index] + ' '));
                index++;
                setTimeout(sendWord, 50);
              } else {
                controller.close();
              }
            };
            
            sendWord();
          }
        });
      }
    }
    
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

async function logRequest(
  userId: string, 
  provider: string, 
  request: AIRequest, 
  responseTime: number, 
  success: boolean, 
  errorMessage?: string
) {
  try {
    await supabase.rpc('log_ai_request', {
      p_user_id: userId,
      p_provider_id: provider,
      p_request_type: request.type || 'chat',
      p_prompt_length: request.prompt.length,
      p_response_length: 0, // Will be updated after streaming
      p_tokens_used: Math.ceil(request.prompt.length / 4), // Rough estimate
      p_cost: 0.001, // Rough estimate
      p_response_time_ms: responseTime,
      p_success: success,
      p_error_message: errorMessage
    });
  } catch (error) {
    console.error('Error logging AI request:', error);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const request: AIRequest = await req.json();

    if (!request.prompt) {
      throw new Error('Prompt is required');
    }

    // Route request to best AI provider
    const { provider, stream } = await routeRequest(request, user.id);

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-AI-Provider': provider
      }
    });
  } catch (error) {
    console.error('AI Stream Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});