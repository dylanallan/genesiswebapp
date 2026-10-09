import { supabase } from '../lib/supabase';

// Type Definitions
export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: { [key: string]: any };
  created_at: string;
}

export interface ChatResponse {
  response: string;
  conversationId?: string;
  provider: string;
  model: string;
  timestamp: string;
  /** Set when the request was refused, e.g. 'UPGRADE_REQUIRED' (free limit) or 'LIMIT_REACHED'. */
  code?: string;
  remaining?: number;
}

export interface AvailableModel {
  id: string; // provider id sent to the backend; 'auto' lets the server pick
  name: string;
  description: string;
}

export interface ConversationInfo {
  id: string;
  title: string;
  last_updated: string;
}

/** Providers the user can choose between. 'auto' = the first one that is configured and healthy. */
function getAvailableModels(): AvailableModel[] {
  return [
    { id: 'auto', name: 'Auto', description: 'best available' },
    { id: 'anthropic', name: 'Claude', description: 'Anthropic' },
    { id: 'openai', name: 'GPT', description: 'OpenAI' },
    { id: 'gemini', name: 'Gemini', description: 'Google' },
    { id: 'groq', name: 'Llama', description: 'Groq (free)' },
    { id: 'openrouter', name: 'OpenRouter', description: 'free models' },
    { id: 'mistral', name: 'Mistral', description: 'Mistral AI' },
    { id: 'omniroute', name: 'OmniRoute', description: 'free gateway' },
  ];
}

/** Turns a failed Edge Function call into { message, code } using the server's own JSON error. */
async function describeFunctionError(error: unknown): Promise<{ message: string; code?: string }> {
  try {
    const body = await (error as { context?: Response }).context?.json();
    if (body?.error) return { message: body.error, code: body.code };
  } catch { /* fall through */ }
  return { message: 'The AI service is temporarily unavailable. Please try again in a moment.' };
}

/**
 * Sends a message through the secure `ai-router` Edge Function, then saves the exchange to the
 * user's conversation history. Saving is best-effort: a good answer is never discarded because
 * history could not be written.
 */
async function sendMessage(
  message: string,
  options: { conversationId?: string; provider?: string; persist?: boolean } = {},
): Promise<ChatResponse> {
  const { conversationId, provider, persist = true } = options;
  const now = () => new Date().toISOString();

  const { data, error } = await supabase.functions.invoke('ai-router', {
    body: { message, ...(provider && provider !== 'auto' ? { provider } : {}) },
  });

  if (error || data?.error) {
    const { message: errorText, code } = error ? await describeFunctionError(error) : { message: data.error as string, code: data.code as string | undefined };
    return { response: errorText, provider: 'error', model: 'error', conversationId, timestamp: now(), code };
  }

  const result: ChatResponse = {
    response: data.response,
    provider: data.provider,
    model: data.model || 'default',
    conversationId,
    timestamp: now(),
    remaining: data.remaining,
  };

  if (!persist) return result;

  try {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (userId) {
      let id = conversationId;
      if (!id) {
        const { data: conv, error: convError } = await supabase
          .from('conversations')
          .insert({ user_id: userId, title: message.substring(0, 40) })
          .select('id')
          .single();
        if (convError) throw convError;
        id = conv.id;
      }
      const { error: messageError } = await supabase.from('messages').insert([
        { conversation_id: id, role: 'user', content: message },
        { conversation_id: id, role: 'assistant', content: result.response, metadata: { provider: result.provider, model: result.model } },
      ]);
      if (messageError) throw messageError;
      result.conversationId = id;
    }
  } catch (e) {
    console.warn('Could not save conversation history:', e);
  }
  return result;
}

/**
 * Retrieves the message history for a given conversation.
 */
async function getHistory(conversationId?: string): Promise<ChatMessage[]> {
    if (!conversationId) return [];
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching history:', error);
      return [];
    }
    return data as ChatMessage[];
}

/**
 * Retrieves the list of conversations for the current user.
 */
async function getConversationList(): Promise<ConversationInfo[]> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('id, title, updated_at')
      .order('updated_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching conversation list:', error);
      return [];
    }
    
    // Transform the data to match the expected interface
    return data.map((conv: { id: string; title: string; updated_at: string }) => ({
      id: conv.id,
      title: conv.title,
      last_updated: conv.updated_at
    }));
  } catch (error) {
    console.error('Error in getConversationList:', error);
    return [];
  }
}

export const chatApi = {
  sendMessage,
  getAvailableModels,
  getHistory,
  getConversationList
};