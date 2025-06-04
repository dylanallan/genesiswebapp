import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export type AIModel = 'gpt-4' | 'claude-3' | 'gemini-pro' | 'llama-3';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

/**
 * Determines the best AI model for a given task based on input content
 */
export function getBestModelForTask(input: string): AIModel {
  // Simple logic to choose model based on input length and complexity
  const wordCount = input.split(/\s+/).length;
  const hasComplexity = /\b(analyze|compare|explain|evaluate)\b/i.test(input);
  
  if (wordCount > 100 || hasComplexity) {
    return 'gpt-4'; // Use most capable model for complex or long inputs
  }
  
  return 'gemini-pro'; // Default to balanced model for general queries
}

/**
 * Streams AI response chunks from the edge function or OpenAI
 */
export async function* streamResponse(
  prompt: string,
  model: AIModel
): AsyncGenerator<string> {
  try {
    if (model === 'gpt-4') {
      const stream = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [{ role: 'user', content: prompt }],
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.choices[0]?.delta?.content) {
          yield chunk.choices[0].delta.content;
        }
      }
    } else {
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
    }
  } catch (error) {
    console.error('Error in streamResponse:', error);
    throw error;
  }
}