import { supabase } from './supabase';
import { toast } from 'sonner';

export interface AIProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'google' | 'custom' | 'dylanallan' | 'ollama' | 'deepseek';
  endpoint: string;
  apiKey?: string;
  models: string[];
  capabilities: string[];
  costPerToken: number;
  maxTokens: number;
  isActive: boolean;
  priority: number;
  config?: Record<string, any>;
}

export interface AIRequest {
  prompt: string;
  context?: string;
  type?: 'chat' | 'analysis' | 'generation' | 'coding' | 'business' | 'cultural';
  maxTokens?: number;
  temperature?: number;
  userId?: string;
}

export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  tokensUsed: number;
  cost: number;
  responseTime: number;
  confidence: number;
}

class AIRouter {
  private static instance: AIRouter;
  private providers: Map<string, AIProvider> = new Map();
  private requestHistory: Map<string, AIResponse[]> = new Map();
  private performanceMetrics: Map<string, number> = new Map();
  private fallbackResponses: Map<string, string> = new Map();

  private constructor() {
    this.initializeProviders();
    this.initializeFallbackResponses();
  }

  static getInstance(): AIRouter {
    if (!AIRouter.instance) {
      AIRouter.instance = new AIRouter();
    }
    return AIRouter.instance;
  }

  private initializeFallbackResponses() {
    this.fallbackResponses.set('business', `
I understand you're looking for business automation and consulting guidance. Here are some key strategies I can help you with:

**Business Process Automation:**
• Identify repetitive tasks that consume significant time
• Implement workflow automation tools (Zapier, Microsoft Power Automate)
• Automate customer relationship management (CRM)
• Streamline financial processes (invoicing, expense tracking)
• Set up project management automation

**Consulting Approach:**
• Conduct thorough business process audits
• Map current workflows and identify bottlenecks
• Prioritize automation opportunities by ROI
• Start with simple automations and scale complexity
• Measure results and continuously optimize

**Cultural Integration:**
• Incorporate traditional business values into modern processes
• Respect cultural practices while embracing efficiency
• Build diverse teams that honor heritage while driving innovation

Would you like me to dive deeper into any of these areas?
    `);

    this.fallbackResponses.set('cultural', `
I'd be happy to help you explore cultural heritage and its integration into modern life. Here are some areas I can assist with:

**Cultural Heritage Preservation:**
• Document family traditions and stories
• Preserve cultural practices for future generations
• Create digital archives of cultural artifacts
• Connect with community members who share your heritage

**Modern Integration:**
• Incorporate cultural values into business practices
• Balance tradition with innovation
• Build cultural awareness in professional settings
• Develop culturally-sensitive approaches to problem-solving

**Identity Exploration:**
• Understand your cultural roots and their significance
• Explore how heritage shapes your worldview
• Connect with others who share similar backgrounds
• Celebrate cultural diversity in all aspects of life

What specific aspect of cultural heritage would you like to explore?
    `);

    this.fallbackResponses.set('coding', `
I can help you with various programming and development tasks:

**Programming Languages:**
• JavaScript/TypeScript for web development
• Python for data science and automation
• React for frontend applications
• Node.js for backend services

**Development Best Practices:**
• Clean code principles and architecture
• Testing strategies and implementation
• Version control with Git
• Code review and collaboration

**Problem Solving:**
• Algorithm design and optimization
• Debugging techniques and tools
• Performance optimization
• Security best practices

What programming challenge can I help you solve today?
    `);

    this.fallbackResponses.set('default', `
I'm here to help you with a wide range of topics including business automation, cultural heritage, programming, and general analysis. While I'm currently operating in limited mode, I can still provide valuable insights and guidance.

**Available Services:**
• Business process optimization
• Cultural heritage exploration
• Programming assistance
• General analysis and problem-solving

**Enhanced Features (Sign in required):**
• Access to specialized AI models
• Personalized recommendations
• Advanced analysis capabilities
• Integration with business tools

How can I assist you today?
    `);
  }

