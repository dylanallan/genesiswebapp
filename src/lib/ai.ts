import { aiRouter, AIRequest } from './ai-router';
import { supabase } from './supabase';

export type AIModel = 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3' | 'claude-3-opus' | 'claude-3-sonnet' | 'gemini-pro' | 'gemini-1.5-pro' | 'dylanallan' | 'deepseek-coder' | 'ollama' | 'auto';

export function getBestModelForTask(input: string): AIModel {
  // Analyze input to determine best model
  const businessKeywords = ['automation', 'workflow', 'business', 'strategy', 'consulting', 'efficiency', 'process', 'optimization'];
  const culturalKeywords = ['heritage', 'tradition', 'culture', 'ancestry', 'family', 'cultural', 'identity'];
  const codingKeywords = ['code', 'programming', 'function', 'api', 'development', 'debug', 'algorithm', 'software'];
  const analysisKeywords = ['analyze', 'analysis', 'compare', 'evaluate', 'research', 'study', 'examine'];
  
  const lowerInput = input.toLowerCase();
  
  // Check for business automation needs
  if (businessKeywords.some(keyword => lowerInput.includes(keyword))) {
    return 'dylanallan'; // Prefer DylanAllan for business consulting
  }
  
  // Check for coding tasks
  if (codingKeywords.some(keyword => lowerInput.includes(keyword))) {
    return 'deepseek-coder'; // Prefer DeepSeek for coding tasks
  }
  
  // Check for cultural analysis
  if (culturalKeywords.some(keyword => lowerInput.includes(keyword))) {
    return 'claude-3'; // Prefer Claude for cultural analysis
  }
  
  // Check for complex analysis
  if (analysisKeywords.some(keyword => lowerInput.includes(keyword))) {
    return 'gpt-4'; // Prefer GPT-4 for complex analysis
  }
  
  // Default to auto-selection
  return 'auto';
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

    // Determine request type based on prompt content and model
    const requestType = determineRequestType(prompt, model);
    
    const request: AIRequest = {
      prompt,
      context,
      type: requestType,
      userId: session.user.id,
      maxTokens: getMaxTokensForModel(model),
      temperature: getTemperatureForModel(model)
    };

    // Route request through AI router
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

function determineRequestType(prompt: string, model: AIModel): string {
  const lowerPrompt = prompt.toLowerCase();
  
  // Model-specific type mapping
  if (model === 'dylanallan') {
    return 'business';
  }
  
  if (model === 'deepseek-coder') {
    return 'coding';
  }
  
  // Content-based type detection
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

function getMaxTokensForModel(model: AIModel): number {
  switch (model) {
    case 'gpt-4':
      return 4000;
    case 'gpt-3.5-turbo':
      return 2000;
    case 'claude-3':
    case 'claude-3-opus':
    case 'claude-3-sonnet':
      return 3000;
    case 'gemini-pro':
      return 2000;
    case 'gemini-1.5-pro':
      return 4000;
    case 'dylanallan':
      return 3000;
    case 'deepseek-coder':
      return 3000;
    case 'ollama':
      return 2000;
    default:
      return 2000;
  }
}

function getTemperatureForModel(model: AIModel): number {
  switch (model) {
    case 'deepseek-coder':
      return 0.3; // Lower temperature for coding
    case 'dylanallan':
      return 0.7; // Balanced for business consulting
    case 'claude-3':
    case 'claude-3-opus':
      return 0.8; // Higher creativity for cultural analysis
    default:
      return 0.7; // Default balanced temperature
  }
}

async function* getMockStreamResponse(prompt: string): AsyncGenerator<string> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const responses = [
    `I understand you're asking about "${prompt}". To access our full AI capabilities including specialized business automation consulting through DylanAllan.io, advanced coding assistance with DeepSeek, and cultural analysis with Claude, please sign in.`,
    `That's an interesting question about "${prompt}". Our AI router can connect you with the best specialist for your needs - sign in to unlock access to GPT-4, Claude 3, Gemini Pro, and specialized business consultants.`,
    `I'd love to help with "${prompt}". Once signed in, I can route your request to our most suitable AI specialist from our comprehensive suite including OpenAI, Anthropic, Google, and DylanAllan.io experts.`
  ];
  
  const response = responses[Math.floor(Math.random() * responses.length)];
  const words = response.split(' ');
  
  for (const word of words) {
    yield word + ' ';
    await new Promise(resolve => setTimeout(resolve, 80));
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

export async function enableAIProvider(providerId: string, apiKey?: string) {
  return await aiRouter.enableProvider(providerId, apiKey);
}

export async function disableAIProvider(providerId: string) {
  return await aiRouter.disableProvider(providerId);
}

export function getAvailableModels(): { id: AIModel; name: string; description: string }[] {
  return [
    { id: 'auto', name: 'Auto-Select', description: 'Automatically choose the best AI for your task' },
    { id: 'gpt-4', name: 'GPT-4', description: 'OpenAI\'s most capable model for complex reasoning' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient for most tasks' },
    { id: 'claude-3', name: 'Claude 3', description: 'Anthropic\'s model excellent for analysis and cultural topics' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Most capable Claude model for complex tasks' },
    { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Balanced Claude model for general use' },
    { id: 'gemini-pro', name: 'Gemini Pro', description: 'Google\'s advanced AI model' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Latest Google model with enhanced capabilities' },
    { id: 'dylanallan', name: 'DylanAllan.io', description: 'Specialized business automation consultant' },
    { id: 'deepseek-coder', name: 'DeepSeek Coder', description: 'Specialized coding and programming assistant' },
    { id: 'ollama', name: 'Ollama Local', description: 'Local AI models (requires Ollama installation)' }
  ];
}