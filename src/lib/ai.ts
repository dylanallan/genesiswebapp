import { createClient } from '@supabase/supabase-js';
import { Ollama } from 'ollama';

export type AIModel = 'gpt-4' | 'claude-3' | 'gemini-pro' | 'llama-3' | 'deepseek-1' | 'ollama-3.2' | 'dylan-allan';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const ollama = new Ollama({
  host: 'http://localhost:11434'
});

const DYLAN_ALLAN_API_KEY = '1097107540373-3c2pnab29djjn7fqnf36gk8sh3n8rdoi.apps.googleusercontent.com';
const DYLAN_ALLAN_SECRET = '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';

export function getBestModelForTask(input: string): AIModel {
  // Default to Dylan Allan AI for most interactions
  return 'dylan-allan';
}

export async function* streamResponse(
  prompt: string,
  model: AIModel
): AsyncGenerator<string> {
  try {
    if (model === 'dylan-allan') {
      const { data, error } = await supabase.functions.invoke('ai-stream', {
        body: { 
          prompt,
          model,
          apiKey: DYLAN_ALLAN_API_KEY,
          apiSecret: DYLAN_ALLAN_SECRET
        }
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      if (!data || !data.url || !data.headers) {
        throw new Error('Invalid response from AI stream function');
      }

      const response = await fetch(data.url, { headers: data.headers });
      
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
      return;
    }

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

    if (!data || !data.url || !data.headers) {
      throw new Error('Invalid response from AI stream function');
    }

    const response = await fetch(data.url, { headers: data.headers });
    
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