import { aiRouter, AIRequest } from './ai-router';
import { supabase } from './supabase';

export type AIModel = 'gpt-4' | 'claude-3' | 'gemini-pro' | 'dylanallan' | 'auto';

export function getBestModelForTask(input: string): AIModel {
  // Analyze input to determine best model
  const businessKeywords = ['automation', 'workflow', 'business', 'strategy', 'consulting', 'efficiency'];
  const culturalKeywords = ['heritage', 'tradition', 'culture', 'ancestry', 'family'];
  const codingKeywords = ['code', 'programming', 'function', 'api', 'development'];
  
  const lowerInput = input.toLowerCase();
  
  if (businessKeywords.some(keyword => lowerInput.includes(keyword))) {
    return 'dylanallan'; // Prefer DylanAllan for business
  }
  
  if (culturalKeywords.some(keyword => lowerInput.includes(keyword))) {
    return 'claude-3'; // Prefer Claude for cultural analysis
  }
  
  if (codingKeywords.some(keyword => lowerInput.includes(keyword))) {
    return 'gpt-4'; // Prefer GPT-4 for coding
  }
  
  return 'auto'; // Let the router decide
}

export async function* streamResponse(
  prompt: string,
  model: AIModel,
  context?: string
): AsyncGenerator<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      // Provide mock response for unauthenticated users
      yield* getMockStreamResponse(prompt);
      return;
    }

    // Determine request type based on prompt content
    const requestType = determineRequestType(prompt);
    
    const request: AIRequest = {
      prompt,
      context,
      type: requestType,
      userId: session.user.id,
      maxTokens: 2000,
      temperature: 0.7
    };

    // If specific model requested, try to use it
    if (model !== 'auto') {
      request.type = mapModelToType(model);
    }

    yield* await aiRouter.routeRequest(request);

  } catch (error) {
    console.error('Error in streamResponse:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      
      // Try fallback response
      yield* getMockStreamResponse(prompt);
    } else {
      throw new Error('Unknown error occurred');
    }
  }
}

function determineRequestType(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('business') || lowerPrompt.includes('automation') || lowerPrompt.includes('workflow')) {
    return 'business';
  }
  
  if (lowerPrompt.includes('culture') || lowerPrompt.includes('heritage') || lowerPrompt.includes('tradition')) {
    return 'cultural';
  }
  
  if (lowerPrompt.includes('code') || lowerPrompt.includes('programming') || lowerPrompt.includes('function')) {
    return 'coding';
  }
  
  if (lowerPrompt.includes('analyze') || lowerPrompt.includes('explain') || lowerPrompt.includes('compare')) {
    return 'analysis';
  }
  
  return 'chat';
}

function mapModelToType(model: AIModel): string {
  switch (model) {
    case 'dylanallan':
      return 'business';
    case 'claude-3':
      return 'cultural';
    case 'gpt-4':
      return 'coding';
    case 'gemini-pro':
      return 'analysis';
    default:
      return 'chat';
  }
}

async function* getMockStreamResponse(prompt: string): AsyncGenerator<string> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const responses = [
    `I understand you're asking about "${prompt}". To access our full AI capabilities including specialized business automation consulting through DylanAllan.io, please sign in.`,
    `That's an interesting question about "${prompt}". Our AI router can connect you with the best specialist for your needs - sign in to unlock this feature.`,
    `I'd love to help with "${prompt}". Once signed in, I can route your request to our most suitable AI specialist, including business automation experts.`
  ];
  
  const response = responses[Math.floor(Math.random() * responses.length)];
  const words = response.split(' ');
  
  for (const word of words) {
    yield word + ' ';
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

export async function getMockResponse(prompt: string): Promise<string> {
  let fullResponse = '';
  for await (const chunk of getMockStreamResponse(prompt)) {
    fullResponse += chunk;
  }
  return fullResponse.trim();
}

export async function checkAIServiceHealth(): Promise<boolean> {
  try {
    const status = await aiRouter.getProviderStatus();
    const activeProviders = Array.from(status.values()).filter(p => p.isActive);
    return activeProviders.length > 0;
  } catch {
    return false;
  }
}

export async function getAIProviderStatus() {
  return await aiRouter.getProviderStatus();
}