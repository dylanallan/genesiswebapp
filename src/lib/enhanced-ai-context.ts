import { supabase } from './supabase';

export interface AIContext {
  sessionId: string;
  userContext?: boolean;
  conversationHistory?: boolean;
  customInstructions?: boolean;
  semanticSearch?: boolean;
  semanticSearchThreshold?: number;
  semanticSearchCount?: number;
}

export interface AIResponse {
  content: string;
  model: string;
  sessionId: string;
  tokensUsed?: number;
  processingTime?: number;
}

/**
 * Enhanced AI Assistant with context-aware capabilities
 */
export async function enhancedAIAssistant(
  prompt: string,
  options: AIContext = { sessionId: crypto.randomUUID() }
): Promise<AsyncGenerator<string>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

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

    // Call the enhanced-ai-assistant edge function
    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/enhanced-ai-assistant`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        sessionId,
        includeUserContext: userContext,
        includeHistory: conversationHistory,
        includeCustomInstructions: customInstructions,
        includeSemanticSearch: semanticSearch,
        semanticSearchThreshold,
        semanticSearchCount
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Assistant error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    return createStreamGenerator(reader);
  } catch (error) {
    console.error('Enhanced AI Assistant error:', error);
    return createErrorGenerator(error, prompt);
  }
}

/**
 * Save user feedback on AI responses
 */
export async function saveAIFeedback(
  conversationId: string,
  rating: number,
  feedbackText?: string,
  categories?: string[]
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }

    await fetch(`${supabase.supabaseUrl}/functions/v1/ai-feedback`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversationId,
        rating,
        feedback: feedbackText,
        categories
      }),
    });
  } catch (error) {
    console.error('Error saving AI feedback:', error);
    throw error;
  }
}

/**
 * Save custom instructions for the AI
 */
export async function saveCustomInstructions(instructions: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('ai_custom_instructions')
      .upsert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        instructions,
        is_active: true,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving custom instructions:', error);
    throw error;
  }
}

/**
 * Create a stream generator from a ReadableStreamDefaultReader
 */
async function* createStreamGenerator(reader: ReadableStreamDefaultReader<Uint8Array>): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        yield chunk;
      }
    }
  } finally {
    reader.releaseLock();
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