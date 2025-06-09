import { supabase } from './supabase';
import { toast } from 'sonner';

export interface AIProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'google' | 'custom' | 'dylanallan' | 'ollama' | 'deepseek' | 'perplexity' | 'cohere' | 'huggingface';
  endpoint: string;
  apiKey?: string;
  models: string[];
  capabilities: string[];
  costPerToken: number;
  maxTokens: number;
  isActive: boolean;
  priority: number;
  config?: Record<string, any>;
  performance?: number;
  reliability?: number;
}

export interface AIRequest {
  prompt: string;
  context?: string;
  type?: 'chat' | 'analysis' | 'generation' | 'coding' | 'business' | 'cultural' | 'creative' | 'technical' | 'research';
  maxTokens?: number;
  temperature?: number;
  userId?: string;
  urgency?: 'low' | 'medium' | 'high';
  quality?: 'fast' | 'balanced' | 'premium';
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  tokensUsed: number;
  cost: number;
  responseTime: number;
  confidence: number;
  metadata?: Record<string, any>;
}

class EnhancedAIRouter {
  private static instance: EnhancedAIRouter;
  private providers: Map<string, AIProvider> = new Map();
  private requestHistory: Map<string, AIResponse[]> = new Map();
  private performanceMetrics: Map<string, number> = new Map();
  private fallbackResponses: Map<string, string> = new Map();
  private loadBalancer: Map<string, number> = new Map();
  private circuitBreakers: Map<string, { failures: number; lastFailure: Date; isOpen: boolean }> = new Map();
  private isInitialized = false;
  private retryCount = 0;
  private maxRetries = 3;

  private constructor() {
    this.initializeProviders();
    this.initializeFallbackResponses();
    this.startHealthMonitoring();
  }

  static getInstance(): EnhancedAIRouter {
    if (!EnhancedAIRouter.instance) {
      EnhancedAIRouter.instance = new EnhancedAIRouter();
    }
    return EnhancedAIRouter.instance;
  }

  private async initializeProviders() {
    if (this.isInitialized) return;

    const defaultProviders: AIProvider[] = [
      {
        id: 'openai-gpt4-turbo',
        name: 'OpenAI GPT-4 Turbo',
        type: 'openai',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        models: ['gpt-4-turbo-preview', 'gpt-4-1106-preview'],
        capabilities: ['chat', 'analysis', 'generation', 'coding', 'business', 'creative', 'technical'],
        costPerToken: 0.00003,
        maxTokens: 128000,
        isActive: true,
        priority: 1,
        performance: 0.95,
        reliability: 0.98,
        config: {
          temperature: 0.7,
          topP: 1,
          streamingSupported: true
        }
      },
      {
        id: 'anthropic-claude-3-opus',
        name: 'Claude 3 Opus',
        type: 'anthropic',
        endpoint: 'https://api.anthropic.com/v1/messages',
        models: ['claude-3-opus-20240229'],
        capabilities: ['chat', 'analysis', 'generation', 'business', 'cultural', 'creative', 'research'],
        costPerToken: 0.000075,
        maxTokens: 200000,
        isActive: true,
        priority: 1,
        performance: 0.97,
        reliability: 0.95,
        config: {
          temperature: 0.7,
          streamingSupported: true
        }
      },
      {
        id: 'google-gemini-15-pro',
        name: 'Google Gemini 1.5 Pro',
        type: 'google',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
        models: ['gemini-1.5-pro'],
        capabilities: ['chat', 'analysis', 'generation', 'coding', 'business', 'research'],
        costPerToken: 0.000007,
        maxTokens: 1048576,
        isActive: true,
        priority: 2,
        performance: 0.93,
        reliability: 0.96,
        config: {
          temperature: 0.7,
          streamingSupported: true
        }
      },
      {
        id: 'dylanallan-business',
        name: 'DylanAllan.io Business Consultant',
        type: 'dylanallan',
        endpoint: 'https://dylanallan.io/api/chat',
        models: ['dylanallan-business-v2'],
        capabilities: ['business', 'automation', 'consulting', 'strategy', 'workflow'],
        costPerToken: 0.00001,
        maxTokens: 8192,
        isActive: true,
        priority: 1,
        performance: 0.91,
        reliability: 0.88,
        config: {
          context: 'business_automation',
          streamingSupported: true,
          timeout: 15000
        }
      },
      {
        id: 'deepseek-coder',
        name: 'DeepSeek Coder',
        type: 'deepseek',
        endpoint: 'https://api.deepseek.com/v1/chat/completions',
        models: ['deepseek-coder'],
        capabilities: ['coding', 'analysis', 'generation', 'technical'],
        costPerToken: 0.000001,
        maxTokens: 16384,
        isActive: true,
        priority: 1,
        performance: 0.94,
        reliability: 0.92,
        config: {
          temperature: 0.1,
          streamingSupported: true
        }
      }
    ];

    try {
      // Load provider configurations from database
      const { data: dbProviders, error } = await supabase
        .from('ai_service_config')
        .select('*')
        .eq('is_active', true);

      if (error) {
        console.warn('Could not load AI providers from database:', error);
      }

      defaultProviders.forEach(provider => {
        const dbProvider = dbProviders?.find(p => p.service_name === provider.id);
        if (dbProvider) {
          provider.apiKey = dbProvider.api_key;
          provider.isActive = dbProvider.is_active;
          if (dbProvider.config) {
            provider.config = { ...provider.config, ...dbProvider.config };
          }
        }
        this.providers.set(provider.id, provider);
        this.performanceMetrics.set(provider.id, provider.performance || 0.7);
        this.loadBalancer.set(provider.id, 0);
        this.circuitBreakers.set(provider.id, { failures: 0, lastFailure: new Date(0), isOpen: false });
      });

      this.isInitialized = true;
      console.log(`🚀 Enhanced AI Router initialized with ${this.providers.size} providers`);
    } catch (error) {
      console.error('Error loading AI providers:', error);
      // Initialize with defaults even if database fails
      defaultProviders.forEach(provider => {
        this.providers.set(provider.id, provider);
        this.performanceMetrics.set(provider.id, provider.performance || 0.7);
        this.loadBalancer.set(provider.id, 0);
        this.circuitBreakers.set(provider.id, { failures: 0, lastFailure: new Date(0), isOpen: false });
      });
      this.isInitialized = true;
    }
  }

