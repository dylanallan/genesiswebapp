import OpenAI from 'openai';
import { toast } from 'sonner';

export type AIModel = 'gpt-4' | 'gpt-3.5-turbo';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function* streamResponse(prompt: string, model: AIModel = 'gpt-4'): AsyncGenerator<string> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      toast.error('OpenAI API key is missing. Please check your environment variables.');
      throw new Error('OpenAI API key is not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
    }

    const stream = await openai.chat.completions.create({
      model: model === 'gpt-4' ? 'gpt-4-turbo-preview' : 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) yield content;
    }
  } catch (error) {
    console.error('Error in streamResponse:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    toast.error(errorMessage);
    yield `Error: ${errorMessage}. Please ensure your OpenAI API key is properly configured.`;
  }
}