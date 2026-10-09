import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.2.1";
import OpenAI from "npm:openai@4.28.0";
import { Anthropic } from "npm:@anthropic-ai/sdk@0.17.1";
import { corsHeaders } from "../_shared/cors.ts";

// Initialize Supabase client
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
      console.warn(`${serviceName} configuration not found or inactive`);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error(`Failed to get ${serviceName} configuration:`, error);
    return null;
  }
}

async function getSystemPrompt(type?: string): Promise<string> {
  switch (type) {
    case 'business':
      return "You are a business automation and consulting specialist. Provide practical, actionable advice for improving business processes and efficiency. Focus on ROI, scalability, and sustainable growth strategies.";
    case 'cultural':
      return "You are a cultural heritage specialist. Help users explore and integrate their cultural background into modern life while preserving traditions. Be respectful and knowledgeable about diverse cultures.";
    case 'coding':
      return "You are a programming expert. Provide clear, well-documented code solutions and explain best practices. Focus on clean, maintainable, and efficient code.";
    case 'analysis':
      return "You are an analytical expert. Provide thorough, well-reasoned analysis with clear conclusions and recommendations. Use data-driven insights when possible.";
    case 'creative':
      return "You are a creative specialist. Help with creative projects, storytelling, design thinking, and innovative solutions. Be imaginative while staying practical.";
    case 'research':
      return "You are a research specialist. Provide comprehensive, well-sourced information and analysis. Focus on accuracy, depth, and current information.";
    case 'technical':
      return "You are a technical specialist. Provide detailed technical guidance, troubleshooting, and solutions. Focus on accuracy and practical implementation.";
    default:
      return "You are a helpful AI assistant. Provide clear, accurate, and useful responses.";
  }
}

async function logRequest(userId: string, provider: string, request: AIRequest, responseTime: number, success: boolean, errorMessage?: string) {
  try {
    await supabase
      .from('ai_request_logs')
      .insert({
        user_id: userId,
        provider_id: provider,
        request_type: request.type || 'chat',
        prompt_length: request.prompt.length,
        response_time_ms: responseTime,
        success,
        error_message: errorMessage,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging request:', error);
  }
}

function createTextStream(text: string): ReadableStream {
  return new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const words = text.split(' ');
      let index = 0;
      
      const sendWord = () => {
        if (index < words.length) {
          controller.enqueue(encoder.encode(words[index] + ' '));
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

function createFallbackStream(request: AIRequest): ReadableStream {
  const fallbackText = `I understand you're asking about: "${request.prompt}"

I'm currently experiencing connectivity issues with our AI providers, but I can still help you with basic guidance:

**Available Capabilities:**
• Business automation and process optimization
• Cultural heritage exploration and preservation
• Technical development and programming assistance
• Research and analysis support
• Creative project guidance

**Next Steps:**
1. Please try your request again in a few moments
2. For immediate assistance, consider breaking down your question into smaller parts
3. Check your internet connection and try refreshing the page

I apologize for any inconvenience. Our AI routing system will be back to full capacity shortly.`;

  return createTextStream(fallbackText);
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

    // Parse request body
    const request: AIRequest = await req.json();

    if (!request.prompt) {
      throw new Error('Prompt is required');
    }

    const startTime = Date.now();
    let selectedModel = request.model || 'gpt-4';
    
    try {
      // Get system prompt
      const systemPrompt = await getSystemPrompt(request.type);
      
      // Generate response based on selected model
      let responseStream: ReadableStream;
      
      switch (selectedModel) {
        case 'gpt-4':
        case 'gpt-3.5-turbo': {
          // Get OpenAI API key
          const openaiConfig = await getAIConfig('openai');
          if (!openaiConfig?.api_key) {
            throw new Error('OpenAI API key not configured');
          }
          
          const openai = new OpenAI({ apiKey: openaiConfig.api_key });
          
          const stream = await openai.chat.completions.create({
            model: selectedModel === 'gpt-4' ? 'gpt-4-turbo-preview' : 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: request.prompt }
            ],
            stream: true,
            max_tokens: request.maxTokens || 2000,
            temperature: request.temperature || 0.7
          });

          responseStream = new ReadableStream({
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
          break;
        }
        
        case 'claude-3-opus':
        case 'claude-3-sonnet':
        case 'claude-3-haiku': {
          // Get Anthropic API key
          const anthropicConfig = await getAIConfig('anthropic');
          if (!anthropicConfig?.api_key) {
            throw new Error('Anthropic API key not configured');
          }
          
          const anthropic = new Anthropic({ apiKey: anthropicConfig.api_key });
          
          const stream = await anthropic.messages.stream({
            model: selectedModel,
            max_tokens: request.maxTokens || 2000,
            messages: [{ 
              role: 'user', 
              content: `${systemPrompt}\n\n${request.prompt}` 
            }]
          });

          responseStream = new ReadableStream({
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
          break;
        }
        
        case 'gemini-pro': {
          // Get Google API key
          const googleConfig = await getAIConfig('google');
          if (!googleConfig?.api_key) {
            throw new Error('Google API key not configured');
          }
          
          const genAI = new GoogleGenerativeAI(googleConfig.api_key);
          const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
          
          const result = await model.generateContentStream(`${systemPrompt}\n\n${request.prompt}`);
          
          responseStream = new ReadableStream({
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
          break;
        }
        
        default:
          throw new Error(`Unsupported model: ${selectedModel}`);
      }
      
      // Log successful request
      await logRequest(user.id, selectedModel, request, Date.now() - startTime, true);
      
      return new Response(responseStream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'X-AI-Model': selectedModel
        }
      });
    } catch (error) {
      console.error(`Error with provider ${selectedModel}:`, error);
      
      // Log failed request
      await logRequest(user.id, selectedModel, request, Date.now() - startTime, false, error.message);
      
      // Try fallback provider
      const fallbackModel = selectedModel === 'gpt-4' ? 'gpt-3.5-turbo' : 'gpt-4';
      try {
        // Get system prompt
        const systemPrompt = await getSystemPrompt(request.type);
        
        // Get OpenAI API key for fallback
        const openaiConfig = await getAIConfig('openai');
        if (!openaiConfig?.api_key) {
          throw new Error('OpenAI API key not configured');
        }
        
        const openai = new OpenAI({ apiKey: openaiConfig.api_key });
        
        const stream = await openai.chat.completions.create({
          model: fallbackModel === 'gpt-4' ? 'gpt-4-turbo-preview' : 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: request.prompt }
          ],
          stream: true,
          max_tokens: request.maxTokens || 2000,
          temperature: request.temperature || 0.7
        });

        const responseStream = new ReadableStream({
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
        
        // Log successful fallback request
        await logRequest(user.id, fallbackModel, request, Date.now() - startTime, true);
        
        return new Response(responseStream, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-AI-Model': fallbackModel
          }
        });
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        
        // Log failed fallback request
        await logRequest(user.id, fallbackModel, request, Date.now() - startTime, false, fallbackError.message);
        
        // Return fallback response
        return new Response(createFallbackStream(request), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-AI-Model': 'fallback'
          }
        });
      }
    }
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