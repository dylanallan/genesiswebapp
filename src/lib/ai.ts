import { supabase } from './supabase';
import { toast } from 'sonner';
import { circuitBreakerManager } from './circuit-breaker';
import { errorRecovery } from './error-recovery';

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
    // Use local mock response if no session or in development mode
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      yield* getEnhancedMockStreamResponse(prompt);
      return;
    }

    const circuitBreaker = circuitBreakerManager.getBreaker('ai-router');
    
    return circuitBreaker.execute(async () => {
      // Set up timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      try {
        // Use the ai-stream edge function
        const response = await fetch(`${supabase.supabaseUrl}/functions/v1/ai-stream`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            model: model === 'auto' ? getBestModelForTask(prompt) : model,
            context,
            type: determineRequestType(prompt)
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          console.error(`AI Stream error: ${response.status} ${response.statusText}`);
          throw new Error(`AI Stream error: ${response.status} ${response.statusText}`);
        }

        // Check if the response body is null
        if (!response.body) {
          console.error('Response body is null');
          throw new Error('Response body is null');
        }

        return createStreamFromResponse(response);
      } catch (error) {
        clearTimeout(timeoutId);
        
        // Handle timeout specifically
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        
        throw error;
      }
    });
  } catch (error) {
    console.error('AI Router error:', error);
    
    await errorRecovery.handleError({
      component: 'ai-router',
      error: error instanceof Error ? error : new Error('Unknown routing error'),
      timestamp: new Date()
    });
    
    yield* getEnhancedMockStreamResponse(prompt);
  }
}

function determineRequestType(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('business') || lowerPrompt.includes('automation') || lowerPrompt.includes('workflow')) {
    return 'business';
  }
  
  if (lowerPrompt.includes('culture') || lowerPrompt.includes('heritage') || lowerPrompt.includes('tradition')) {
    return 'cultural';
  }
  
  if (lowerPrompt.includes('code') || lowerPrompt.includes('programming') || lowerPrompt.includes('function')) {
    return 'coding';
  }
  
  if (lowerPrompt.includes('analyze') || lowerPrompt.includes('compare') || lowerPrompt.includes('evaluate')) {
    return 'analysis';
  }
  
  if (lowerPrompt.includes('creative') || lowerPrompt.includes('story') || lowerPrompt.includes('design')) {
    return 'creative';
  }
  
  return 'chat';
}

async function* createStreamFromResponse(response: Response): AsyncGenerator<string> {
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
  } catch (error) {
    console.error('Error reading stream:', error);
    throw error;
  } finally {
    reader.releaseLock();
  }
}

