import { createClient } from '@supabase/supabase-js';

export type AIModel = 'gpt-4' | 'claude-3' | 'gemini-pro' | 'codex';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function getBestModelForTask(input: string): AIModel {
  const wordCount = input.split(/\s+/).length;
  const hasComplexity = /\b(analyze|compare|explain|evaluate)\b/i.test(input);
  
  if (wordCount > 100 || hasComplexity) {
    return 'gpt-4';
  }
  
  return 'gemini-pro';
}

export async function* streamResponse(
  prompt: string,
  model: AIModel
): AsyncGenerator<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-router`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ prompt, model })
      }
    );

    if (!response.ok) {
      throw new Error(`AI service error: ${response.statusText}`);
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
    yield 'Sorry, I encountered an error. Please try again in a moment.';
  }
}