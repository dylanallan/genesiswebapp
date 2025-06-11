import { supabase } from './supabase';

interface AIRequest {
  message: string;
  context?: string;
  model?: string;
  user?: Record<string, any>;
}

interface AIResponse {
  text: string;
  model: string;
  fallback?: boolean;
}

/**
 * Call the AI router edge function
 */
export async function callAI(request: AIRequest): Promise<AIResponse> {
  try {
    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }
    
    // Call the edge function
    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/ai-router`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('AI client error:', error);
    
    // Return fallback response
    return {
      text: "I'm currently experiencing technical difficulties. Please try again in a moment.",
      model: "fallback",
      fallback: true
    };
  }
}

/**
 * Stream AI response
 */
export async function* streamAI(request: AIRequest): AsyncGenerator<string> {
  try {
    // Get session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      yield* createFallbackStream("Authentication required. Please sign in to continue.");
      return;
    }
    
    // Call the edge function
    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/ai-stream`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: request.message,
        context: request.context,
        model: request.model,
        type: determineRequestType(request.message)
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
    }
    
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }
    
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
  } catch (error) {
    console.error('AI streaming error:', error);
    
    // Return fallback response
    yield* createFallbackStream(
      "I'm currently experiencing technical difficulties. Please try again in a moment."
    );
  }
}

/**
 * Create a fallback stream
 */
async function* createFallbackStream(message: string): AsyncGenerator<string> {
  const words = message.split(' ');
  for (let i = 0; i < words.length; i++) {
    yield words[i] + (i < words.length - 1 ? ' ' : '');
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

/**
 * Determine the request type based on content
 */
function determineRequestType(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('business') || lowerMessage.includes('automation') || 
      lowerMessage.includes('workflow') || lowerMessage.includes('process')) {
    return 'business';
  }
  
  if (lowerMessage.includes('culture') || lowerMessage.includes('heritage') || 
      lowerMessage.includes('tradition') || lowerMessage.includes('ancestry')) {
    return 'cultural';
  }
  
  if (lowerMessage.includes('code') || lowerMessage.includes('programming') || 
      lowerMessage.includes('function') || lowerMessage.includes('debug')) {
    return 'coding';
  }
  
  if (lowerMessage.includes('analyze') || lowerMessage.includes('compare') || 
      lowerMessage.includes('evaluate') || lowerMessage.includes('research')) {
    return 'analysis';
  }
  
  return 'chat';
}