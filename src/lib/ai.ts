import { chatApi } from '../api/chat';
import { toast } from 'sonner';

export type AIModel = 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku' | 'gemini-pro' | 'gemini-1.5-pro' | 'auto';

export class AIRequestError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
  }
}

/**
 * Gets an answer from the secure `ai-router` Edge Function and yields it in small chunks so
 * callers can show a typing effect. Throws AIRequestError (e.g. code 'UPGRADE_REQUIRED') instead
 * of silently substituting canned text. The model hint is ignored: the server picks the best
 * configured provider, so a feature never fails just because one provider's key is missing.
 */
export async function* streamResponse(
  prompt: string,
  _model: AIModel = 'auto', // eslint-disable-line @typescript-eslint/no-unused-vars -- kept for caller compatibility
  context?: string
): AsyncGenerator<string> {
  const message = context ? `${context}\n\n${prompt}` : prompt;
  const result = await chatApi.sendMessage(message.slice(0, 8000), { persist: false });
  if (result.provider === 'error') {
    if (result.code === 'UPGRADE_REQUIRED') toast.info('Free daily AI limit reached — upgrade to Pro to keep going.');
    throw new AIRequestError(result.response, result.code);
  }
  const words = result.response.split(/(\s+)/);
  for (let i = 0; i < words.length; i += 8) {
    yield words.slice(i, i + 8).join('');
  }
}
