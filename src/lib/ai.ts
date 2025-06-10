import { supabase } from './supabase';

export type AIModel = 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku' | 'gemini-pro' | 'gemini-1.5-pro' | 'auto';

export function getBestModelForTask(input: string): AIModel {
  // Enhanced model selection logic with better keyword detection
  const businessKeywords = ['automation', 'workflow', 'business', 'strategy', 'consulting', 'efficiency', 'process', 'optimization', 'revenue', 'profit', 'marketing', 'sales', 'funnel', 'lead', 'conversion', 'roi', 'kpi'];
  const culturalKeywords = ['heritage', 'tradition', 'culture', 'ancestry', 'family', 'cultural', 'identity', 'genealogy', 'ethnicity', 'customs', 'ritual', 'ceremony', 'ancestor'];
  const codingKeywords = ['code', 'programming', 'function', 'api', 'development', 'debug', 'algorithm', 'software', 'javascript', 'python', 'react', 'typescript', 'html', 'css', 'sql', 'git'];
  const analysisKeywords = ['analyze', 'analysis', 'compare', 'evaluate', 'research', 'study', 'examine', 'investigate', 'assess', 'review', 'data', 'statistics', 'metrics'];
  const creativeKeywords = ['creative', 'design', 'story', 'write', 'content', 'marketing', 'brand', 'narrative', 'artistic', 'imagination', 'brainstorm'];
  
  const lowerInput = input.toLowerCase();
  
  // Check for business automation needs
  if (businessKeywords.some(keyword => lowerInput.includes(keyword))) {
    return 'gpt-4';
  }
  
  // Check for cultural analysis
  if (culturalKeywords.some(keyword => lowerInput.includes(keyword))) {
    return 'claude-3-opus';
  }
  
  // Check for coding tasks
  if (codingKeywords.some(keyword => lowerInput.includes(keyword))) {
    return 'gpt-4';
  }
  
  // Check for complex analysis
  if (analysisKeywords.some(keyword => lowerInput.includes(keyword))) {
    return 'claude-3-opus';
  }
  
  // Check for creative tasks
  if (creativeKeywords.some(keyword => lowerInput.includes(keyword))) {
    return 'claude-3-opus';
  }
  
  // Default to GPT-3.5 for general queries
  return 'gpt-3.5-turbo';
}

export async function* streamResponse(
  prompt: string,
  model: AIModel,
  context?: string
): AsyncGenerator<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      yield* getMockStreamResponse(prompt);
      return;
    }

    // Use the ai-stream edge function
    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/ai-stream`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        model: model === 'auto' ? 'gpt-4' : model,
        context
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Stream error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        yield chunk;
      }
    }
  } catch (error) {
    console.error('Error in streamResponse:', error);
    yield* getMockStreamResponse(prompt);
  }
}

async function* getMockStreamResponse(prompt: string): AsyncGenerator<string> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const response = `I understand you're asking about: "${prompt}"

I'm here to help with both business automation and cultural heritage exploration:

**Business Automation:**
- Workflow optimization and process streamlining
- Marketing automation and customer journey mapping
- Data integration and analytics
- AI-powered decision support

**Cultural Heritage:**
- Family history documentation and preservation
- Traditional practices and their modern applications
- Cultural identity exploration
- Community connection and heritage sharing

How can I assist you specifically today?`;

  const words = response.split(' ');
  for (let i = 0; i < words.length; i++) {
    yield words[i] + (i < words.length - 1 ? ' ' : '');
    await new Promise(resolve => setTimeout(resolve, 30));
  }
}

export async function getMockResponse(prompt: string): Promise<string> {
  let fullResponse = '';
  for await (const chunk of getMockStreamResponse(prompt)) {
    fullResponse += chunk;
  }
  return fullResponse;
}

export async function checkAIServiceHealth(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session?.access_token;
  } catch {
    return false;
  }
}