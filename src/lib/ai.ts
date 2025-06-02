import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from './supabase';

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
    reasoning: 0.98,
    creativity: 0.96,
    knowledge: 0.97,
    speed: 0.92,
    contextLength: 100000,
    culturalAwareness: 0.97,
    businessInsight: 0.96
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

const anthropicApiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;

if (!anthropicApiKey) {
  throw new Error('Anthropic API key is not configured. Please add VITE_ANTHROPIC_API_KEY to your environment variables.');
}

const anthropic = new Anthropic({
  apiKey: anthropicApiKey
});

export function getBestModelForTask(task: string): AIModel {
  // Default to Claude-3 for most tasks
  if (!task.toLowerCase().includes('specific') && !task.toLowerCase().includes('alternate')) {
    return 'claude-3';
  }

  const lowercaseTask = task.toLowerCase();
  
  // Define task-specific keywords and their associated capabilities
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

  // Calculate scores for each model based on task requirements
  const modelScores = Object.entries(modelCapabilities).map(([model, capabilities]) => {
    let score = 0;
    
    // Check each task pattern
    Object.entries(taskPatterns).forEach(([_, pattern]) => {
      const matchesKeywords = pattern.keywords.some(keyword => 
        lowercaseTask.includes(keyword)
      );
      
      if (matchesKeywords) {
        // Add capability scores for this pattern
        pattern.capabilities.forEach(capability => {
          score += capabilities[capability as keyof ModelCapabilities];
        });
      }
    });

    // Consider context length if the task seems to require it
    if (task.length > 1000 || task.includes('context') || task.includes('history')) {
      score += capabilities.contextLength / 100000; // Normalize to 0-1 range
    }

    return { model: model as AIModel, score };
  });

  // Return the model with the highest score
  const bestModel = modelScores.reduce((best, current) => 
    current.score > best.score ? current : best
  );

  return bestModel.model;
}

export async function* streamResponse(prompt: string, model: AIModel = 'claude-3'): AsyncGenerator<string> {
  try {
    switch (model) {
      case 'claude-3': {
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

      default:
        throw new Error(`Unsupported model: ${model}`);
    }
  } catch (error) {
    console.error('Error in streamResponse:', error);
    yield `Error: ${error instanceof Error ? error.message : 'An unexpected error occurred'}. Please ensure all required API keys are properly configured in your environment variables.`;
  }
}