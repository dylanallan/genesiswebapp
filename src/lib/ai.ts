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
    return 'codex';
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
    if (model === 'ollama-3.2') {
      const response = await ollama.chat({
        model: 'llama2:3.2',
        messages: [{ role: 'user', content: prompt }],
        stream: true
      });

      for await (const chunk of response) {
        yield chunk.message.content;
      }
      return;
    }

    if (model === 'deepseek-1') {
      const response = await ollama.chat({
        model: 'deepseek-coder:6.7b',
        messages: [{ role: 'user', content: prompt }],
        stream: true
      });

      for await (const chunk of response) {
        yield chunk.message.content;
      }
      return;
    }

    const { data, error } = await supabase.functions.invoke('ai-stream', {
      body: { prompt, model }
    });

    if (error) {
      throw new Error(`Supabase function error: ${error.message}`);
    }

    if (data?.error) {
      throw new Error(`AI Stream error: ${data.error}`);
    }

    const response = new Response(data);
    
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