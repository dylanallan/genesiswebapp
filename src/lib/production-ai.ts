import { enhancedAIRouter, AIRequest } from './enhanced-ai-router';
import { supabase } from './supabase';

export type AIModel = 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku' | 'gemini-pro' | 'gemini-1.5-pro' | 'dylanallan' | 'deepseek-coder' | 'perplexity' | 'cohere' | 'ollama' | 'auto';

export function getBestModelForTask(input: string): AIModel {
  const businessKeywords = ['automation', 'workflow', 'business', 'strategy', 'consulting', 'efficiency', 'process', 'optimization', 'revenue', 'profit', 'marketing', 'sales', 'funnel', 'lead', 'conversion', 'roi', 'kpi'];
  const culturalKeywords = ['heritage', 'tradition', 'culture', 'ancestry', 'family', 'cultural', 'identity', 'genealogy', 'ethnicity', 'customs', 'ritual', 'ceremony', 'ancestor'];
  const codingKeywords = ['code', 'programming', 'function', 'api', 'development', 'debug', 'algorithm', 'software', 'javascript', 'python', 'react', 'typescript', 'html', 'css', 'sql', 'git'];
  const analysisKeywords = ['analyze', 'analysis', 'compare', 'evaluate', 'research', 'study', 'examine', 'investigate', 'assess', 'review', 'data', 'statistics', 'metrics'];
  const creativeKeywords = ['creative', 'design', 'story', 'write', 'content', 'marketing', 'brand', 'narrative', 'artistic', 'imagination', 'brainstorm'];
  const researchKeywords = ['research', 'information', 'facts', 'data', 'current', 'latest', 'news', 'trends', 'statistics', 'study', 'report', 'findings'];
  
  const lowerInput = input.toLowerCase();
  
  if (businessKeywords.some(keyword => lowerInput.includes(keyword))) {
    return 'dylanallan';
  }
  
  if (codingKeywords.some(keyword => lowerInput.includes(keyword))) {
    return 'deepseek-coder';
  }
  
  if (researchKeywords.some(keyword => lowerInput.includes(keyword))) {
    return 'perplexity';
  }
  
  if (culturalKeywords.some(keyword => lowerInput.includes(keyword))) {
    return 'claude-3-opus';
  }
  
  if (creativeKeywords.some(keyword => lowerInput.includes(keyword))) {
    return 'claude-3-opus';
  }
  
  if (analysisKeywords.some(keyword => lowerInput.includes(keyword))) {
    return 'gpt-4';
  }
  
  return 'auto';
}

export async function* streamResponse(
  prompt: string,
  model: AIModel,
  context?: string
): AsyncGenerator<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      yield* getEnhancedMockStreamResponse(prompt);
      return;
    }

    const requestType = determineRequestType(prompt, model);
    const quality = determineQuality(prompt, model);
    const urgency = determineUrgency(prompt);
    
    const request: AIRequest = {
      prompt,
      context,
      type: requestType,
      userId: session.user.id,
      maxTokens: getMaxTokensForModel(model),
      temperature: getTemperatureForModel(model),
      quality,
      urgency
    };

    yield* await enhancedAIRouter.routeRequest(request);

  } catch (error) {
    console.error('Error in streamResponse:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      
      if (error.message.includes('Rate limit exceeded')) {
        throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
      }
      
      yield* getEnhancedMockStreamResponse(prompt);
    } else {
      throw new Error('Unknown error occurred');
    }
  }
}

function determineRequestType(prompt: string, model: AIModel): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (model === 'dylanallan') {
    return 'business';
  }
  
  if (model === 'deepseek-coder') {
    return 'coding';
  }
  
  if (model === 'perplexity') {
    return 'research';
  }
  
  if (lowerPrompt.includes('business') || lowerPrompt.includes('automation') || lowerPrompt.includes('workflow') || lowerPrompt.includes('strategy')) {
    return 'business';
  }
  
  if (lowerPrompt.includes('culture') || lowerPrompt.includes('heritage') || lowerPrompt.includes('tradition') || lowerPrompt.includes('ancestry')) {
    return 'cultural';
  }
  
  if (lowerPrompt.includes('code') || lowerPrompt.includes('programming') || lowerPrompt.includes('function') || lowerPrompt.includes('debug')) {
    return 'coding';
  }
  
  if (lowerPrompt.includes('research') || lowerPrompt.includes('information') || lowerPrompt.includes('current') || lowerPrompt.includes('latest')) {
    return 'research';
  }
  
  if (lowerPrompt.includes('creative') || lowerPrompt.includes('story') || lowerPrompt.includes('design') || lowerPrompt.includes('write')) {
    return 'creative';
  }
  
  if (lowerPrompt.includes('analyze') || lowerPrompt.includes('explain') || lowerPrompt.includes('compare') || lowerPrompt.includes('evaluate')) {
    return 'analysis';
  }
  
  if (lowerPrompt.includes('technical') || lowerPrompt.includes('system') || lowerPrompt.includes('architecture')) {
    return 'technical';
  }
  
  return 'chat';
}

