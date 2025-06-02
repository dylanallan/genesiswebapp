import { LangChain } from 'langchain';
import * as tf from '@tensorflow/tfjs';
import { supabase } from './supabase';
import { toast } from 'sonner';

interface LLMConfig {
  name: string;
  version: string;
  capabilities: string[];
  contextWindow: number;
  apiEndpoint: string;
  apiKey?: string;
}

interface KnowledgeSource {
  id: string;
  name: string;
  type: 'api' | 'database' | 'webscrape' | 'document';
  lastUpdated: Date;
  reliability: number;
  url?: string;
}

class AIRouter {
  private static instance: AIRouter;
  private availableModels: Map<string, LLMConfig> = new Map();
  private knowledgeSources: Map<string, KnowledgeSource> = new Map();
  private modelPerformanceMetrics: Map<string, number> = new Map();
  private lastModelUpdate: Date = new Date();

  private constructor() {
    this.initializeModels();
    this.initializeKnowledgeSources();
    this.startAutomaticUpdates();
  }

  static getInstance(): AIRouter {
    if (!AIRouter.instance) {
      AIRouter.instance = new AIRouter();
    }
    return AIRouter.instance;
  }

  private async initializeModels() {
    try {
      const { data: models, error } = await supabase
        .from('ai_models')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      models?.forEach(model => {
        this.availableModels.set(model.name, {
          name: model.name,
          version: model.version,
          capabilities: model.capabilities,
          contextWindow: model.context_window,
          apiEndpoint: model.api_endpoint
        });
      });
    } catch (error) {
      console.error('Error initializing models:', error);
      toast.error('Failed to initialize AI models');
    }
  }

  private async initializeKnowledgeSources() {
    try {
      const { data: sources, error } = await supabase
        .from('knowledge_sources')
        .select('*')
        .order('reliability', { ascending: false });

      if (error) throw error;

      sources?.forEach(source => {
        this.knowledgeSources.set(source.id, {
          id: source.id,
          name: source.name,
          type: source.type,
          lastUpdated: new Date(source.last_updated),
          reliability: source.reliability,
          url: source.url
        });
      });
    } catch (error) {
      console.error('Error initializing knowledge sources:', error);
      toast.error('Failed to initialize knowledge sources');
    }
  }

  private startAutomaticUpdates() {
    setInterval(async () => {
      await this.updateModels();
      await this.updateKnowledgeSources();
      this.optimizeModelSelection();
    }, 1000 * 60 * 60); // Check for updates every hour
  }

  private async updateModels() {
    try {
      const { data: newModels, error } = await supabase
        .from('ai_models')
        .select('*')
        .gt('created_at', this.lastModelUpdate.toISOString());

      if (error) throw error;

      if (newModels && newModels.length > 0) {
        newModels.forEach(model => {
          this.availableModels.set(model.name, {
            name: model.name,
            version: model.version,
            capabilities: model.capabilities,
            contextWindow: model.context_window,
            apiEndpoint: model.api_endpoint
          });
        });
        this.lastModelUpdate = new Date();
        toast.success('New AI models available');
      }
    } catch (error) {
      console.error('Error updating models:', error);
    }
  }

  private async updateKnowledgeSources() {
    try {
      // Update existing knowledge sources
      for (const source of this.knowledgeSources.values()) {
        if (source.type === 'api' || source.type === 'webscrape') {
          const updatedData = await this.fetchLatestData(source);
          if (updatedData) {
            await this.updateKnowledgeBase(source.id, updatedData);
            source.lastUpdated = new Date();
          }
        }
      }

      // Look for new knowledge sources
      const { data: newSources, error } = await supabase
        .from('knowledge_sources')
        .select('*')
        .gt('created_at', this.lastModelUpdate.toISOString());

      if (error) throw error;

      if (newSources) {
        newSources.forEach(source => {
          this.knowledgeSources.set(source.id, {
            id: source.id,
            name: source.name,
            type: source.type,
            lastUpdated: new Date(source.last_updated),
            reliability: source.reliability,
            url: source.url
          });
        });
      }
    } catch (error) {
      console.error('Error updating knowledge sources:', error);
    }
  }

  private async fetchLatestData(source: KnowledgeSource): Promise<any> {
    try {
      if (source.type === 'api' && source.url) {
        const response = await fetch(source.url);
        return await response.json();
      } else if (source.type === 'webscrape' && source.url) {
        // Implement web scraping logic
        return null;
      }
    } catch (error) {
      console.error(`Error fetching data from ${source.name}:`, error);
      return null;
    }
  }