async function* getEnhancedMockStreamResponse(prompt: string): AsyncGenerator<string> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const requestType = determineRequestType(prompt);
  
  const responses = {
    business: `🚀 **Business Automation Analysis for: "${prompt}"**

I understand you're looking for business optimization guidance. Here's my comprehensive analysis:

**🔄 Process Automation Opportunities:**
• **Workflow Optimization**: Identify repetitive tasks consuming valuable time
• **Customer Journey Automation**: Streamline lead nurturing and conversion processes
• **Data Integration**: Connect disparate systems for unified operations  
• **Communication Automation**: Set up intelligent notification systems

**📊 Strategic Recommendations:**
• **Quick Wins**: Start with simple automations for immediate ROI
• **Scalable Solutions**: Design systems that grow with your business
• **Cultural Integration**: Honor traditional values while embracing innovation
• **Performance Metrics**: Track and optimize automation effectiveness

**🛠️ Implementation Roadmap:**
1. **Assessment**: Document current workflows and pain points
2. **Prioritization**: Focus on high-impact, low-effort improvements  
3. **Implementation**: Deploy automation tools and processes
4. **Optimization**: Continuously refine and enhance systems

I'm currently experiencing connectivity issues with our AI providers, but I've provided this guidance based on your request. For more detailed assistance, please try again in a moment.`,

    cultural: `🌍 **Cultural Heritage Exploration for: "${prompt}"**

I'm here to help you explore and integrate your rich cultural heritage:

**🏛️ Heritage Discovery:**
• **Family Story Documentation**: Preserve oral traditions and memories
• **Cultural Practice Integration**: Blend ancestral wisdom with modern life
• **Community Connection**: Build networks with others sharing your heritage
• **Identity Celebration**: Embrace and share your unique cultural background

**📚 Research & Preservation:**
• **Genealogical Investigation**: Trace family lineages and migrations
• **Historical Context**: Understand broader cultural narratives
• **Tradition Documentation**: Record customs, recipes, and practices
• **Language Preservation**: Maintain ancestral languages and dialects

**🤝 Modern Integration:**
• **Values Application**: Apply cultural principles to contemporary challenges
• **Cross-Cultural Navigation**: Balance tradition with innovation
• **Professional Integration**: Incorporate heritage into career development
• **Community Building**: Create spaces for cultural expression and sharing

I'm currently experiencing connectivity issues with our AI providers, but I've provided this guidance based on your request. For more detailed assistance, please try again in a moment.`,

    coding: `💻 **Programming Solution for: "${prompt}"**

I'm ready to help with your coding challenge:

**🔧 Technical Analysis:**
• **Problem Breakdown**: Analyze requirements and constraints
• **Solution Architecture**: Design scalable, maintainable code structure
• **Best Practices**: Apply SOLID principles and design patterns
• **Performance Optimization**: Ensure efficient, fast-running code

**🚀 Implementation Strategy:**
• **Technology Selection**: Choose optimal frameworks and libraries
• **Code Organization**: Structure for readability and maintainability  
• **Testing Strategy**: Implement comprehensive quality assurance
• **Documentation**: Create clear, helpful technical documentation

**🔍 Quality Assurance:**
• **Code Review**: Follow industry best practices
• **Security**: Implement secure coding standards
• **Scalability**: Design for growth and performance
• **Debugging**: Systematic troubleshooting approaches

I'm currently experiencing connectivity issues with our AI providers, but I've provided this guidance based on your request. For more detailed assistance, please try again in a moment.`,

    default: `🤖 **Genesis Heritage AI Assistant**

I understand you're asking about: "${prompt}"

**🎯 Comprehensive AI Capabilities:**
• **Business Automation**: Process optimization, strategy consulting
• **Cultural Heritage**: Identity exploration, tradition preservation
• **Technical Development**: Programming, architecture, debugging
• **Research & Analysis**: Information gathering, trend analysis
• **Creative Projects**: Content creation, storytelling, design

**✨ Enhanced Features:**
• Multi-model AI routing for optimal responses
• Personalized recommendations based on your profile
• Advanced analysis capabilities
• Integration with business tools and platforms

I'm currently experiencing connectivity issues with our AI providers, but I've provided this guidance based on your request. For more detailed assistance, please try again in a moment.`
  };
  
  const response = responses[requestType as keyof typeof responses] || responses.default;
  const words = response.split(' ');
  
  for (const word of words) {
    yield word + ' ';
    await new Promise(resolve => setTimeout(resolve, 30));
  }
}

async function* getMockStreamResponse(prompt: string): AsyncGenerator<string> {
  let fullResponse = '';
  for await (const chunk of getEnhancedMockStreamResponse(prompt)) {
    fullResponse += chunk;
  }
  
  const words = fullResponse.split(' ');
  for (let i = 0; i < words.length; i++) {
    yield words[i] + (i < words.length - 1 ? ' ' : '');
    await new Promise(resolve => setTimeout(resolve, 30));
  }
}

export async function getMockResponse(prompt: string): Promise<string> {
  let fullResponse = '';
  for await (const chunk of getEnhancedMockStreamResponse(prompt)) {
    fullResponse += chunk;
  }
  return fullResponse;
}

export async function checkAIServiceHealth(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      return false;
    }
    
    // Try a simple health check to the edge function
    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/health-check`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    return response.ok;
  } catch {
    return false;
  }
}