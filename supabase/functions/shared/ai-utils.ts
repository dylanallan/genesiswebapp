import { createLogger } from './logger.ts';

const logger = createLogger('ai-utils');

export interface AIProvider {
  name: string;
  apiKey: string;
  baseUrl?: string;
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

export const formatAIResponse = (response: any, provider: string): any => {
  return {
    content: response.content || response.text || response.message || '',
    provider,
    timestamp: new Date().toISOString(),
    metadata: {
      model: response.model || 'unknown',
      usage: response.usage || {}
    }
  };
}; 