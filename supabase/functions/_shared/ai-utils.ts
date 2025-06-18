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
export const callOpenAI = async (messages: AIMessage[], model: string = 'gpt-3.5-turbo'): Promise<AIResponse> => {
  const provider = getAIProvider('OPENAI');
  if (!provider) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      provider: 'openai',
      model: data.model,
      usage: data.usage,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('OpenAI API call failed:', error);
    throw error;
  }
};

// Anthropic Integration
export const callAnthropic = async (messages: AIMessage[], model: string = 'claude-3-haiku-20240307'): Promise<AIResponse> => {
  const provider = getAIProvider('ANTHROPIC');
  if (!provider) {
    throw new Error('Anthropic API key not configured');
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 1000,
        messages
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      content: data.content[0].text,
      provider: 'anthropic',
      model: data.model,
      usage: data.usage,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Anthropic API call failed:', error);
    throw error;
  }
};

// Google Gemini Integration
export const callGemini = async (messages: AIMessage[], model: string = 'models/gemini-1.5-flash'): Promise<AIResponse> => {
  const provider = getAIProvider('GEMINI');
  if (!provider) {
    throw new Error('Google Gemini API key not configured');
  }

  try {
    // Convert messages to Gemini format
    const contents = messages.map(msg => ({
      parts: [{ text: msg.content }]
    }));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${provider.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return {
      content: data.candidates[0].content.parts[0].text,
      provider: 'gemini',
      model: model,
      usage: data.usageMetadata,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Gemini API call failed:', error);
    throw error;
  }
};

// Smart AI Router - automatically selects the best available provider
export const callAI = async (request: AIRequest): Promise<AIResponse> => {
  const { messages, provider, model } = request;
  
  // If provider is specified, use it
  if (provider) {
    switch (provider) {
      case 'openai':
        return await callOpenAI(messages, model);
      case 'anthropic':
        return await callAnthropic(messages, model);
      case 'gemini':
        return await callGemini(messages, model);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  // Auto-select provider based on availability
  const providers = [
    { name: 'openai', test: () => getAIProvider('OPENAI') },
    { name: 'anthropic', test: () => getAIProvider('ANTHROPIC') },
    { name: 'gemini', test: () => getAIProvider('GEMINI') }
  ];

  for (const provider of providers) {
    if (provider.test()) {
      try {
        switch (provider.name) {
          case 'openai':
            return await callOpenAI(messages, model);
          case 'anthropic':
            return await callAnthropic(messages, model);
          case 'gemini':
            return await callGemini(messages, model);
        }
      } catch (error) {
        logger.warn(`Provider ${provider.name} failed, trying next...`);
        continue;
      }
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