  private async updateKnowledgeBase(sourceId: string, data: any) {
    try {
      const { error } = await supabase
        .from('knowledge_base')
        .upsert({
          source_id: sourceId,
          content: data,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating knowledge base:', error);
    }
  }

  private optimizeModelSelection() {
    // Use TensorFlow.js to analyze model performance
    const modelMetrics = Array.from(this.modelPerformanceMetrics.entries());
    if (modelMetrics.length > 0) {
      const tensor = tf.tensor2d(modelMetrics.map(([_, value]) => [value]));
      const normalized = tf.div(tensor, tf.max(tensor));
      
      normalized.array().then(array => {
        array.forEach((value, index) => {
          const modelName = modelMetrics[index][0];
          this.modelPerformanceMetrics.set(modelName, value[0]);
        });
      });
    }
  }

  async routeRequest(prompt: string, context?: any): Promise<any> {
    try {
      // Analyze prompt to determine best model
      const bestModel = await this.selectBestModel(prompt, context);
      
      // Get relevant knowledge
      const knowledge = await this.getRelevantKnowledge(prompt);
      
      // Enhance prompt with knowledge
      const enhancedPrompt = this.enhancePrompt(prompt, knowledge);
      
      // Route to selected model
      return await this.executeRequest(bestModel, enhancedPrompt, context);
    } catch (error) {
      console.error('Error routing request:', error);
      throw error;
    }
  }

  private async selectBestModel(prompt: string, context?: any): Promise<LLMConfig> {
    const promptEmbedding = await this.generateEmbedding(prompt);
    let bestScore = -1;
    let bestModel: LLMConfig | null = null;

    for (const model of this.availableModels.values()) {
      const score = await this.calculateModelScore(model, promptEmbedding, context);
      if (score > bestScore) {
        bestScore = score;
        bestModel = model;
      }
    }

    if (!bestModel) {
      throw new Error('No suitable model found');
    }

    return bestModel;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Use TensorFlow.js for embedding generation
    const encoder = await tf.loadLayersModel('path/to/encoder/model');
    const embedding = encoder.predict(tf.tensor([text])) as tf.Tensor;
    return Array.from(await embedding.data());
  }

  private async calculateModelScore(
    model: LLMConfig,
    promptEmbedding: number[],
    context?: any
  ): Promise<number> {
    let score = 0;

    // Consider model capabilities
    score += model.capabilities.length * 0.1;

    // Consider context window if context is provided
    if (context) {
      const contextSize = JSON.stringify(context).length;
      score += contextSize <= model.contextWindow ? 0.3 : -0.3;
    }

    // Consider historical performance
    const performanceScore = this.modelPerformanceMetrics.get(model.name) || 0.5;
    score += performanceScore;

    return score;
  }

  private async getRelevantKnowledge(prompt: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .rpc('search_knowledge_base', {
          query_text: prompt,
          similarity_threshold: 0.7,
          max_results: 5
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching relevant knowledge:', error);
      return [];
    }
  }

  private enhancePrompt(prompt: string, knowledge: any[]): string {
    let enhancedPrompt = prompt;

    if (knowledge.length > 0) {
      const contextStr = knowledge
        .map(k => `Context: ${k.content}`)
        .join('\n\n');
      enhancedPrompt = `${contextStr}\n\nQuestion: ${prompt}`;
    }

    return enhancedPrompt;
  }

  private async executeRequest(
    model: LLMConfig,
    prompt: string,
    context?: any
  ): Promise<any> {
    try {
      const response = await fetch(model.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(model.apiKey && { 'Authorization': `Bearer ${model.apiKey}` })
        },
        body: JSON.stringify({
          prompt,
          context,
          model: model.name,
          version: model.version
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update performance metrics
      this.updateModelPerformance(model.name, result.quality || 0.5);
      
      return result;
    } catch (error) {
      console.error(`Error executing request with ${model.name}:`, error);
      throw error;
    }
  }

  private updateModelPerformance(modelName: string, quality: number) {
    const currentScore = this.modelPerformanceMetrics.get(modelName) || 0.5;
    const newScore = (currentScore * 0.9) + (quality * 0.1); // Exponential moving average
    this.modelPerformanceMetrics.set(modelName, newScore);
  }
}

export const aiRouter = AIRouter.getInstance();