  private async initializeProviders() {
    // Initialize comprehensive provider list
    const defaultProviders: AIProvider[] = [
      {
        id: 'openai-gpt4',
        name: 'OpenAI GPT-4',
        type: 'openai',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        models: ['gpt-4', 'gpt-4-turbo-preview', 'gpt-4-1106-preview'],
        capabilities: ['chat', 'analysis', 'generation', 'coding', 'business'],
        costPerToken: 0.00003,
        maxTokens: 8192,
        isActive: true,
        priority: 1,
        config: {
          temperature: 0.7,
          topP: 1,
          frequencyPenalty: 0,
          presencePenalty: 0
        }
      },
      {
        id: 'openai-gpt35',
        name: 'OpenAI GPT-3.5 Turbo',
        type: 'openai',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        models: ['gpt-3.5-turbo', 'gpt-3.5-turbo-16k'],
        capabilities: ['chat', 'analysis', 'generation'],
        costPerToken: 0.000002,
        maxTokens: 4096,
        isActive: true,
        priority: 5,
        config: {
          temperature: 0.7,
          topP: 1
        }
      },
      {
        id: 'anthropic-claude',
        name: 'Anthropic Claude',
        type: 'anthropic',
        endpoint: 'https://api.anthropic.com/v1/messages',
        models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
        capabilities: ['chat', 'analysis', 'generation', 'business', 'cultural'],
        costPerToken: 0.000015,
        maxTokens: 4096,
        isActive: true,
        priority: 2,
        config: {
          temperature: 0.7,
          maxTokens: 4096
        }
      },
      {
        id: 'google-gemini',
        name: 'Google Gemini Pro',
        type: 'google',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        models: ['gemini-pro', 'gemini-pro-vision'],
        capabilities: ['chat', 'analysis', 'generation', 'cultural'],
        costPerToken: 0.0000005,
        maxTokens: 2048,
        isActive: true,
        priority: 3,
        config: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95
        }
      },
      {
        id: 'google-gemini-15',
        name: 'Google Gemini 1.5 Pro',
        type: 'google',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent',
        models: ['gemini-1.5-pro'],
        capabilities: ['chat', 'analysis', 'generation', 'coding', 'business'],
        costPerToken: 0.000001,
        maxTokens: 8192,
        isActive: true,
        priority: 2,
        config: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95
        }
      },
      {
        id: 'dylanallan-assistant',
        name: 'DylanAllan.io Business Consultant',
        type: 'dylanallan',
        endpoint: 'https://dylanallan.io/api/chat',
        models: ['dylanallan-v1', 'dylanallan-business'],
        capabilities: ['business', 'automation', 'consulting', 'strategy'],
        costPerToken: 0.00001,
        maxTokens: 4096,
        isActive: true,
        priority: 1, // High priority for business tasks
        config: {
          context: 'business_automation',
          expertise: 'consulting'
        }
      },
      {
        id: 'ollama-local',
        name: 'Ollama Local Models',
        type: 'ollama',
        endpoint: 'http://localhost:11434/api/generate',
        models: ['llama2', 'codellama', 'mistral', 'neural-chat'],
        capabilities: ['chat', 'coding', 'analysis'],
        costPerToken: 0,
        maxTokens: 4096,
        isActive: false, // Disabled by default
        priority: 6,
        config: {
          stream: true,
          temperature: 0.7
        }
      },
      {
        id: 'deepseek-coder',
        name: 'DeepSeek Coder',
        type: 'deepseek',
        endpoint: 'https://api.deepseek.com/v1/chat/completions',
        models: ['deepseek-coder', 'deepseek-chat'],
        capabilities: ['coding', 'analysis', 'generation'],
        costPerToken: 0.000001,
        maxTokens: 4096,
        isActive: true,
        priority: 2, // High priority for coding
        config: {
          temperature: 0.3, // Lower temperature for coding
          topP: 0.95
        }
      }
    ];

    // Load providers from database and merge with defaults
    try {
      const { data: dbProviders, error } = await supabase
        .from('ai_service_config')
        .select('*');

      if (error) throw error;

      // Merge database providers with defaults
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
      });

      console.log(`Initialized ${this.providers.size} AI providers`);
    } catch (error) {
      console.error('Error loading AI providers:', error);
      // Use default providers if database fails
      defaultProviders.forEach(provider => {
        this.providers.set(provider.id, provider);
      });
    }
  }

  async routeRequest(request: AIRequest): Promise<AsyncGenerator<string>> {
    const bestProvider = await this.selectBestProvider(request);
    
    if (!bestProvider) {
      return this.getFallbackResponse(request);
    }

    try {
      return this.executeRequest(bestProvider, request);
    } catch (error) {
      console.error(`Primary provider ${bestProvider.id} failed:`, error);
      return this.getFallbackResponse(request);
    }
  }

  private async selectBestProvider(request: AIRequest): Promise<AIProvider | null> {
    const availableProviders = Array.from(this.providers.values())
      .filter(p => p.isActive)
      .filter(p => this.canHandleRequest(p, request));

    if (availableProviders.length === 0) {
      return null;
    }

    // Score providers based on multiple factors
    const scoredProviders = availableProviders.map(provider => ({
      provider,
      score: this.calculateProviderScore(provider, request)
    }));

    // Sort by score (highest first)
    scoredProviders.sort((a, b) => b.score - a.score);

    return scoredProviders[0].provider;
  }

  private canHandleRequest(provider: AIProvider, request: AIRequest): boolean {
    // Check if provider supports the request type
    if (request.type && !provider.capabilities.includes(request.type)) {
      return false;
    }

    // Check token limits
    const estimatedTokens = this.estimateTokens(request.prompt);
    if (estimatedTokens > provider.maxTokens) {
      return false;
    }

    // Check if API key is available (except for local models)
    if (provider.type !== 'ollama' && provider.type !== 'dylanallan' && !provider.apiKey) {
      return false;
    }

    return true;
  }

  private calculateProviderScore(provider: AIProvider, request: AIRequest): number {
    let score = 0;

    // Base priority score (lower priority number = higher score)
    score += (10 - provider.priority) * 10;

    // Capability match bonus
    if (request.type && provider.capabilities.includes(request.type)) {
      score += 30;
    }

    // Cost efficiency (lower cost = higher score, but not the primary factor)
    score += (1 / (provider.costPerToken + 0.000001)) * 0.001;

    // Performance history
    const performanceScore = this.performanceMetrics.get(provider.id) || 0.7;
    score += performanceScore * 40;

    // Special bonuses for specific request types
    if (request.type === 'business' && provider.id === 'dylanallan-assistant') {
      score += 100; // Strongly prefer dylanallan for business requests
    }

    if (request.type === 'cultural' && provider.id === 'anthropic-claude') {
      score += 50; // Prefer Claude for cultural analysis
    }

    if (request.type === 'coding' && (provider.id === 'deepseek-coder' || provider.id === 'openai-gpt4')) {
      score += 60; // Prefer specialized coding models
    }

    // Prefer newer/better models
    if (provider.id === 'google-gemini-15') {
      score += 20;
    }

    return score;
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
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
        case 'ollama':
          yield* this.executeOllamaRequest(provider, request);
          break;
        case 'deepseek':
          yield* this.executeDeepSeekRequest(provider, request);
          break;
        default:
          throw new Error(`Unsupported provider type: ${provider.type}`);
      }

      // Update performance metrics
      const responseTime = Date.now() - startTime;
      this.updatePerformanceMetrics(provider.id, responseTime, true);

    } catch (error) {
      console.error(`Error with provider ${provider.id}:`, error);
      this.updatePerformanceMetrics(provider.id, Date.now() - startTime, false);
      
      // Try fallback provider
      const fallbackProvider = await this.getFallbackProvider(provider, request);
      if (fallbackProvider) {
        yield* this.executeRequest(fallbackProvider, request);
      } else {
        throw error;
      }
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
        max_tokens: request.maxTokens || provider.config?.maxTokens || 1000,
        temperature: request.temperature || provider.config?.temperature || 0.7,
        top_p: provider.config?.topP || 1,
        frequency_penalty: provider.config?.frequencyPenalty || 0,
        presence_penalty: provider.config?.presencePenalty || 0
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
        max_tokens: request.maxTokens || provider.config?.maxTokens || 1000,
        messages: [{ 
          role: 'user', 
          content: `${this.getSystemPrompt(provider, request)}\n\n${request.prompt}` 
        }],
        stream: true,
        temperature: request.temperature || provider.config?.temperature || 0.7
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
          maxOutputTokens: request.maxTokens || provider.config?.maxTokens || 1000,
          temperature: request.temperature || provider.config?.temperature || 0.7,
          topK: provider.config?.topK || 40,
          topP: provider.config?.topP || 0.95
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
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Genesis-Heritage-AI-Router/1.0',
          'Accept': 'text/plain, application/json'
        },
        body: JSON.stringify({
          message: request.prompt,
          context: request.context || provider.config?.context || 'business_automation',
          user_id: request.userId,
          stream: true,
          expertise: provider.config?.expertise || 'consulting'
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
      
      // Provide comprehensive business-focused fallback
      const fallbackResponse = this.fallbackResponses.get('business') || this.fallbackResponses.get('default')!;
      
      const words = fallbackResponse.split(' ');
      for (let i = 0; i < words.length; i++) {
        yield words[i] + (i < words.length - 1 ? ' ' : '');
        await new Promise(resolve => setTimeout(resolve, 40));
      }
    }
  }

  private async* executeOllamaRequest(provider: AIProvider, request: AIRequest): AsyncGenerator<string> {
    try {
      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: provider.models[0],
          prompt: `${this.getSystemPrompt(provider, request)}\n\n${request.prompt}`,
          stream: true,
          options: {
            temperature: request.temperature || provider.config?.temperature || 0.7,
            num_predict: request.maxTokens || provider.config?.maxTokens || 1000
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
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
          try {
            const parsed = JSON.parse(line);
            if (parsed.response) {
              yield parsed.response;
            }
            if (parsed.done) {
              return;
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    } catch (error) {
      throw new Error(`Ollama connection failed: ${error.message}`);
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
        max_tokens: request.maxTokens || provider.config?.maxTokens || 1000,
        temperature: request.temperature || provider.config?.temperature || 0.3,
        top_p: provider.config?.topP || 0.95
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
    const basePrompt = "You are a helpful AI assistant.";
    
    switch (request.type) {
      case 'business':
        return "You are a business automation and consulting specialist. Provide practical, actionable advice for improving business processes and efficiency.";
      case 'cultural':
        return "You are a cultural heritage specialist. Help users explore and integrate their cultural background into modern life while preserving traditions.";
      case 'coding':
        return "You are a programming expert. Provide clear, well-documented code solutions and explain best practices.";
      case 'analysis':
        return "You are an analytical expert. Provide thorough, well-reasoned analysis with clear conclusions and recommendations.";
      default:
        return basePrompt;
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

  private async getFallbackProvider(failedProvider: AIProvider, request: AIRequest): Promise<AIProvider | null> {
    const availableProviders = Array.from(this.providers.values())
      .filter(p => p.isActive && p.id !== failedProvider.id)
      .filter(p => this.canHandleRequest(p, request))
      .sort((a, b) => a.priority - b.priority);

    return availableProviders[0] || null;
  }

  private updatePerformanceMetrics(providerId: string, responseTime: number, success: boolean) {
    const currentScore = this.performanceMetrics.get(providerId) || 0.7;
    const timeScore = Math.max(0, 1 - (responseTime / 15000)); // Penalize slow responses
    const successScore = success ? 1 : 0;
    const newScore = (currentScore * 0.8) + ((timeScore + successScore) / 2 * 0.2);
    
    this.performanceMetrics.set(providerId, newScore);
  }

  async getProviderStatus(): Promise<Map<string, any>> {
    const status = new Map();
    
    for (const [id, provider] of this.providers) {
      status.set(id, {
        name: provider.name,
        isActive: provider.isActive,
        performance: this.performanceMetrics.get(id) || 0.7,
        capabilities: provider.capabilities,
        priority: provider.priority,
        type: provider.type,
        hasApiKey: !!provider.apiKey,
        costPerToken: provider.costPerToken
      });
    }
    
    return status;
  }

  async updateProviderConfig(providerId: string, config: Partial<AIProvider>) {
    const provider = this.providers.get(providerId);
    if (provider) {
      Object.assign(provider, config);
      this.providers.set(providerId, provider);
      
      // Update database
      try {
        await supabase
          .from('ai_service_config')
          .upsert({
            service_name: providerId,
            api_key: provider.apiKey,
            is_active: provider.isActive,
            config: {
              capabilities: provider.capabilities,
              priority: provider.priority,
              maxTokens: provider.maxTokens,
              ...provider.config
            }
          });
      } catch (error) {
        console.error('Error updating provider config:', error);
      }
    }
  }

  async enableProvider(providerId: string, apiKey?: string) {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.isActive = true;
      if (apiKey) {
        provider.apiKey = apiKey;
      }
      await this.updateProviderConfig(providerId, provider);
      toast.success(`${provider.name} enabled successfully`);
    }
  }

  async disableProvider(providerId: string) {
    const provider = this.providers.get(providerId);
    if (provider) {
      provider.isActive = false;
      await this.updateProviderConfig(providerId, provider);
      toast.info(`${provider.name} disabled`);
    }
  }

  getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.values()).filter(p => p.isActive);
  }

  getProviderById(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }
}

export const aiRouter = AIRouter.getInstance();