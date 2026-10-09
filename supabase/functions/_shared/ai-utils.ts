import { createLogger } from './logger.ts';

const logger = createLogger('ai-utils');

export interface AIProvider {
  name: string;
  apiKey: string;
  baseUrl?: string;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  provider?: 'openai' | 'anthropic' | 'gemini';
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  usage?: any;
  timestamp: string;
}

export const getAIProvider = (providerName: string): AIProvider | null => {
  try {
    const apiKey = Deno.env.get(`${providerName.toUpperCase()}_API_KEY`);
    if (!apiKey) {
      logger.warn(`No API key found for provider: ${providerName}`);
      return null;
    }

    return {
      name: providerName,
      apiKey,
      baseUrl: Deno.env.get(`${providerName.toUpperCase()}_BASE_URL`)
    };
  } catch (error) {
    logger.error(`Error getting AI provider ${providerName}:`, error);
    return null;
  }
};

export const validateAIRequest = (request: any): boolean => {
  if (!request || typeof request !== 'object') {
    return false;
  }

  if (!request.messages || !Array.isArray(request.messages)) {
    return false;
  }

  return true;
};

export const formatAIResponse = (response: any, provider: string): AIResponse => {
  return {
    content: response.content || response.text || response.message || '',
    provider,
    model: response.model || 'unknown',
    usage: response.usage || {},
    timestamp: new Date().toISOString()
  };
};

// OpenAI Integration
export interface CallOptions {
  maxTokens?: number;
  temperature?: number;
}

// Default models are overridable with env vars so a retired model never needs a code change.
const DEFAULT_MODELS = {
  openai: () => Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini',
  anthropic: () => Deno.env.get('ANTHROPIC_MODEL') ?? 'claude-sonnet-5-5',
  gemini: () => Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.0-flash',
};

const splitSystem = (messages: AIMessage[]) => ({
  system: messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n'),
  turns: messages.filter((m) => m.role !== 'system') as Array<{ role: 'user' | 'assistant'; content: string }>,
});

async function failIfNotOk(response: Response, name: string) {
  if (!response.ok) {
    // Log the provider's detail server-side; callers only get the status.
    logger.error(`${name} API error ${response.status}:`, await response.text());
    throw new Error(`${name} API error: ${response.status}`);
  }
}

export const callOpenAI = async (messages: AIMessage[], model: string = DEFAULT_MODELS.openai(), opts: CallOptions = {}): Promise<AIResponse> => {
  const provider = getAIProvider('OPENAI');
  if (!provider) throw new Error('OpenAI API key not configured');

  const response = await fetch(`${provider.baseUrl ?? 'https://api.openai.com'}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${provider.apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, max_tokens: opts.maxTokens ?? 1000, temperature: opts.temperature ?? 0.7 }),
  });
  await failIfNotOk(response, 'OpenAI');
  const data = await response.json();
  return {
    content: data.choices[0].message.content,
    provider: 'openai',
    model: data.model,
    usage: data.usage,
    timestamp: new Date().toISOString(),
  };
};

// Anthropic: `system` is a top-level field, and auth uses x-api-key (not Authorization).
export const callAnthropic = async (messages: AIMessage[], model: string = DEFAULT_MODELS.anthropic(), opts: CallOptions = {}): Promise<AIResponse> => {
  const provider = getAIProvider('ANTHROPIC');
  if (!provider) throw new Error('Anthropic API key not configured');

  const { system, turns } = splitSystem(messages);
  const response = await fetch(`${provider.baseUrl ?? 'https://api.anthropic.com'}/v1/messages`, {
    method: 'POST',
    headers: { 'x-api-key': provider.apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      max_tokens: opts.maxTokens ?? 1000,
      temperature: opts.temperature ?? 0.7,
      ...(system ? { system } : {}),
      messages: turns,
    }),
  });
  await failIfNotOk(response, 'Anthropic');
  const data = await response.json();
  return {
    content: data.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join(''),
    provider: 'anthropic',
    model: data.model,
    usage: data.usage,
    timestamp: new Date().toISOString(),
  };
};

// Gemini: roles are 'user' | 'model'; system text goes in systemInstruction; key goes in a header.
export const callGemini = async (messages: AIMessage[], model: string = DEFAULT_MODELS.gemini(), opts: CallOptions = {}): Promise<AIResponse> => {
  const provider = getAIProvider('GEMINI');
  if (!provider) throw new Error('Google Gemini API key not configured');

  const { system, turns } = splitSystem(messages);
  const modelPath = model.startsWith('models/') ? model : `models/${model}`;
  const response = await fetch(`${provider.baseUrl ?? 'https://generativelanguage.googleapis.com'}/v1beta/${modelPath}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': provider.apiKey },
    body: JSON.stringify({
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      contents: turns.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      generationConfig: { maxOutputTokens: opts.maxTokens ?? 1000, temperature: opts.temperature ?? 0.7 },
    }),
  });
  await failIfNotOk(response, 'Gemini');
  const data = await response.json();
  return {
    content: data.candidates[0].content.parts.map((p: any) => p.text).join(''),
    provider: 'gemini',
    model: modelPath,
    usage: data.usageMetadata,
    timestamp: new Date().toISOString(),
  };
};

// Smart AI Router - uses the requested provider, or tries each configured one in order
export const callAI = async (request: AIRequest): Promise<AIResponse> => {
  const { messages, provider, model } = request;
  const opts: CallOptions = { maxTokens: request.maxTokens, temperature: request.temperature };
  const callers = { openai: callOpenAI, anthropic: callAnthropic, gemini: callGemini } as const;

  if (provider) {
    const call = callers[provider];
    if (!call) throw new Error(`Unknown provider: ${provider}`);
    return await call(messages, model, opts);
  }

  for (const name of ['anthropic', 'openai', 'gemini'] as const) {
    if (!getAIProvider(name)) continue;
    try {
      // A model name only makes sense for the provider that owns it, so it is not forwarded when auto-selecting.
      return await callers[name](messages, undefined, opts);
    } catch (_error) {
      logger.warn(`Provider ${name} failed, trying next...`);
    }
  }
  throw new Error('No AI providers available');
};

// Context-aware message processing
export const processMessageWithContext = async (
  message: string, 
  userId: string, 
  context?: any
): Promise<AIResponse> => {
  const systemPrompt = `You are Genesis Heritage AI, an intelligent assistant that helps users explore their family history, cultural heritage, and business automation while preserving traditional wisdom.

Key capabilities:
- Genealogy research and DNA analysis
- Document analysis and historical research
- Cultural heritage preservation
- Business automation with cultural intelligence
- Voice story generation and family history

Always be helpful, culturally sensitive, and provide accurate information. If you're unsure about something, say so rather than guessing.`;

  const messages: AIMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message }
  ];

  // Add context if available
  if (context) {
    if (context.conversation_history) {
      messages.splice(1, 0, ...context.conversation_history);
    }
    if (context.user_profile) {
      const profilePrompt = `User Profile: ${JSON.stringify(context.user_profile)}`;
      messages.splice(1, 0, { role: 'system', content: profilePrompt });
    }
  }

  return await callAI({ messages });
}; 