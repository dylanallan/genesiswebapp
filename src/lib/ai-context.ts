import { supabase } from './supabase';
import { streamResponse } from './ai';
import { toast } from 'sonner';

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

    // Create enhanced prompt with context
    let enhancedPrompt = prompt;
    
    // Add user context if enabled
    if (userContext) {
      try {
        const { data, error } = await supabase.rpc('get_user_profile');
        
        if (!error && data) {
          const userContextStr = `
User Context:
- Ancestry: ${data.preferences?.ancestry || 'Not specified'}
- Business Goals: ${data.preferences?.businessGoals || 'Not specified'}
- Cultural Background: ${data.preferences?.culturalBackground || 'Not specified'}
- Business Type: ${data.preferences?.businessType || 'Not specified'}
- Industry Focus: ${data.preferences?.industryFocus || 'Not specified'}
`;
          enhancedPrompt = `${userContextStr}\n\nUser Query: ${prompt}`;
        }
      } catch (error) {
        console.error('Error getting user context:', error);
      }
    }
    
    // Add conversation history if enabled
    if (conversationHistory) {
      try {
        const { data, error } = await supabase
          .from('ai_conversation_history')
          .select('role, content, created_at')
          .eq('session_id', sessionId)
          .order('message_index', { ascending: false })
          .limit(6);
        
        if (!error && data && data.length > 0) {
          const history = data
            .reverse()
            .map(msg => `${msg.role}: ${msg.content}`)
            .join('\n\n');
          
          enhancedPrompt = `
Previous Conversation:
${history}

Current Query: ${enhancedPrompt}`;
        }
      } catch (error) {
        console.error('Error getting conversation history:', error);
      }
    }
    
    // Add custom instructions if enabled
    if (customInstructions) {
      try {
        const { data, error } = await supabase
          .from('ai_custom_instructions')
          .select('instructions')
          .eq('is_active', true)
          .single();
        
        if (!error && data && data.instructions) {
          enhancedPrompt = `
Custom Instructions: ${data.instructions}

Query: ${enhancedPrompt}`;
        }
      } catch (error) {
        console.error('Error getting custom instructions:', error);
      }
    }
    
    // Add semantic search results if enabled
    if (semanticSearch) {
      try {
        // Get embedding for the prompt
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          const response = await fetch(`${supabase.supabaseUrl}/functions/v1/memory-search`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: prompt,
              threshold: semanticSearchThreshold,
              limit: semanticSearchCount,
              includeContent: true
            }),
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.results && result.results.length > 0) {
              const relevantContent = result.results
                .map((item: any) => `RELEVANT CONTENT (${item.role}): ${item.content.substring(0, 300)}${item.content.length > 300 ? '...' : ''}`)
                .join('\n\n');
              
              enhancedPrompt = `
Relevant Knowledge Base Content:
${relevantContent}

Query: ${enhancedPrompt}`;
            }
          }
        }
      } catch (error) {
        console.error('Error performing semantic search:', error);
      }
    }
    
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
 * Save user feedback on AI responses
 */
export async function saveAIFeedback(
  conversationId: string,
  rating: number,
  feedbackText?: string,
  categories?: string[]
): Promise<void> {
  try {
    const { error } = await supabase
      .from('ai_feedback')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        conversation_id: conversationId,
        rating,
        feedback_text: feedbackText,
        categories,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
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