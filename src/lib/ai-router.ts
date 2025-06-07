import { supabase } from './supabase';
import { toast } from 'sonner';

export interface AIProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'google' | 'custom' | 'dylanallan';
  endpoint: string;
  apiKey?: string;
  models: string[];
  capabilities: string[];
  costPerToken: number;
  maxTokens: number;
  isActive: boolean;
  priority: number;
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

  private constructor() {
    this.initializeProviders();
  }

  static getInstance(): AIRouter {
    if (!AIRouter.instance) {
      AIRouter.instance = new AIRouter();
    }
    return AIRouter.instance;
  }

  private async initializeProviders() {
    // Initialize default providers
    const defaultProviders: AIProvider[] = [
      {
        id: 'openai-gpt4',
        name: 'OpenAI GPT-4',
        type: 'openai',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        models: ['gpt-4', 'gpt-4-turbo-preview'],
        capabilities: ['chat', 'analysis', 'generation', 'coding', 'business'],
        costPerToken: 0.00003,
        maxTokens: 8192,
        isActive: true,
        priority: 1
      },
      {
        id: 'anthropic-claude',
        name: 'Anthropic Claude',
        type: 'anthropic',
        endpoint: 'https://api.anthropic.com/v1/messages',
        models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229'],
        capabilities: ['chat', 'analysis', 'generation', 'business', 'cultural'],
        costPerToken: 0.000015,
        maxTokens: 4096,
        isActive: true,
        priority: 2
      },
      {
        id: 'google-gemini',
        name: 'Google Gemini',
        type: 'google',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        models: ['gemini-pro', 'gemini-pro-vision'],
        capabilities: ['chat', 'analysis', 'generation', 'cultural'],
        costPerToken: 0.0000005,
        maxTokens: 2048,
        isActive: true,
        priority: 3
      },
      {
        id: 'dylanallan-assistant',
        name: 'DylanAllan.io Assistant',
        type: 'dylanallan',
        endpoint: 'https://dylanallan.io/api/chat',
        models: ['dylanallan-v1'],
        capabilities: ['business', 'automation', 'consulting', 'strategy'],
        costPerToken: 0.00001,
        maxTokens: 4096,
        isActive: false, // Disabled by default due to connectivity issues
        priority: 4
      }
    ];

    // Load providers from database
    try {
      const { data: dbProviders, error } = await supabase
        .from('ai_service_config')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      // Merge database providers with defaults
      defaultProviders.forEach(provider => {
        const dbProvider = dbProviders?.find(p => p.service_name === provider.id);
        if (dbProvider) {
          provider.apiKey = dbProvider.api_key;
          provider.isActive = dbProvider.is_active;
        }
        this.providers.set(provider.id, provider);
      });

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
      throw new Error('No suitable AI provider available');
    }

    return this.executeRequest(bestProvider, request);
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

    // Check if API key is available (except for dylanallan which might be public)
    if (provider.type !== 'dylanallan' && !provider.apiKey) {
      return false;
    }

    return true;
  }

  private calculateProviderScore(provider: AIProvider, request: AIRequest): number {
    let score = 0;

    // Base priority score
    score += (10 - provider.priority) * 10;

    // Capability match bonus
    if (request.type && provider.capabilities.includes(request.type)) {
      score += 20;
    }

    // Cost efficiency (lower cost = higher score)
    score += (1 / provider.costPerToken) * 0.001;

    // Performance history
    const performanceScore = this.performanceMetrics.get(provider.id) || 0.5;
    score += performanceScore * 30;

    // Special bonuses for specific request types
    if (request.type === 'business' && provider.id === 'dylanallan-assistant') {
      score += 50; // Prefer dylanallan for business requests
    }

    if (request.type === 'cultural' && provider.id === 'anthropic-claude') {
      score += 30; // Prefer Claude for cultural analysis
    }

    if (request.type === 'coding' && provider.id === 'openai-gpt4') {
      score += 40; // Prefer GPT-4 for coding
    }

    return score;
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  private async* executeRequest(provider: AIProvider, request: AIRequest): AsyncGenerator<string> {
    const startTime = Date.now();
    let tokensUsed = 0;
    let fullResponse = '';

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
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${provider.apiKey}`
      },
      body: JSON.stringify({
        model: provider.models[0],
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant.' },
          { role: 'user', content: request.prompt }
        ],
        stream: true,
        max_tokens: request.maxTokens || 1000,
        temperature: request.temperature || 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
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
    const response = await fetch(provider.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': provider.apiKey!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: provider.models[0],
        max_tokens: request.maxTokens || 1000,
        messages: [{ role: 'user', content: request.prompt }],
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
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
    const response = await fetch(`${provider.endpoint}?key=${provider.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: request.prompt }]
        }],
        generationConfig: {
          maxOutputTokens: request.maxTokens || 1000,
          temperature: request.temperature || 0.7
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Google API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Simulate streaming for Google API
    const words = content.split(' ');
    for (let i = 0; i < words.length; i++) {
      yield words[i] + (i < words.length - 1 ? ' ' : '');
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  private async* executeDylanAllanRequest(provider: AIProvider, request: AIRequest): AsyncGenerator<string> {
    try {
      // Add timeout and better error handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Genesis-Heritage-AI-Router/1.0'
        },
        body: JSON.stringify({
          message: request.prompt,
          context: request.context || 'business_automation',
          user_id: request.userId,
          stream: true
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
      
      // Provide a comprehensive fallback response based on the request type
      let fallbackResponse = '';
      
      if (request.type === 'business' || request.context?.includes('business')) {
        fallbackResponse = `I understand you're looking for business automation and consulting guidance. While I'm currently unable to connect to the specialized DylanAllan.io business consultant service, I can provide some general recommendations:

**Business Automation Strategies:**
• Identify repetitive tasks that consume significant time
• Implement workflow automation tools like Zapier or Microsoft Power Automate
• Consider CRM automation for customer relationship management
• Automate financial processes like invoicing and expense tracking
• Use project management tools with automation features

**Consulting Approach:**
• Conduct a thorough business process audit
• Map out current workflows and identify bottlenecks
• Prioritize automation opportunities by ROI potential
• Start with simple automations and gradually increase complexity
• Measure results and continuously optimize

For detailed business strategy, automation consulting, and personalized solutions, I recommend visiting dylanallan.io directly or contacting their team for a consultation.

Would you like me to elaborate on any of these automation strategies?`;
      } else {
        fallbackResponse = `I apologize, but I'm currently unable to connect to the specialized consulting service. However, I can still help you with general business and automation questions. Please let me know what specific area you'd like assistance with, and I'll do my best to provide helpful guidance.`;
      }
      
      // Stream the fallback response
      const words = fallbackResponse.split(' ');
      for (let i = 0; i < words.length; i++) {
        yield words[i] + (i < words.length - 1 ? ' ' : '');
        await new Promise(resolve => setTimeout(resolve, 50));
      }
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
    const currentScore = this.performanceMetrics.get(providerId) || 0.5;
    const timeScore = Math.max(0, 1 - (responseTime / 10000)); // Penalize slow responses
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
        performance: this.performanceMetrics.get(id) || 0.5,
        capabilities: provider.capabilities,
        priority: provider.priority
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
              maxTokens: provider.maxTokens
            }
          });
      } catch (error) {
        console.error('Error updating provider config:', error);
      }
    }
  }
}

export const aiRouter = AIRouter.getInstance();