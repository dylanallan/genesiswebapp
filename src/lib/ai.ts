import { createClient } from '@supabase/supabase-js';
import { Ollama } from 'ollama';

export type AIModel = 'gpt-4' | 'claude-3' | 'gemini-pro' | 'codex' | 'deepseek-1' | 'ollama-3.2';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const ollama = new Ollama({
  host: 'http://localhost:11434'
});

export function getBestModelForTask(input: string): AIModel {
  const wordCount = input.split(/\s+/).length;
  const hasComplexity = /\b(analyze|compare|explain|evaluate)\b/i.test(input);
  const hasCreativity = /\b(create|design|generate|imagine)\b/i.test(input);
  const hasCode = /\b(code|program|function|class|algorithm)\b/i.test(input);
  
  if (hasCode) {
    return 'deepseek-1';
  } else if (hasCreativity) {
    return 'claude-3';
  } else if (wordCount > 100 || hasComplexity) {
    return 'gpt-4';
  } else if (wordCount < 50) {
    return 'ollama-3.2';
  }
  
  return 'gemini-pro';
}

export async function* streamResponse(
  prompt: string,
  model: AIModel
): AsyncGenerator<string> {
  try {
    // Try local models first if they're requested
    if (model === 'ollama-3.2' || model === 'deepseek-1') {
      try {
        const modelName = model === 'ollama-3.2' ? 'llama2:3.2' : 'deepseek-coder:6.7b';
        const response = await ollama.chat({
          model: modelName,
          messages: [{ role: 'user', content: prompt }],
          stream: true
        });

        for await (const chunk of response) {
          yield chunk.message.content;
        }
        return;
      } catch (error) {
        console.warn('Local model unavailable:', error);
        yield 'Local AI model is not available. Falling back to cloud model...';
        // Fall through to cloud models
      }
    }

    // Check if we have the required environment variables
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      throw new Error('Missing required Supabase configuration. Please check your environment variables.');
    }

    // Fall back to cloud models
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ prompt, model })
      }
    );

    if (!response.ok) {
      let errorMessage = 'Failed to connect to AI service';
      try {
        const errorData = await response.json();
        errorMessage = errorData.details || errorData.error || response.statusText;
      } catch {
        // If we can't parse the error JSON, use the status text
        errorMessage = response.statusText;
      }
      throw new Error(`AI service error: ${errorMessage}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      const chunk = decoder.decode(value, { stream: true });
      yield chunk;
    }
  } catch (error) {
    console.error('Error in streamResponse:', error);
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        yield 'Unable to connect to the AI service. Please check your internet connection and try again. If the problem persists, the service may be temporarily unavailable.';
      } else {
        yield `AI Service Error: ${error.message}`;
      }
    } else {
      yield 'An unexpected error occurred while connecting to the AI service. Please try again later.';
    }
  }
}