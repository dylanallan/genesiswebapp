import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from './supabase';
import { toast } from 'sonner';

export type AIModel = 'dylan-assistant' | 'gpt-4' | 'claude-3' | 'gemini-pro' | 'llama-3';

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
  'dylan-assistant': {
    reasoning: 0.98,
    creativity: 0.95,
    knowledge: 0.97,
    speed: 0.94,
    contextLength: 32768,
    culturalAwareness: 0.96,
    businessInsight: 0.97
  },
  'gpt-4': {
    reasoning: 0.95,
    creativity: 0.9,
    knowledge: 0.95,
    speed: 0.85,
    contextLength: 8192,
    culturalAwareness: 0.93,
    businessInsight: 0.94
  },
  'claude-3': {
    reasoning: 0.93,
    creativity: 0.92,
    knowledge: 0.94,
    speed: 0.88,
    contextLength: 100000,
    culturalAwareness: 0.95,
    businessInsight: 0.92
  },
  'gemini-pro': {
    reasoning: 0.9,
    creativity: 0.85,
    knowledge: 0.92,
    speed: 0.95,
    contextLength: 32768,
    culturalAwareness: 0.91,
    businessInsight: 0.9
  },
  'llama-3': {
    reasoning: 0.92,
    creativity: 0.88,
    knowledge: 0.91,
    speed: 0.93,
    contextLength: 16384,
    culturalAwareness: 0.94,
    businessInsight: 0.91
  }
};

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY
});

export function getBestModelForTask(task: string): AIModel {
  // Check if OpenAI API key is available
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!openaiKey) {
    toast.error('OpenAI API key not configured. Please check your environment variables.');
    throw new Error('OpenAI API key not configured');
  }

  // If no specific model is requested, use GPT-4 as the default
  if (!task.toLowerCase().includes('specific') && !task.toLowerCase().includes('alternate')) {
    return 'gpt-4';
  }

  const lowercaseTask = task.toLowerCase();
  
  const taskPatterns = {
    cultural: {
      keywords: ['culture', 'tradition', 'heritage', 'ancestry', 'family', 'history'],
      capabilities: ['culturalAwareness', 'knowledge']
    },
    business: {
      keywords: ['business', 'strategy', 'optimization', 'efficiency', 'workflow'],
      capabilities: ['businessInsight', 'reasoning']
    },
    creative: {
      keywords: ['imagine', 'create', 'design', 'story', 'narrative'],
      capabilities: ['creativity', 'culturalAwareness']
    },
    analysis: {
      keywords: ['analyze', 'examine', 'investigate', 'research', 'study'],
      capabilities: ['reasoning', 'knowledge']
    }
  };

  const modelScores = Object.entries(modelCapabilities).map(([model, capabilities]) => {
    let score = 0;
    
    Object.entries(taskPatterns).forEach(([_, pattern]) => {
      const matchesKeywords = pattern.keywords.some(keyword => 
        lowercaseTask.includes(keyword)
      );
      
      if (matchesKeywords) {
        pattern.capabilities.forEach(capability => {
          score += capabilities[capability as keyof ModelCapabilities];
        });
      }
    });

    if (task.length > 1000 || task.includes('context') || task.includes('history')) {
      score += capabilities.contextLength / 100000;
    }

    return { model: model as AIModel, score };
  });

  const bestModel = modelScores.reduce((best, current) => 
    current.score > best.score ? current : best
  );

  return bestModel.model;
}

export async function* streamResponse(prompt: string, model: AIModel = 'gpt-4'): AsyncGenerator<string> {
  try {
    switch (model) {
      case 'gpt-4': {
        if (!import.meta.env.VITE_OPENAI_API_KEY) {
          throw new Error('OpenAI API key not configured. Please check your environment variables.');
        }

        const stream = await openai.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [{ role: 'user', content: prompt }],
          stream: true
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) yield content;
        }
        break;
      }

      case 'claude-3': {
        if (!import.meta.env.VITE_ANTHROPIC_API_KEY) {
          throw new Error('Anthropic API key not configured. Please check your environment variables.');
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
        break;
      }

      case 'gemini-pro':
      case 'llama-3': {
        const { data, error } = await supabase.functions.invoke('ai-stream', {
          body: { prompt, model }
        });

        if (error) throw error;

        for await (const chunk of data) {
          yield chunk;
        }
        break;
      }

      default:
        throw new Error(`Unsupported model: ${model}`);
    }
  } catch (error) {
    console.error('Error in streamResponse:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    toast.error(`AI Error: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}