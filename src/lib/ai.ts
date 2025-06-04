import { createClient } from '@supabase/supabase-js';

export type AIModel = 'gpt-4' | 'claude-3' | 'gemini-pro' | 'llama-3';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Determines the best AI model for a given task based on input content
 */
export function getBestModelForTask(input: string): AIModel {
  const wordCount = input.split(/\s+/).length;
  const hasComplexity = /\b(analyze|compare|explain|evaluate)\b/i.test(input);
  const hasCreativity = /\b(create|design|generate|imagine)\b/i.test(input);
  
  if (hasCreativity) {
    return 'claude-3';
  } else if (wordCount > 100 || hasComplexity) {
    return 'gpt-4';
  }
  
  return 'gemini-pro';
}

/**
 * Streams AI response chunks from the edge function
 */
export async function* streamResponse(
  prompt: string,
  model: AIModel
): AsyncGenerator<string> {
  try {
    const { data: { url, headers } } = await supabase.functions.invoke('ai-stream', {
      body: { prompt, model }
    });

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Stream request failed: ${response.statusText}`);
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
    throw error;
  }
}