  private initializeFallbackResponses() {
    this.fallbackResponses.set('business', `
🚀 **Business Automation & Strategy Consultation**

I understand you're looking for business optimization guidance. Here's my comprehensive analysis:

**🔄 Process Automation Opportunities:**
• **Workflow Optimization**: Identify and automate repetitive tasks
• **Customer Journey Automation**: Streamline lead nurturing and conversion
• **Data Integration**: Connect disparate systems for unified operations
• **Communication Automation**: Set up intelligent notification systems

**📊 Strategic Business Analysis:**
• **Efficiency Audits**: Analyze current processes for bottlenecks
• **ROI Optimization**: Prioritize high-impact, low-effort improvements
• **Scalability Planning**: Design systems that grow with your business
• **Competitive Advantage**: Leverage automation for market differentiation

**🛠️ Implementation Roadmap:**
1. **Assessment Phase**: Document current workflows and pain points
2. **Quick Wins**: Implement simple automations for immediate impact
3. **Integration Phase**: Connect tools and systems for seamless operation
4. **Optimization**: Continuously refine and improve automated processes

**💡 Cultural Integration Approach:**
• Honor traditional business values while embracing innovation
• Build diverse, inclusive teams that respect heritage
• Integrate cultural wisdom into modern business practices

Would you like me to dive deeper into any specific area of business automation or strategy?
    `);

    this.fallbackResponses.set('cultural', `
🌍 **Cultural Heritage & Identity Exploration**

I'm here to help you explore and integrate your rich cultural heritage:

**🏛️ Heritage Preservation:**
• **Family Story Documentation**: Capture and preserve oral traditions
• **Cultural Practice Integration**: Blend traditional wisdom with modern life
• **Community Connection**: Build networks with others sharing your heritage
• **Digital Archive Creation**: Organize cultural artifacts and memories

**🎭 Cultural Identity Development:**
• **Values Integration**: Understand how heritage shapes your worldview
• **Modern Application**: Apply ancestral wisdom to contemporary challenges
• **Cross-Cultural Navigation**: Balance tradition with innovation
• **Identity Celebration**: Embrace and share your unique cultural background

**📚 Research & Discovery:**
• **Genealogical Investigation**: Trace family lineages and migrations
• **Historical Context**: Understand the broader historical narrative
• **Cultural Significance**: Explore the meaning behind traditions and customs
• **Language Preservation**: Maintain and learn ancestral languages

**🤝 Community Building:**
• **Cultural Events**: Organize and participate in heritage celebrations
• **Knowledge Sharing**: Connect with elders and cultural keepers
• **Educational Outreach**: Share your culture with broader communities
• **Intergenerational Dialogue**: Bridge gaps between generations

What aspect of your cultural heritage would you like to explore further?
    `);

    this.fallbackResponses.set('default', `
🤖 **Genesis Heritage AI Assistant**

Welcome! I'm your comprehensive AI assistant with access to multiple specialized models:

**🎯 Available Capabilities:**
• **Business Automation**: Process optimization, workflow design, strategy consulting
• **Cultural Heritage**: Identity exploration, tradition preservation, community building
• **Technical Development**: Programming, architecture, problem-solving
• **Creative Projects**: Content creation, storytelling, design thinking
• **Research & Analysis**: Data interpretation, trend analysis, insights generation

**🔄 AI Model Routing:**
I automatically select the best AI model for your specific needs:
• **GPT-4 Turbo**: Complex reasoning, analysis, creative tasks
• **Claude 3 Opus**: Cultural analysis, research, nuanced understanding
• **Gemini 1.5 Pro**: Multimodal analysis, research, technical tasks
• **DeepSeek Coder**: Programming, technical documentation, code review
• **DylanAllan.io**: Business consulting, automation strategy

**✨ Enhanced Features:**
• Multi-model AI routing for optimal responses
• Personalized recommendations based on your profile
• Advanced analysis capabilities
• Integration with business tools and platforms

How can I assist you today? I'll automatically route your request to the most suitable AI specialist!
    `);
  }

