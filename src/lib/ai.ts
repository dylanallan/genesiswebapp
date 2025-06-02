import { Anthropic } from '@anthropic-ai/sdk';
import { supabase } from './supabase';

export type AIModel = 'claude-3';

interface ModelCapabilities {
  reasoning: number;
  creativity: number;
  knowledge: number;
  speed: number;
  contextLength: number;
  culturalAwareness: number;
  businessInsight: number;
}

const modelCapabilities: Record<AIModel, ModelCapabilities> = {
  'claude-3': {
    reasoning: 0.98,
    creativity: 0.96,
    knowledge: 0.97,
    speed: 0.92,
    contextLength: 100000,
    culturalAwareness: 0.97,
    businessInsight: 0.96
  }
};

const anthropicApiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
let anthropic: Anthropic | null = null;

if (anthropicApiKey) {
  anthropic = new Anthropic({
    apiKey: anthropicApiKey
  });
}

export function getBestModelForTask(_task: string): AIModel {
  return 'claude-3';
}

export async function* streamResponse(prompt: string, _model: AIModel = 'claude-3'): AsyncGenerator<string> {
  try {
    if (!anthropic) {
      yield "I apologize, but I'm currently operating in demo mode as the Anthropic API key is not configured. In a production environment, I would provide AI-generated responses here. For now, I'll acknowledge your input: " + prompt;
      return;
    }

    const stream = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.delta?.text || '';
      if (content) yield content;
    }
  } catch (error) {
    console.error('Error in streamResponse:', error);
    yield `Error: ${error instanceof Error ? error.message : 'An unexpected error occurred'}. Please ensure all required API keys are properly configured in your environment variables.`;
  }
}