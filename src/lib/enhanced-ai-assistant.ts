import { supabase } from './supabase';
import { aiContextManager } from './ai-context-manager';
import { streamResponse } from './ai';

export interface AIContext {
  sessionId: string;
  userContext?: boolean;
  conversationHistory?: boolean;
  customInstructions?: boolean;
  semanticSearch?: boolean;
  semanticSearchThreshold?: number;
  semanticSearchCount?: number;
}

/**
 * Enhanced AI Assistant with context-aware capabilities
 */
export async function* enhancedAIAssistant(
  prompt: string,
  options: AIContext = { sessionId: crypto.randomUUID() }
): AsyncGenerator<string> {
  try {
    // Set default options
    const {
      sessionId = crypto.randomUUID(),
      userContext = true,
      conversationHistory = true,
      customInstructions = true,
      semanticSearch = true,
      semanticSearchThreshold = 0.7,
      semanticSearchCount = 5
    } = options;

    // Set the session ID in the context manager
    aiContextManager.setSessionId(sessionId);
    
    // Build enhanced prompt with context
    const enhancedPrompt = await aiContextManager.buildEnhancedContext(prompt, {
      includeUserContext: userContext,
      includeHistory: conversationHistory,
      includeCustomInstructions: customInstructions,
      includeSemanticSearch: semanticSearch,
      semanticSearchThreshold,
      semanticSearchCount
    });
    
    // Store user message
    try {
      await storeMessage(sessionId, 'user', prompt);
    } catch (error) {
      console.error('Error storing user message:', error);
    }
    
    // Use streamResponse to get AI response
    let fullResponse = '';
    for await (const chunk of streamResponse(enhancedPrompt, 'gpt-4')) {
      fullResponse += chunk;
      yield chunk;
    }
    
    // Store assistant message
    try {
      await storeMessage(sessionId, 'assistant', fullResponse, 'gpt-4');
    } catch (error) {
      console.error('Error storing assistant message:', error);
    }
  } catch (error) {
    console.error('Enhanced AI Assistant error:', error);
    yield* createErrorGenerator(error, prompt);
  }
}

/**
 * Store a message in the conversation history
 */
async function storeMessage(
  sessionId: string,
  role: string,
  content: string,
  model?: string
): Promise<void> {
  try {
    // Get the latest message index
    const { data: lastMessage, error: indexError } = await supabase
      .from('ai_conversation_history')
      .select('message_index')
      .eq('session_id', sessionId)
      .order('message_index', { ascending: false })
      .limit(1);
    
    const messageIndex = lastMessage && lastMessage.length > 0 ? lastMessage[0].message_index + 1 : 0;
    
    // Generate embedding for the message
    let embedding = null;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        const response = await fetch(`${supabase.supabaseUrl}/functions/v1/generate-embedding`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: content
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          embedding = result.embedding;
        }
      }
    } catch (embeddingError) {
      console.error('Error generating embedding:', embeddingError);
    }
    
    // Store the message
    const { error } = await supabase
      .from('ai_conversation_history')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        session_id: sessionId,
        message_index: messageIndex,
        role,
        content,
        model_used: model,
        tokens_used: Math.ceil(content.length / 4), // Rough estimate
        embedding,
        metadata: {
          timestamp: new Date().toISOString()
        }
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error storing message:', error);
    toast.error('Failed to save conversation history');
  }
}

/**
 * Create an error generator that yields an error message
 */
async function* createErrorGenerator(error: any, prompt: string): AsyncGenerator<string> {
  const errorMessage = `I apologize, but I encountered an error processing your request: "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}".

The specific error was: ${error.message}

Here are some options:
1. Try again in a few moments
2. Try a different approach to your question
3. Check your internet connection

Our team has been notified of this issue and is working to resolve it.`;

  const words = errorMessage.split(' ');
  for (let i = 0; i < words.length; i++) {
    yield words[i] + (i < words.length - 1 ? ' ' : '');
    await new Promise(resolve => setTimeout(resolve, 30));
  }
}