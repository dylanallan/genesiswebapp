import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from './supabase';

interface AIRequest {
  user?: Record<string, any>;
  message: string;
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

// Cache API keys to avoid repeated database calls
const apiKeyCache = new Map<string, string>();

/**
 * Get API key from database or cache
 */
async function getApiKey(provider: string): Promise<string> {
  // Check cache first
  if (apiKeyCache.has(provider)) {
    return apiKeyCache.get(provider)!;
  }
  
  // Get from database
  try {
    const { data, error } = await supabase
      .from('ai_service_config')
      .select('api_key')
      .eq('service_name', provider)
      .eq('is_active', true)
      .maybeSingle();
    
    if (error || !data?.api_key) {
      throw new Error(`${provider} API key not configured`);
    }
    
    // Cache the key
    apiKeyCache.set(provider, data.api_key);
    return data.api_key;
  } catch (error) {
    console.error(`Failed to get ${provider} API key:`, error);
    throw error;
  }
}

/**
 * Call OpenAI API
 */
export async function callOpenAI(request: AIRequest): Promise<AIResponse> {
  const apiKey = await getApiKey('openai');
  const openai = new OpenAI({ apiKey });
  
  const completion = await openai.chat.completions.create({
    model: request.model === 'gpt-4' ? 'gpt-4-turbo-preview' : 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: getSystemPrompt(request.user) },
      ...(request.context ? [{ role: 'user', content: request.context }] : []),
      { role: 'user', content: request.message }
    ],
    max_tokens: request.maxTokens || 2000,
    temperature: request.temperature || 0.7
  });

  const response = completion.choices[0]?.message?.content;
  
  if (!response) {
    throw new Error('OpenAI returned empty response');
  }
  
  return {
    text: response,
    model: request.model === 'gpt-4' ? 'gpt-4-turbo-preview' : 'gpt-3.5-turbo'
  };
}

/**
 * Call Anthropic API
 */
export async function callAnthropic(request: AIRequest): Promise<AIResponse> {
  const apiKey = await getApiKey('anthropic');
  const anthropic = new Anthropic({ apiKey });
  
  const response = await anthropic.messages.create({
    model: 'claude-3-opus-20240229',
    max_tokens: request.maxTokens || 2000,
    messages: [
      { role: 'user', content: `${getSystemPrompt(request.user)}\n\n${request.message}` }
    ]
  });

  const text = response.content[0].text;
  
  if (!text) {
    throw new Error('Anthropic returned empty response');
  }
  
  return {
    text,
    model: 'claude-3-opus',
    fallback: true
  };
}

/**
 * Call Google Gemini API
 */
export async function callGemini(request: AIRequest): Promise<AIResponse> {
  const apiKey = await getApiKey('google');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  
  // Format prompt with system instructions
  const prompt = `${getSystemPrompt(request.user)}\n\n${request.message}`;
  
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  if (!text) {
    throw new Error('Google returned empty response');
  }
  
  return {
    text,
    model: 'gemini-pro',
    fallback: true
  };
}

/**
 * Get system prompt based on user info
 */
function getSystemPrompt(user?: Record<string, any>): string {
  return `You are Genesis AI Assistant Pro, an advanced AI assistant with expertise in both business automation and cultural heritage preservation.

You help users with:
1. Business automation strategies and workflow optimization
2. Cultural heritage preservation and exploration
3. Technical problem-solving and development
4. Creative projects and content creation

${user ? `User information:
- Name: ${user.name || 'User'}
- Email: ${user.email || 'Unknown'}
${user.ancestry ? `- Ancestry: ${user.ancestry}` : ''}
${user.businessGoals ? `- Business Goals: ${user.businessGoals}` : ''}` : ''}

Always provide helpful, accurate, and thoughtful responses. If you're unsure about something, acknowledge the limitations of your knowledge.`;
}

/**
 * Log AI request to database
 */
export async function logAIRequest(
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

/**
 * Calculate estimated cost of request
 */
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