import OpenAI from 'openai';
import { Anthropic } from '@anthropic-ai/sdk';
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

// Initialize OpenAI client with the API key from environment variables if available
const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
let openai: OpenAI | null = null;

if (openaiApiKey) {
  openai = new OpenAI({
    apiKey: openaiApiKey,
    dangerouslyAllowBrowser: true
  });
} else {
  console.warn('OpenAI API key not configured. GPT-4 responses will fall back to another available model.');
}

// Initialize Anthropic client only if API key is available
const anthropicApiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
let anthropic: Anthropic | null = null;

if (anthropicApiKey) {
  anthropic = new Anthropic({
    apiKey: anthropicApiKey
  });
} else {
  console.warn('Anthropic API key not configured. Claude-3 responses will be simulated.');
}

export function getBestModelForTask(task: string): AIModel {
  // If GPT-4 is requested but not available, fall back to another model
  if (!openaiApiKey && task.toLowerCase().includes('gpt-4')) {
    return 'dylan-assistant';
  }

  // Default to Dylan Assistant for most tasks
  if (!task.toLowerCase().includes('specific') && !task.toLowerCase().includes('alternate')) {
    return 'dylan-assistant';
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
    // Skip GPT-4 if OpenAI API key is not configured
    if (model === 'gpt-4' && !openaiApiKey) {
      return { model: model as AIModel, score: -1 };
    }

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

  // Return the model with the highest score, excluding unavailable models
  const bestModel = modelScores
    .filter(m => m.score >= 0)
    .reduce((best, current) => 
      current.score > best.score ? current : best
    );

  return bestModel.model;
}

export async function* streamResponse(prompt: string, model: AIModel = 'dylan-assistant'): AsyncGenerator<string> {
  try {
    // If GPT-4 is requested but not available, fall back to Dylan Assistant
    if (model === 'gpt-4' && !openai) {
      model = 'dylan-assistant';
      yield "Note: Falling back to Dylan Assistant as GPT-4 is not configured.\n\n";
    }

    switch (model) {
      case 'dylan-assistant': {
        const dylanUrl = import.meta.env.VITE_DYLAN_ASSISTANT_URL;
        const dylanKey = import.meta.env.VITE_DYLAN_ASSISTANT_KEY;

        if (!dylanUrl || !dylanKey) {
          throw new Error('Dylan Assistant credentials not configured');
        }

        const response = await fetch(`${dylanUrl}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${dylanKey}`
          },
          body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No reader available');
        }

        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          yield decoder.decode(value);
        }
        break;
      }

      case 'gpt-4': {
        if (!openai) {
          throw new Error('This should not happen as we already checked for OpenAI availability');
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
        break;
      }

      case 'gemini-pro':
      case 'llama-3': {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Supabase credentials not configured');
        }

        const response = await fetch(`${supabaseUrl}/functions/v1/ai-stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ prompt, model })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No reader available');
        }

        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          yield decoder.decode(value);
        }
        break;
      }
    }
  } catch (error) {
    console.error('Error in streamResponse:', error);
    yield `Error: ${error instanceof Error ? error.message : 'An unexpected error occurred'}. Please ensure all required API keys are properly configured in your environment variables.`;
  }
}