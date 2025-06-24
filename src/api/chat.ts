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
}

export interface ConversationInfo {
  id: string;
  title: string;
  last_updated: string;
}

/**
 * Sends a message to the AI and stores the conversation history.
 * This function now securely calls our backend `ai-router` Edge Function.
 */
async function sendMessage(message: string, userId: string, conversationId?: string): Promise<ChatResponse> {
  console.log('✉️ Sending message via secure AI Router...');
  
  try {
    const { data: functionData, error: functionError } = await supabase.functions.invoke('ai-router', {
      body: { message },
    });

    if (functionError) throw new Error(`AI Router invocation failed: ${functionError.message}`);
    if (functionData.error) throw new Error(`AI Router error: ${functionData.error}`);
    
    const aiResult = {
      response: functionData.response,
      provider: functionData.provider,
      model: functionData.model || 'default',
    };
    console.log('✅ AI Router responded:', aiResult);

    let currentConversationId = conversationId;
    if (!currentConversationId) {
      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .insert({ user_id: userId, title: message.substring(0, 40) })
        .select('id')
        .single();
      if (convError) throw convError;
      currentConversationId = convData.id;
    }

    const { error: messageError } = await supabase.from('messages').insert([
      { conversation_id: currentConversationId, role: 'user', content: message },
      { conversation_id: currentConversationId, role: 'assistant', content: aiResult.response, metadata: { provider: aiResult.provider, model: aiResult.model } },
    ]);
    if (messageError) console.warn('Could not save message history:', messageError);

    return { 
      response: aiResult.response, 
      conversationId: currentConversationId,
      provider: aiResult.provider,
      model: aiResult.model,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error("An error occurred in sendMessage:", error);
    return {
      response: "I'm sorry, but I was unable to connect to the AI service. Please check your Supabase Function logs for the 'ai-router' and ensure your provider API keys are set correctly in the environment variables.",
      provider: 'error',
      model: 'error',
      conversationId,
      timestamp: new Date().toISOString(),
    };
  }
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

async function getConversationList(): Promise<ConversationInfo[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, title, updated_at as last_updated')
    .order('updated_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching conversation list:', error);
    return [];
  }
  return data;
}

export const chatApi = {
  sendMessage,
  getHistory,
  getConversationList
};