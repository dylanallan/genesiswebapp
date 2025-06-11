import { supabase } from './supabase';
import { toast } from 'sonner';
import { circuitBreakerManager } from './circuit-breaker';
import { errorRecovery } from './error-recovery';

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

class AIRouter {
  private static instance: AIRouter;
  private providers: Map<string, AIProvider> = new Map();
  private requestHistory: Map<string, AIResponse[]> = new Map();
  private performanceMetrics: Map<string, number> = new Map();
  private fallbackResponses: Map<string, string> = new Map();
  private loadBalancer: Map<string, number> = new Map();
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {
    this.initializeFallbackResponses();
  }

  static getInstance(): AIRouter {
    if (!AIRouter.instance) {
      AIRouter.instance = new AIRouter();
    }
    return AIRouter.instance;
  }

  private async initializeProviders() {
    if (this.isInitialized) return;
    
    // Prevent multiple initialization attempts
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitialization();
    return this.initializationPromise;
  }

  private async doInitialization() {
    try {
      const defaultProviders: AIProvider[] = [
        {
          id: 'openai-gpt4',
          name: 'OpenAI GPT-4 Turbo',
          type: 'openai',
          endpoint: 'https://api.openai.com/v1/chat/completions',
          models: ['gpt-4-turbo-preview', 'gpt-4-1106-preview', 'gpt-4'],
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
            frequencyPenalty: 0,
            presencePenalty: 0,
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
            maxTokens: 4096,
            streamingSupported: true
          }
        },
        {
          id: 'google-gemini-pro',
          name: 'Google Gemini Pro',
          type: 'google',
          endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
          models: ['gemini-pro'],
          capabilities: ['chat', 'analysis', 'generation', 'cultural', 'research'],
          costPerToken: 0.0000005,
          maxTokens: 30720,
          isActive: true,
          priority: 3,
          performance: 0.89,
          reliability: 0.94,
          config: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            streamingSupported: false
          }
        }
      ];

      // Initialize providers with circuit breakers
      defaultProviders.forEach(provider => {
        this.providers.set(provider.id, provider);
        this.performanceMetrics.set(provider.id, provider.performance || 0.7);
        this.loadBalancer.set(provider.id, 0);
        
        // Create circuit breaker for each provider
        circuitBreakerManager.getBreaker(provider.id, {
          failureThreshold: 3,
          resetTimeout: 30000,
          monitoringPeriod: 10000
        });
      });

      this.isInitialized = true;
      console.log(`🚀 AI Router initialized with ${this.providers.size} providers`);
    } catch (error) {
      console.error('AI Router initialization failed:', error);
      await errorRecovery.handleError({
        component: 'ai-router',
        error: error instanceof Error ? error : new Error('Unknown initialization error'),
        timestamp: new Date()
      });
      
      // Still mark as initialized to prevent infinite retry loops
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

Would you like me to dive deeper into any specific area of business automation or strategy?
    `);

    this.fallbackResponses.set('default', `
🤖 **Genesis Heritage AI Assistant**

I'm currently experiencing connectivity issues with our AI providers, but I can still help you with basic guidance:

**🎯 Available Capabilities:**
• Business automation and process optimization
• Cultural heritage exploration and preservation
• Technical development and programming assistance
• Research and analysis support
• Creative project guidance

**✨ Enhanced Features (when connected):**
• Multi-model AI routing for optimal responses
• Personalized recommendations based on your profile
• Advanced analysis capabilities
• Integration with business tools and platforms

Please try your request again in a moment, or refresh the page if issues persist.
    `);
  }

  async routeRequest(request: AIRequest): Promise<AsyncGenerator<string>> {
    try {
      // Ensure providers are initialized
      await this.initializeProviders();

      const circuitBreaker = circuitBreakerManager.getBreaker('ai-router');
      
      return circuitBreaker.execute(async () => {
        // Check if we have a valid session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          return this.getFallbackResponse(request);
        }

        // Use the ai-stream edge function
        const response = await fetch(`${supabase.supabaseUrl}/functions/v1/ai-router`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: request.prompt,
            context: request.context,
            model: request.type === 'business' ? 'gpt-4' : 
                   request.type === 'cultural' ? 'claude-3-opus' : 
                   'auto'
          }),
        });

        if (!response.ok) {
          throw new Error(`AI Router error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        return this.createTextStream(data.text);
      });
    } catch (error) {
      console.error('AI Router error:', error);
      
      await errorRecovery.handleError({
        component: 'ai-router',
        error: error instanceof Error ? error : new Error('Unknown routing error'),
        timestamp: new Date()
      });
      
      return this.getFallbackResponse(request);
    }
  }

  private async* createTextStream(text: string): AsyncGenerator<string> {
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      yield words[i] + (i < words.length - 1 ? ' ' : '');
      await new Promise(resolve => setTimeout(resolve, 30));
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

  // Public API methods with error handling
  async getProviderStatus(): Promise<Map<string, any>> {
    try {
      await this.initializeProviders();
      
      const status = new Map();
      
      for (const [id, provider] of this.providers) {
        const breaker = circuitBreakerManager.getBreaker(id);
        const performance = this.performanceMetrics.get(id) || 0.7;
        const load = this.loadBalancer.get(id) || 0;

        status.set(id, {
          name: provider.name,
          type: provider.type,
          isActive: provider.isActive && breaker.getState() !== 'OPEN',
          performance: Math.round(performance * 100) / 100,
          reliability: provider.reliability,
          capabilities: provider.capabilities,
          priority: provider.priority,
          hasApiKey: !!provider.apiKey,
          costPerToken: provider.costPerToken,
          maxTokens: provider.maxTokens,
          currentLoad: load,
          circuitBreakerOpen: breaker.getState() === 'OPEN',
          failures: breaker.getFailureCount()
        });
      }
      
      return status;
    } catch (error) {
      console.error('Error getting provider status:', error);
      return new Map();
    }
  }

  async enableProvider(providerId: string, apiKey?: string) {
    try {
      const provider = this.providers.get(providerId);
      if (provider) {
        provider.isActive = true;
        if (apiKey) {
          provider.apiKey = apiKey;
        }
        
        // Reset circuit breaker
        const breaker = circuitBreakerManager.getBreaker(providerId);
        breaker.reset();
        
        toast.success(`🚀 ${provider.name} enabled successfully`);
      }
    } catch (error) {
      console.error('Error enabling provider:', error);
      toast.error('Failed to enable provider');
    }
  }

  async disableProvider(providerId: string) {
    try {
      const provider = this.providers.get(providerId);
      if (provider) {
        provider.isActive = false;
        toast.info(`⏸️ ${provider.name} disabled`);
      }
    } catch (error) {
      console.error('Error disabling provider:', error);
      toast.error('Failed to disable provider');
    }
  }

  getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.values()).filter(p => p.isActive);
  }

  getProviderById(id: string): AIProvider | undefined {
    return this.providers.get(id);
  }

  async getProviderMetrics(providerId: string, days: number = 7): Promise<any> {
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
}

export const aiRouter = AIRouter.getInstance();