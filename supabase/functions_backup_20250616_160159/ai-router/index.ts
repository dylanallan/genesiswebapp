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
  message: string;
  user?: Record<string, any>;
  context?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

interface AIResponse {
  text: string;
  model: string;
  fallback?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
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
    const { message, context, model = 'gpt-4' } = await req.json() as AIRequest;

    if (!message) {
      throw new Error('Message is required');
    }

    // Log request start
    const requestStartTime = Date.now();
    
    try {
      // Try primary model (OpenAI)
      const openaiConfig = await getAIConfig('openai');
      if (!openaiConfig?.api_key) {
        throw new Error('OpenAI API key not configured');
      }
      
      const openai = new OpenAI({ apiKey: openaiConfig.api_key });
      
      const completion = await openai.chat.completions.create({
        model: model === 'gpt-4' ? 'gpt-4-turbo-preview' : 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: getSystemPrompt(user) },
          ...(context ? [{ role: 'user', content: context }] : []),
          { role: 'user', content: message }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        throw new Error('OpenAI returned empty response');
      }
      
      // Log successful request
      await logRequest(
        user.id, 
        'openai', 
        model, 
        message.length, 
        response.length, 
        Date.now() - requestStartTime, 
        true
      );
      
      return new Response(
        JSON.stringify({ 
          text: response, 
          model: model === 'gpt-4' ? 'gpt-4-turbo-preview' : 'gpt-3.5-turbo'
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (openAIError) {
      console.error('OpenAI failed:', openAIError);
      
      // Log failed request
      await logRequest(
        user.id, 
        'openai', 
        model, 
        message.length, 
        0, 
        Date.now() - requestStartTime, 
        false, 
        openAIError.message
      );
      
      try {
        // Fallback to Anthropic
        const anthropicConfig = await getAIConfig('anthropic');
        if (!anthropicConfig?.api_key) {
          throw new Error('Anthropic API key not configured');
        }
        
        const anthropic = new Anthropic({ apiKey: anthropicConfig.api_key });
        
        const fallbackStartTime = Date.now();
        
        const response = await anthropic.messages.create({
          model: 'claude-3-opus-20240229',
          max_tokens: 2000,
          messages: [
            { role: 'user', content: `${getSystemPrompt(user)}\n\n${message}` }
          ]
        });

        const fallbackResponse = response.content[0].text;
        
        if (!fallbackResponse) {
          throw new Error('Anthropic returned empty response');
        }
        
        // Log successful fallback request
        await logRequest(
          user.id, 
          'anthropic', 
          'claude-3-opus', 
          message.length, 
          fallbackResponse.length, 
          Date.now() - fallbackStartTime, 
          true
        );
        
        return new Response(
          JSON.stringify({ 
            text: fallbackResponse, 
            model: 'claude-3-opus',
            fallback: true 
          }),
          {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
            },
          }
        );
      } catch (anthropicError) {
        console.error('Anthropic failed:', anthropicError);
        
        // Try one more fallback to Google
        try {
          const googleConfig = await getAIConfig('google');
          if (!googleConfig?.api_key) {
            throw new Error('Google API key not configured');
          }
          
          const genAI = new GoogleGenerativeAI(googleConfig.api_key);
          const geminiModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
          
          const fallbackStartTime = Date.now();
          
          const result = await geminiModel.generateContent(`${getSystemPrompt(user)}\n\n${message}`);
          const fallbackResponse = result.response.text();
          
          if (!fallbackResponse) {
            throw new Error('Google returned empty response');
          }
          
          // Log successful fallback request
          await logRequest(
            user.id, 
            'google', 
            'gemini-pro', 
            message.length, 
            fallbackResponse.length, 
            Date.now() - fallbackStartTime, 
            true
          );
          
          return new Response(
            JSON.stringify({ 
              text: fallbackResponse, 
              model: 'gemini-pro',
              fallback: true 
            }),
            {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            }
          );
        } catch (googleError) {
          console.error('Google failed:', googleError);
          
          // All providers failed, return static fallback
          return new Response(
            JSON.stringify({
              text: "I'm currently experiencing technical difficulties connecting to my AI providers. Please try again in a few moments or contact support if the issue persists.",
              model: "fallback",
              fallback: true
            }),
            {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
              },
            }
          );
        }
      }
    }
  } catch (error) {
    console.error('AI router error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
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

function getSystemPrompt(user: any): string {
  return `You are Genesis AI Assistant Pro, an advanced AI assistant with expertise in both business automation and cultural heritage preservation.

You help users with:
1. Business automation strategies and workflow optimization
2. Cultural heritage preservation and exploration
3. Technical problem-solving and development
4. Creative projects and content creation

User information:
- Name: ${user.user_metadata?.full_name || 'User'}
- Email: ${user.email}

Always provide helpful, accurate, and thoughtful responses. If you're unsure about something, acknowledge the limitations of your knowledge.`;
}

async function logRequest(
  userId: string,
  provider: string,
  model: string,
  promptLength: number,
  responseLength: number,
  responseTime: number,
  success: boolean,
  errorMessage?: string
) {
  try {
    await supabase
      .from('ai_request_logs')
      .insert({
        user_id: userId,
        provider_id: provider,
        request_type: 'chat',
        prompt_length: promptLength,
        response_length: responseLength,
        tokens_used: Math.ceil((promptLength + responseLength) / 4), // Rough estimate
        cost: calculateCost(provider, model, promptLength + responseLength),
        response_time_ms: responseTime,
        success,
        error_message: errorMessage,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging request:', error);
  }
}

function calculateCost(provider: string, model: string, totalTokens: number): number {
  const tokenEstimate = Math.ceil(totalTokens / 4); // Rough token estimate
  
  // Cost per 1000 tokens in USD
  const costPer1K: Record<string, number> = {
    'gpt-4-turbo-preview': 0.01,
    'gpt-3.5-turbo': 0.0015,
    'claude-3-opus': 0.015,
    'claude-3-sonnet': 0.003,
    'gemini-pro': 0.0005
  };
  
  const rate = costPer1K[model] || 0.01;
  return (tokenEstimate / 1000) * rate;
}