  private startHealthMonitoring() {
    setInterval(async () => {
      await this.monitorProviderHealth();
      await this.updatePerformanceMetrics();
      await this.balanceLoad();
    }, 60000); // Every minute
  }

  private async monitorProviderHealth() {
    for (const [id, provider] of this.providers) {
      if (!provider.isActive) continue;

      const circuitBreaker = this.circuitBreakers.get(id)!;
      const now = new Date();

      // Reset circuit breaker if enough time has passed
      if (circuitBreaker.isOpen && now.getTime() - circuitBreaker.lastFailure.getTime() > 300000) { // 5 minutes
        circuitBreaker.isOpen = false;
        circuitBreaker.failures = 0;
        console.log(`🔄 Circuit breaker reset for ${provider.name}`);
      }
    }
  }

  async routeRequest(request: AIRequest): Promise<AsyncGenerator<string>> {
    if (!this.isInitialized) {
      await this.initializeProviders();
    }

    const startTime = Date.now();
    let selectedProvider: AIProvider | null = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts && !selectedProvider) {
      selectedProvider = await this.selectBestProvider(request, attempts);
      
      if (!selectedProvider) {
        attempts++;
        continue;
      }

      try {
        const result = this.executeRequest(selectedProvider, request);
        this.updateProviderSuccess(selectedProvider.id, Date.now() - startTime);
        return result;
      } catch (error) {
        console.error(`Provider ${selectedProvider.id} failed (attempt ${attempts + 1}):`, error);
        this.handleProviderFailure(selectedProvider.id, error);
        selectedProvider = null;
        attempts++;
      }
    }

