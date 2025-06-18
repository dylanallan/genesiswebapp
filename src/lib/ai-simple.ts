import { supabase } from './supabase';

export type AIModel = 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku' | 'gemini-pro' | 'gemini-1.5-pro' | 'auto';

export async function* streamResponse(
  prompt: string,
  model: AIModel = 'auto',
  context?: string
): AsyncGenerator<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Fallback response for unauthenticated users
      yield "Hello! I'm your AI assistant. Please sign in to get personalized help with your genealogy and business automation needs.";
      return;
    }

    // First, get use case detection from database
    const { data: useCaseData, error: useCaseError } = await supabase.rpc('process_chat_message', {
      user_uuid: user.id,
      message: prompt,
      context: context ? { context } : {}
    });

    if (useCaseError) {
      console.error('Use case detection error:', useCaseError);
      yield "I apologize, but I'm having trouble processing your request right now. Please try again.";
      return;
    }

    const useCase = useCaseData?.use_case || 'general';

    // Try to use the Edge Function for real AI responses
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        const response = await fetch(`${supabase.supabaseUrl}/functions/v1/ai-router`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: prompt,
            userId: user.id,
            useCase: useCase
          })
        });

        if (response.ok) {
          const aiData = await response.json();
          
          if (aiData.response && !aiData.response.includes('To get AI-powered responses')) {
            // Real AI response received
            const words = aiData.response.split(' ');
            for (const word of words) {
              yield word + ' ';
              await new Promise(resolve => setTimeout(resolve, 30)); // Faster streaming
            }
            return;
          }
        }
      }
    } catch (edgeFunctionError) {
      console.log('Edge Function not available, using database response');
    }

    // Fallback to database response
    if (useCaseData && useCaseData.response) {
      const response = useCaseData.response;
      const words = response.split(' ');
      
      for (const word of words) {
        yield word + ' ';
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } else {
      yield "I'm here to help you with genealogy research and business automation. What would you like to explore?";
    }

  } catch (error) {
    console.error('AI Stream error:', error);
    yield "I apologize, but I encountered an error. Please try again.";
  }
}

export async function getMockResponse(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("I'm here to help you with genealogy research and business automation. What would you like to explore?");
    }, 1000);
  });
}

export async function checkAIServiceHealth(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch (error) {
    return false;
  }
} 