function determineQuality(prompt: string, model: AIModel): 'fast' | 'balanced' | 'premium' {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('quick') || lowerPrompt.includes('fast') || lowerPrompt.includes('brief')) {
    return 'fast';
  }
  
  if (lowerPrompt.includes('detailed') || lowerPrompt.includes('comprehensive') || lowerPrompt.includes('thorough') || lowerPrompt.includes('in-depth')) {
    return 'premium';
  }
  
  if (model === 'gpt-4' || model === 'claude-3-opus') {
    return 'premium';
  }
  
  if (model === 'gpt-3.5-turbo' || model === 'claude-3-haiku') {
    return 'fast';
  }
  
  return 'balanced';
}

function determineUrgency(prompt: string): 'low' | 'medium' | 'high' {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('urgent') || lowerPrompt.includes('asap') || lowerPrompt.includes('immediately') || lowerPrompt.includes('emergency')) {
    return 'high';
  }
  
  if (lowerPrompt.includes('when you can') || lowerPrompt.includes('no rush') || lowerPrompt.includes('eventually')) {
    return 'low';
  }
  
  return 'medium';
}

function getMaxTokensForModel(model: AIModel): number {
  switch (model) {
    case 'gpt-4':
      return 8000;
    case 'gpt-3.5-turbo':
      return 4000;
    case 'claude-3-opus':
    case 'claude-3-sonnet':
      return 4000;
    case 'claude-3-haiku':
      return 2000;
    case 'gemini-pro':
      return 2000;
    case 'gemini-1.5-pro':
      return 8000;
    case 'dylanallan':
      return 4000;
    case 'deepseek-coder':
      return 4000;
    case 'perplexity':
      return 4000;
    case 'cohere':
      return 4000;
    case 'ollama':
      return 2000;
    default:
      return 2000;
  }
}

function getTemperatureForModel(model: AIModel): number {
  switch (model) {
    case 'deepseek-coder':
      return 0.1;
    case 'dylanallan':
      return 0.7;
    case 'claude-3-opus':
      return 0.8;
    case 'perplexity':
      return 0.3;
    default:
      return 0.7;
  }
}

async function* getEnhancedMockStreamResponse(prompt: string): AsyncGenerator<string> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const requestType = determineRequestType(prompt, 'auto');
  
  const responses = {
    business: `🚀 **Business Automation Analysis for: "${prompt}"**

I understand you're looking for business optimization guidance. Here's my comprehensive analysis:

**🔄 Automation Opportunities:**
• **Process Streamlining**: Identify repetitive tasks consuming valuable time
• **Workflow Integration**: Connect your business tools for seamless operations  
• **Customer Journey Optimization**: Automate lead nurturing and conversion processes
• **Data-Driven Insights**: Implement analytics for informed decision making

**📊 Strategic Recommendations:**
• **Quick Wins**: Start with simple automations for immediate ROI
• **Scalable Solutions**: Design systems that grow with your business
• **Cultural Integration**: Honor traditional values while embracing innovation
• **Performance Metrics**: Track and optimize automation effectiveness

**🎯 Next Steps:**
1. **Assessment**: Document current workflows and pain points
2. **Prioritization**: Focus on high-impact, low-effort improvements  
3. **Implementation**: Deploy automation tools and processes
4. **Optimization**: Continuously refine and enhance systems

*Sign in to access our full AI routing system with specialized business consultants from DylanAllan.io, GPT-4, Claude 3, and more!*`,

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

*Sign in for access to Claude 3 Opus, specialized in cultural analysis, plus our full suite of AI specialists!*`,

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

*Sign in to access DeepSeek Coder, GPT-4, and other specialized programming AI models!*`,

    research: `🔍 **Research Analysis for: "${prompt}"**

I'll help you gather and analyze comprehensive information:

**📊 Information Gathering:**
• **Source Identification**: Find reliable, authoritative sources
• **Data Collection**: Systematic information gathering
• **Fact Verification**: Cross-reference multiple sources
• **Current Trends**: Identify latest developments and patterns

**🧠 Analysis Framework:**
• **Critical Evaluation**: Assess source credibility and bias
• **Pattern Recognition**: Identify trends and correlations
• **Synthesis**: Combine information into coherent insights
• **Actionable Conclusions**: Provide practical recommendations

**📈 Research Methodology:**
• **Systematic Approach**: Structured investigation process
• **Multiple Perspectives**: Consider diverse viewpoints
• **Evidence-Based**: Support conclusions with solid data
• **Continuous Updates**: Stay current with evolving information

*Sign in for access to Perplexity AI with real-time search capabilities, plus our full research specialist network!*`,

    default: `🤖 **Genesis Heritage AI Assistant**

I understand you're asking about: "${prompt}"

**🎯 Comprehensive AI Capabilities:**
• **Business Automation**: Process optimization, strategy consulting (DylanAllan.io)
• **Cultural Heritage**: Identity exploration, tradition preservation (Claude 3)
• **Technical Development**: Programming, architecture, debugging (DeepSeek Coder)
• **Research & Analysis**: Information gathering, trend analysis (Perplexity)
• **Creative Projects**: Content creation, storytelling, design (GPT-4, Claude)

**🔄 Intelligent AI Routing:**
I automatically select the best AI specialist for your needs:
• **GPT-4 Turbo**: Complex reasoning, analysis, creative tasks
• **Claude 3 Opus**: Cultural analysis, research, nuanced understanding  
• **Gemini 1.5 Pro**: Multimodal analysis, technical tasks, large context
• **DeepSeek Coder**: Programming, code review, technical documentation
• **DylanAllan.io**: Business consulting, automation strategy, workflow optimization
• **Perplexity**: Real-time research, current information, fact-checking

**✨ Enhanced Features (Sign in for full access):**
• Advanced multi-model AI routing for optimal responses
• Personalized recommendations based on your profile and history
• Real-time performance monitoring and quality optimization
• Integration with specialized business and cultural tools

*Sign in now to unlock the full power of our AI routing system with 10+ specialized models!*`
  };
  
  const response = responses[requestType as keyof typeof responses] || responses.default;
  const words = response.split(' ');
  
  for (const word of words) {
    yield word + ' ';
    await new Promise(resolve => setTimeout(resolve, 60));
  }
}