    // All providers failed, return fallback
    console.warn('All providers failed, using fallback response');
    return this.getFallbackResponse(request);
  }

  private async selectBestProvider(request: AIRequest, attempt: number): Promise<AIProvider | null> {
    const availableProviders = Array.from(this.providers.values())
      .filter(p => p.isActive)
      .filter(p => !this.circuitBreakers.get(p.id)?.isOpen)
      .filter(p => this.canHandleRequest(p, request));

    if (availableProviders.length === 0) {
      return null;
    }

    // Enhanced provider selection with business logic
    if (request.type === 'business' || this.isBusinessRequest(request.prompt)) {
      const businessProvider = availableProviders.find(p => p.id === 'dylanallan-business');
      if (businessProvider) return businessProvider;
    }

    if (request.type === 'coding' || this.isCodingRequest(request.prompt)) {
      const codingProvider = availableProviders.find(p => p.id === 'deepseek-coder');
      if (codingProvider) return codingProvider;
    }

    if (request.type === 'cultural' || this.isCulturalRequest(request.prompt)) {
      const culturalProvider = availableProviders.find(p => p.id === 'anthropic-claude-3-opus');
      if (culturalProvider) return culturalProvider;
    }

    // Score and rank providers
    const scoredProviders = availableProviders.map(provider => ({
      provider,
      score: this.calculateProviderScore(provider, request, attempt)
    }));

    scoredProviders.sort((a, b) => b.score - a.score);
    return scoredProviders[0].provider;
  }

  private isBusinessRequest(prompt: string): boolean {
    const businessKeywords = ['automation', 'workflow', 'business', 'strategy', 'consulting', 'efficiency', 'process', 'optimization', 'revenue', 'profit', 'marketing', 'sales'];
    return businessKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
  }

  private isCodingRequest(prompt: string): boolean {
    const codingKeywords = ['code', 'programming', 'function', 'api', 'development', 'debug', 'algorithm', 'software', 'javascript', 'python', 'react'];
    return codingKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
  }

  private isCulturalRequest(prompt: string): boolean {
    const culturalKeywords = ['heritage', 'tradition', 'culture', 'ancestry', 'family', 'cultural', 'identity', 'genealogy'];
    return culturalKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
  }

  private calculateProviderScore(provider: AIProvider, request: AIRequest, attempt: number): number {
    let score = 0;

    // Base priority score
    score += (10 - provider.priority) * 20;

    // Performance and reliability
    const performance = this.performanceMetrics.get(provider.id) || 0.7;
    score += performance * 30;
    score += (provider.reliability || 0.8) * 25;

    // Capability match
    if (request.type && provider.capabilities.includes(request.type)) {
      score += 40;
    }

    // Quality preference adjustments
    if (request.quality === 'premium') {
      if (provider.id.includes('gpt-4') || provider.id.includes('claude-3-opus')) {
        score += 50;
      }
    } else if (request.quality === 'fast') {
      if (provider.id.includes('gpt-3.5') || provider.costPerToken < 0.00001) {
        score += 40;
      }
    }

    return Math.max(0, score);
  }

  private canHandleRequest(provider: AIProvider, request: AIRequest): boolean {
    if (request.type && !provider.capabilities.includes(request.type)) {
      return false;
    }

    const estimatedTokens = this.estimateTokens(request.prompt);
    if (estimatedTokens > provider.maxTokens) {
      return false;
    }

    return true;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 3.5);
  }

  private async* executeRequest(provider: AIProvider, request: AIRequest): AsyncGenerator<string> {
    const startTime = Date.now();

    try {
      switch (provider.type) {
        case 'openai':
          yield* this.executeOpenAIRequest(provider, request);
          break;
        case 'anthropic':
          yield* this.executeAnthropicRequest(provider, request);
          break;
        case 'google':
          yield* this.executeGoogleRequest(provider, request);
          break;
        case 'dylanallan':
          yield* this.executeDylanAllanRequest(provider, request);
          break;
        case 'deepseek':
          yield* this.executeDeepSeekRequest(provider, request);
          break;
        default:
          throw new Error(`Unsupported provider type: ${provider.type}`);
      }

      const responseTime = Date.now() - startTime;
      this.updateProviderSuccess(provider.id, responseTime);

    } catch (error) {
      console.error(`Error with provider ${provider.id}:`, error);
      this.handleProviderFailure(provider.id, error);
      throw error;
    }
  }

  private async* executeOpenAIRequest(provider: AIProvider, request: AIRequest): AsyncGenerator<string> {
    if (!provider.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: provider.models[0],
        messages: [
          { role: 'system', content: this.getSystemPrompt(provider, request) },
          { role: 'user', content: request.prompt }
        ],
        stream: true,
        max_tokens: request.maxTokens || 2000,
        temperature: request.temperature || 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  private async* executeAnthropicRequest(provider: AIProvider, request: AIRequest): AsyncGenerator<string> {
    if (!provider.apiKey) {
      throw new Error('Anthropic API key not configured');
    }

    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: provider.models[0],
        max_tokens: request.maxTokens || 2000,
        messages: [{ 
          role: 'user', 
          content: `${this.getSystemPrompt(provider, request)}\n\n${request.prompt}` 
        }],
        stream: true,
        temperature: request.temperature || 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.delta?.text;
            if (content) {
              yield content;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  private async* executeGoogleRequest(provider: AIProvider, request: AIRequest): AsyncGenerator<string> {
    if (!provider.apiKey) {
      throw new Error('Google API key not configured');
    }

    const response = await fetch(`${provider.endpoint}?key=${provider.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${this.getSystemPrompt(provider, request)}\n\n${request.prompt}` }]
        }],
        generationConfig: {
          maxOutputTokens: request.maxTokens || 2000,
          temperature: request.temperature || 0.7
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Simulate streaming for Google API
    const words = content.split(' ');
    for (let i = 0; i < words.length; i++) {
      yield words[i] + (i < words.length - 1 ? ' ' : '');
      await new Promise(resolve => setTimeout(resolve, 30));
    }
  }

  private async* executeDylanAllanRequest(provider: AIProvider, request: AIRequest): AsyncGenerator<string> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), provider.config?.timeout || 15000);

      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Genesis-Heritage-AI-Router/2.0'
        },
        body: JSON.stringify({
          message: request.prompt,
          context: request.context || 'business_automation',
          stream: true,
          quality: request.quality || 'balanced',
          urgency: request.urgency || 'medium'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`DylanAllan API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        yield chunk;
      }
    } catch (error) {
      console.error('DylanAllan API error:', error);
      
      // Enhanced business-focused fallback
      const fallbackResponse = this.fallbackResponses.get('business') || this.fallbackResponses.get('default')!;
      
      const words = fallbackResponse.split(' ');
      for (let i = 0; i < words.length; i++) {
        yield words[i] + (i < words.length - 1 ? ' ' : '');
        await new Promise(resolve => setTimeout(resolve, 40));
      }
    }
  }

  private async* executeDeepSeekRequest(provider: AIProvider, request: AIRequest): AsyncGenerator<string> {
    if (!provider.apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: provider.models[0],
        messages: [
          { role: 'system', content: this.getSystemPrompt(provider, request) },
          { role: 'user', content: request.prompt }
        ],
        stream: true,
        max_tokens: request.maxTokens || 2000,
        temperature: request.temperature || 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.trim());

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }

  private getSystemPrompt(provider: AIProvider, request: AIRequest): string {
    switch (request.type) {
      case 'business':
        return "You are a business automation and consulting specialist. Provide practical, actionable advice for improving business processes and efficiency. Focus on ROI, scalability, and sustainable growth strategies.";
      case 'cultural':
        return "You are a cultural heritage specialist. Help users explore and integrate their cultural background into modern life while preserving traditions. Be respectful and knowledgeable about diverse cultures.";
      case 'coding':
        return "You are a programming expert. Provide clear, well-documented code solutions and explain best practices. Focus on clean, maintainable, and efficient code.";
      case 'analysis':
        return "You are an analytical expert. Provide thorough, well-reasoned analysis with clear conclusions and recommendations. Use data-driven insights when possible.";
      case 'creative':
        return "You are a creative specialist. Help with creative projects, storytelling, design thinking, and innovative solutions. Be imaginative while staying practical.";
      case 'research':
        return "You are a research specialist. Provide comprehensive, well-sourced information and analysis. Focus on accuracy, depth, and current information.";
      case 'technical':
        return "You are a technical specialist. Provide detailed technical guidance, troubleshooting, and solutions. Focus on accuracy and practical implementation.";
      default:
        return "You are a helpful AI assistant.";
    }
  }

  private async* getFallbackResponse(request: AIRequest): AsyncGenerator<string> {
    const responseType = request.type || 'default';
    const fallbackText = this.fallbackResponses.get(responseType) || this.fallbackResponses.get('default')!;
    
    const words = fallbackText.split(' ');
    for (let i = 0; i < words.length; i++) {
      yield words[i] + (i < words.length - 1 ? ' ' : '');
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  private updateProviderSuccess(providerId: string, responseTime: number) {
    const currentPerf = this.performanceMetrics.get(providerId) || 0.7;
    const timeScore = Math.max(0, 1 - (responseTime / 30000));
    const newPerf = (currentPerf * 0.9) + (timeScore * 0.1);
    this.performanceMetrics.set(providerId, newPerf);

    const circuitBreaker = this.circuitBreakers.get(providerId)!;
    circuitBreaker.failures = Math.max(0, circuitBreaker.failures - 1);

    const currentLoad = this.loadBalancer.get(providerId) || 0;
    this.loadBalancer.set(providerId, Math.max(0, currentLoad - 1));
  }

  private handleProviderFailure(providerId: string, error: any) {
    const circuitBreaker = this.circuitBreakers.get(providerId)!;
    circuitBreaker.failures++;
    circuitBreaker.lastFailure = new Date();

    if (circuitBreaker.failures >= 3) {
      circuitBreaker.isOpen = true;
      console.warn(`⚠️ Circuit breaker opened for ${providerId} due to repeated failures`);
    }

    const currentPerf = this.performanceMetrics.get(providerId) || 0.7;
    this.performanceMetrics.set(providerId, Math.max(0.1, currentPerf - 0.1));
  }

  private async updatePerformanceMetrics() {
    try {
      const { data: recentLogs, error } = await supabase
        .from('ai_request_logs')
        .select('provider_id, success, response_time_ms')
        .gte('created_at', new Date(Date.now() - 3600000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const providerStats = new Map<string, { total: number; successful: number; avgTime: number }>();

      recentLogs?.forEach(log => {
        const stats = providerStats.get(log.provider_id) || { total: 0, successful: 0, avgTime: 0 };
        stats.total++;
        if (log.success) stats.successful++;
        stats.avgTime = (stats.avgTime + log.response_time_ms) / 2;
        providerStats.set(log.provider_id, stats);
      });

      for (const [providerId, stats] of providerStats) {
        const successRate = stats.successful / stats.total;
        const timeScore = Math.max(0, 1 - (stats.avgTime / 15000));
        const overallScore = (successRate * 0.7) + (timeScore * 0.3);
        this.performanceMetrics.set(providerId, overallScore);
      }
    } catch (error) {
      console.error('Error updating performance metrics:', error);
    }
  }

  private async balanceLoad() {
    for (const [providerId] of this.loadBalancer) {
      const currentLoad = this.loadBalancer.get(providerId) || 0;
      this.loadBalancer.set(providerId, Math.max(0, currentLoad * 0.9));
    }
  }

  // Public API methods
  async getProviderStatus(): Promise<Map<string, any>> {
    const status = new Map();
    
    for (const [id, provider] of this.providers) {
      const circuitBreaker = this.circuitBreakers.get(id)!;
      const performance = this.performanceMetrics.get(id) || 0.7;
      const load = this.loadBalancer.get(id) || 0;

      status.set(id, {
        name: provider.name,
        type: provider.type,
        isActive: provider.isActive && !circuitBreaker.isOpen,
        performance: Math.round(performance * 100) / 100,
        reliability: provider.reliability,
        capabilities: provider.capabilities,
        priority: provider.priority,
        hasApiKey: !!provider.apiKey,
        costPerToken: provider.costPerToken,
        maxTokens: provider.maxTokens,
        currentLoad: load,
        circuitBreakerOpen: circuitBreaker.isOpen,
        failures: circuitBreaker.failures
      });
    }
    
    return status;
  }

  async enableProvider(providerId: string, apiKey?: string) {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.isActive = true;
      if (apiKey) {
        provider.apiKey = apiKey;
      }
      
      const circuitBreaker = this.circuitBreakers.get(providerId)!;
      circuitBreaker.isOpen = false;
      circuitBreaker.failures = 0;
      
      toast.success(`🚀 ${provider.name} enabled successfully`);
    }
  }

  async disableProvider(providerId: string) {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.isActive = false;
      toast.info(`⏸️ ${provider.name} disabled`);
    }
  }

  getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.values()).filter(p => p.isActive);
  }
}

export const enhancedAIRouter = EnhancedAIRouter.getInstance();