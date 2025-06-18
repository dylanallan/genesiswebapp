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
  quality?: 'fast' | 'balanced' | 'premium';
  urgency?: 'low' | 'medium' | 'high';
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

async function routeRequest(request: AIRequest, userId: string): Promise<{ provider: string; stream: ReadableStream }> {
  const { prompt, type, context } = request;
  
  // Enhanced provider selection logic
  let selectedProvider = 'openai-gpt4-turbo'; // default
  
  // Business automation (highest priority for DylanAllan)
  if (type === 'business' || 
      prompt.toLowerCase().includes('automation') || 
      prompt.toLowerCase().includes('workflow') ||
      prompt.toLowerCase().includes('business') ||
      prompt.toLowerCase().includes('strategy')) {
    selectedProvider = 'dylanallan-business';
  }
  // Coding tasks (DeepSeek specialization)
  else if (type === 'coding' || 
           prompt.toLowerCase().includes('code') || 
           prompt.toLowerCase().includes('programming') ||
           prompt.toLowerCase().includes('function') ||
           prompt.toLowerCase().includes('debug')) {
    selectedProvider = 'deepseek-coder';
  }
  // Cultural analysis (Claude specialization)
  else if (type === 'cultural' || 
           prompt.toLowerCase().includes('heritage') || 
           prompt.toLowerCase().includes('tradition') ||
           prompt.toLowerCase().includes('culture') ||
           prompt.toLowerCase().includes('ancestry')) {
    selectedProvider = 'anthropic-claude-3-opus';
  }
  // Complex analysis (GPT-4 specialization)
  else if (type === 'analysis' || 
           prompt.toLowerCase().includes('analyze') || 
           prompt.toLowerCase().includes('explain') ||
           prompt.toLowerCase().includes('compare') ||
           prompt.toLowerCase().includes('evaluate')) {
    selectedProvider = 'openai-gpt4-turbo';
  }

  const startTime = Date.now();
  
  try {
    const stream = await generateResponse(selectedProvider, request);
    
    // Log successful request
    await logRequest(userId, selectedProvider, request, Date.now() - startTime, true);
    
    return { provider: selectedProvider, stream };
  } catch (error) {
    console.error(`Error with provider ${selectedProvider}:`, error);
    
    // Log failed request
    await logRequest(userId, selectedProvider, request, Date.now() - startTime, false, error.message);
    
    // Try fallback provider
    const fallbackProvider = selectedProvider === 'openai-gpt4-turbo' ? 'google-gemini-15-pro' : 'openai-gpt4-turbo';
    try {
      const stream = await generateResponse(fallbackProvider, request);
      await logRequest(userId, fallbackProvider, request, Date.now() - startTime, true);
      return { provider: fallbackProvider, stream };
    } catch (fallbackError) {
      await logRequest(userId, fallbackProvider, request, Date.now() - startTime, false, fallbackError.message);
      
      // Final fallback - return mock response
      return { provider: 'fallback', stream: createFallbackStream(request) };
    }
  }
}

async function generateResponse(provider: string, request: AIRequest): Promise<ReadableStream> {
  const { prompt, maxTokens = 2000, temperature = 0.7 } = request;
  
  switch (provider) {
    case 'openai-gpt4-turbo': {
      const config = await getAIConfig('openai-gpt4-turbo');
      if (!config?.api_key) throw new Error('OpenAI API key not configured');
      
      const openai = new OpenAI({ apiKey: config.api_key });
      
      const stream = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: getSystemPrompt(provider, request) },
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
    
    case 'anthropic-claude-3-opus': {
      const config = await getAIConfig('anthropic-claude-3-opus');
      if (!config?.api_key) throw new Error('Anthropic API key not configured');
      
      const anthropic = new Anthropic({ apiKey: config.api_key });
      
      const stream = await anthropic.messages.stream({
        model: 'claude-3-opus-20240229',
        max_tokens: maxTokens,
        messages: [{ 
          role: 'user', 
          content: `${getSystemPrompt(provider, request)}\n\n${prompt}` 
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
    
    case 'google-gemini-15-pro': {
      const config = await getAIConfig('google-gemini-15-pro');
      if (!config?.api_key) throw new Error('Google API key not configured');
      
      const genAI = new GoogleGenerativeAI(config.api_key);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      
      const result = await model.generateContentStream(`${getSystemPrompt(provider, request)}\n\n${prompt}`);
      
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
    
    case 'dylanallan-business': {
      // Try to connect to DylanAllan.io API
      try {
        const response = await fetch('https://dylanallan.io/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Genesis-Heritage-AI-Router/2.0'
          },
          body: JSON.stringify({
            message: prompt,
            context: 'business_automation',
            stream: true,
            quality: request.quality || 'balanced',
            urgency: request.urgency || 'medium'
          }),
          signal: AbortSignal.timeout(15000)
        });

        if (!response.ok) {
          throw new Error(`DylanAllan API error: ${response.statusText}`);
        }

        return response.body!;
      } catch (error) {
        console.error('DylanAllan API error:', error);
        
        // Fallback to business-focused response
        const fallbackResponse = `🚀 **Business Automation Analysis**

I understand you're looking for business optimization guidance. Here's my comprehensive analysis:

**🔄 Process Automation Opportunities:**
• **Workflow Optimization**: Identify and automate repetitive tasks
• **Customer Journey Automation**: Streamline lead nurturing and conversion
• **Data Integration**: Connect disparate systems for unified operations
• **Communication Automation**: Set up intelligent notification systems

**📊 Strategic Business Analysis:**
• **Efficiency Audits**: Analyze current processes for bottlenecks
• **ROI Optimization**: Prioritize high-impact, low-effort improvements
• **Scalability Planning**: Design systems that grow with your business
• **Competitive Advantage**: Leverage automation for market differentiation

**🛠️ Implementation Roadmap:**
1. **Assessment Phase**: Document current workflows and pain points
2. **Quick Wins**: Implement simple automations for immediate impact
3. **Integration Phase**: Connect tools and systems for seamless operation
4. **Optimization**: Continuously refine and improve automated processes

For detailed business strategy and automation consulting, I recommend visiting dylanallan.io directly for personalized guidance.

Would you like me to help you with any specific aspect of business automation?`;

        return createTextStream(fallbackResponse);
      }
    }
    
    case 'deepseek-coder': {
      const config = await getAIConfig('deepseek-coder');
      if (!config?.api_key) throw new Error('DeepSeek API key not configured');
      
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.api_key}`
        },
        body: JSON.stringify({
          model: 'deepseek-coder',
          messages: [
            { role: 'system', content: getSystemPrompt(provider, request) },
            { role: 'user', content: prompt }
          ],
          stream: true,
          max_tokens: maxTokens,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      }

      return response.body!;
    }
    
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

function getSystemPrompt(provider: string, request: AIRequest): string {
  const basePrompt = "You are a helpful AI assistant.";
  
  switch (request.type) {
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
      return basePrompt;
  }
}

function createTextStream(text: string): ReadableStream {
  return new ReadableStream({
    start(controller) {
      const words = text.split(' ');
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
    console.error('AI Router Error:', error);
    
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