export async function getMockResponse(prompt: string): Promise<string> {
  let fullResponse = '';
  for await (const chunk of getEnhancedMockStreamResponse(prompt)) {
    fullResponse += chunk;
  }
  return fullResponse.trim();
}

export async function checkAIServiceHealth(): Promise<boolean> {
  try {
    const status = await enhancedAIRouter.getProviderStatus();
    const activeProviders = Array.from(status.values()).filter(p => p.isActive);
    return activeProviders.length > 0;
  } catch {
    return false;
  }
}

export async function getAIProviderStatus() {
  return await enhancedAIRouter.getProviderStatus();
}

export async function enableAIProvider(providerId: string, apiKey?: string) {
  return await enhancedAIRouter.enableProvider(providerId, apiKey);
}

export async function disableAIProvider(providerId: string) {
  return await enhancedAIRouter.disableProvider(providerId);
}

export function getAvailableModels(): { id: AIModel; name: string; description: string; capabilities: string[] }[] {
  return [
    { 
      id: 'auto', 
      name: 'Auto-Select', 
      description: 'Automatically choose the best AI for your task',
      capabilities: ['intelligent-routing', 'optimization', 'load-balancing']
    },
    { 
      id: 'gpt-4', 
      name: 'GPT-4 Turbo', 
      description: 'OpenAI\'s most capable model for complex reasoning',
      capabilities: ['analysis', 'coding', 'creative', 'business']
    },
    { 
      id: 'claude-3-opus', 
      name: 'Claude 3 Opus', 
      description: 'Anthropic\'s most capable model for nuanced tasks',
      capabilities: ['cultural', 'analysis', 'creative', 'research']
    },
    { 
      id: 'gemini-1.5-pro', 
      name: 'Gemini 1.5 Pro', 
      description: 'Latest Google model with enhanced capabilities',
      capabilities: ['analysis', 'coding', 'research', 'multimodal']
    },
    { 
      id: 'dylanallan', 
      name: 'DylanAllan.io', 
      description: 'Specialized business automation consultant',
      capabilities: ['business', 'automation', 'consulting', 'strategy']
    },
    { 
      id: 'deepseek-coder', 
      name: 'DeepSeek Coder', 
      description: 'Specialized coding and programming assistant',
      capabilities: ['coding', 'technical', 'debugging', 'architecture']
    }
  ];
}

export async function getProviderMetrics(providerId: string, days: number = 7) {
  try {
    const { data, error } = await supabase.rpc('get_ai_provider_metrics', {
      p_provider_id: providerId,
      p_days: days
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting provider metrics:', error);
    return null;
  }
}