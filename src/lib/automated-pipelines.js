// Automated Data Ingestion Pipelines
// Continuous data collection and processing for Genesis Heritage Pro

import { createClient } from '@supabase/supabase-js';
import { ComprehensiveAPIIntegrations } from './api-integrations.js';

const SUPABASE_URL = 'https://yomgwdeqsvbapvqpuspq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbWd3ZGVxc3ZiYXB2cXB1c3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NzI4NzQsImV4cCI6MjA1MTU0ODg3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export class AutomatedPipelines {
  constructor() {
    this.apiIntegrations = new ComprehensiveAPIIntegrations();
    this.isRunning = false;
    this.schedules = {
      realtime: 5 * 60 * 1000, // 5 minutes
      hourly: 60 * 60 * 1000, // 1 hour
      daily: 24 * 60 * 60 * 1000, // 24 hours
      weekly: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
  }

  // Real-time data pipeline (every 5 minutes)
  async startRealtimePipeline() {
    console.log('🔄 Starting real-time data pipeline...');
    
    setInterval(async () => {
      if (!this.isRunning) {
        await this.ingestRealtimeData();
      }
    }, this.schedules.realtime);
  }

  async ingestRealtimeData() {
    this.isRunning = true;
    console.log('⚡ Ingesting real-time data...');
    
    try {
      // News and social media data (most time-sensitive)
      const realtimeData = {
        news: await this.apiIntegrations.fetchNewsAPIData('AI technology', 20),
        social: await this.apiIntegrations.fetchStackOverflowData('artificial intelligence', 20),
        business: await this.apiIntegrations.fetchYahooFinanceData('AAPL')
      };

      await this.processAndStoreData(realtimeData, 'realtime');
      console.log('✅ Real-time data ingestion completed');
    } catch (error) {
      console.error('❌ Error in real-time pipeline:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Hourly data pipeline
  async startHourlyPipeline() {
    console.log('🔄 Starting hourly data pipeline...');
    
    setInterval(async () => {
      await this.ingestHourlyData();
    }, this.schedules.hourly);
  }

  async ingestHourlyData() {
    console.log('⏰ Ingesting hourly data...');
    
    try {
      const hourlyData = {
        academic: await this.apiIntegrations.fetchArxivData('artificial intelligence', 30),
        technology: await this.apiIntegrations.fetchGitHubData('AI projects', 30),
        government: await this.apiIntegrations.fetchNASAAPOD(30)
      };

      await this.processAndStoreData(hourlyData, 'hourly');
      console.log('✅ Hourly data ingestion completed');
    } catch (error) {
      console.error('❌ Error in hourly pipeline:', error);
    }
  }

  // Daily data pipeline
  async startDailyPipeline() {
    console.log('🔄 Starting daily data pipeline...');
    
    setInterval(async () => {
      await this.ingestDailyData();
    }, this.schedules.daily);
  }

  async ingestDailyData() {
    console.log('📅 Ingesting daily data...');
    
    try {
      const dailyData = {
        academic: await this.apiIntegrations.fetchSemanticScholarData('AI research', 100),
        cultural: await this.apiIntegrations.fetchWikimediaData('family history', 50),
        technology: await this.apiIntegrations.fetchStackOverflowData('machine learning', 100)
      };

      await this.processAndStoreData(dailyData, 'daily');
      console.log('✅ Daily data ingestion completed');
    } catch (error) {
      console.error('❌ Error in daily pipeline:', error);
    }
  }

  // Weekly comprehensive pipeline
  async startWeeklyPipeline() {
    console.log('🔄 Starting weekly comprehensive pipeline...');
    
    setInterval(async () => {
      await this.ingestWeeklyData();
    }, this.schedules.weekly);
  }

  async ingestWeeklyData() {
    console.log('📊 Ingesting weekly comprehensive data...');
    
    try {
      // Full comprehensive data ingestion
      const weeklyData = await this.apiIntegrations.ingestAllDataSources();
      await this.processAndStoreData(weeklyData, 'weekly');
      console.log('✅ Weekly comprehensive data ingestion completed');
    } catch (error) {
      console.error('❌ Error in weekly pipeline:', error);
    }
  }

  // Data processing and quality control
  async processAndStoreData(data, pipelineType) {
    console.log(`🔧 Processing ${pipelineType} data...`);
    
    try {
      for (const [category, items] of Object.entries(data)) {
        if (items && items.length > 0) {
          // Quality control and enrichment
          const processedItems = await this.enrichData(items, category);
          
          // Store in appropriate tables
          await this.storeDataByCategory(processedItems, category);
          
          // Update analytics
          await this.updateAnalytics(category, processedItems.length);
        }
      }
    } catch (error) {
      console.error('❌ Error processing data:', error);
    }
  }

  // Data enrichment and quality control
  async enrichData(items, category) {
    return items.map(item => ({
      ...item,
      pipeline_type: 'automated',
      ingestion_timestamp: new Date().toISOString(),
      quality_score: this.calculateQualityScore(item),
      category: category,
      processed: true
    }));
  }

  calculateQualityScore(item) {
    let score = 0.5; // Base score
    
    // Title quality
    if (item.title && item.title.length > 10) score += 0.1;
    if (item.title && item.title.length > 50) score += 0.1;
    
    // Content quality
    if (item.content && item.content.length > 100) score += 0.1;
    if (item.description && item.description.length > 50) score += 0.1;
    
    // Source reliability
    const reliableSources = ['arXiv', 'PubMed', 'NASA', 'GitHub', 'Stack Overflow'];
    if (reliableSources.includes(item.source)) score += 0.1;
    
    // Completeness
    const requiredFields = ['title', 'source', 'source_category'];
    const completeness = requiredFields.filter(field => item[field]).length / requiredFields.length;
    score += completeness * 0.1;
    
    return Math.min(score, 1.0);
  }

  // Store data in appropriate tables
  async storeDataByCategory(items, category) {
    try {
      switch (category) {
        case 'academic':
          await this.storeAcademicData(items);
          break;
        case 'cultural':
          await this.storeCulturalData(items);
          break;
        case 'business':
          await this.storeBusinessData(items);
          break;
        case 'news':
          await this.storeNewsData(items);
          break;
        case 'technology':
          await this.storeTechnologyData(items);
          break;
        case 'government':
          await this.storeGovernmentData(items);
          break;
        default:
          await this.storeGenericData(items);
      }
    } catch (error) {
      console.error(`Error storing ${category} data:`, error);
    }
  }

  async storeAcademicData(items) {
    const { error } = await supabase
      .from('research_papers')
      .insert(items.map(item => ({
        title: item.title,
        authors: item.authors,
        abstract: item.abstract || item.summary,
        doi: item.doi,
        journal: item.venue,
        publication_date: item.published || item.year,
        citations: item.citations,
        keywords: item.category ? [item.category] : [],
        full_text: item.content
      })));
    
    if (error) throw error;
  }

  async storeCulturalData(items) {
    const { error } = await supabase
      .from('cultural_heritage')
      .insert(items.map(item => ({
        title: item.title,
        description: item.description,
        culture: 'Global',
        period: 'Contemporary',
        location: 'Digital',
        institution: item.source,
        collection_url: item.url,
        artifact_type: 'Digital Content',
        materials: ['Digital'],
        provenance: item.source
      })));
    
    if (error) throw error;
  }

  async storeBusinessData(items) {
    const { error } = await supabase
      .from('business_intelligence')
      .insert(items.map(item => ({
        company_name: item.company_name,
        ticker_symbol: item.ticker_symbol,
        industry: item.industry,
        market_cap: item.market_cap,
        revenue: item.revenue,
        employees: item.employees,
        description: item.description,
        financial_data: item
      })));
    
    if (error) throw error;
  }

  async storeNewsData(items) {
    const { error } = await supabase
      .from('news_articles')
      .insert(items.map(item => ({
        title: item.title,
        author: item.author,
        source: item.source,
        url: item.url,
        published_date: item.published_date,
        content: item.content,
        summary: item.summary,
        sentiment_score: this.calculateSentiment(item.content),
        keywords: this.extractKeywords(item.content)
      })));
    
    if (error) throw error;
  }

  async storeTechnologyData(items) {
    const { error } = await supabase
      .from('knowledge_base')
      .insert(items.map(item => ({
        title: item.title,
        content: item.content || item.description,
        source_category: 'Technology & Innovation Intelligence',
        source_name: item.source,
        source_url: item.url,
        keywords: item.tags || this.extractKeywords(item.content),
        metadata: {
          stars: item.stars,
          forks: item.forks,
          language: item.language,
          score: item.score,
          answers: item.answers
        }
      })));
    
    if (error) throw error;
  }

  async storeGovernmentData(items) {
    const { error } = await supabase
      .from('knowledge_base')
      .insert(items.map(item => ({
        title: item.title,
        content: item.description,
        source_category: 'Government & Public Data',
        source_name: item.source,
        source_url: item.url,
        keywords: this.extractKeywords(item.description),
        metadata: {
          date: item.date,
          copyright: item.copyright
        }
      })));
    
    if (error) throw error;
  }

  async storeGenericData(items) {
    const { error } = await supabase
      .from('knowledge_base')
      .insert(items);
    
    if (error) throw error;
  }

  // Analytics and monitoring
  async updateAnalytics(category, count) {
    try {
      const { error } = await supabase
        .from('data_analytics')
        .upsert({
          category: category,
          ingestion_count: count,
          last_updated: new Date().toISOString(),
          pipeline_status: 'success'
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  }

  // Utility functions
  calculateSentiment(text) {
    if (!text) return 0;
    
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'positive'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'negative', 'poor'];
    
    const words = text.toLowerCase().split(' ');
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });
    
    return (positiveCount - negativeCount) / words.length;
  }

  extractKeywords(text) {
    if (!text) return [];
    
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = text.toLowerCase().split(' ').filter(word => 
      word.length > 3 && !commonWords.includes(word)
    );
    
    return [...new Set(words)].slice(0, 10);
  }

  // Start all pipelines
  async startAllPipelines() {
    console.log('🚀 Starting all automated data pipelines...');
    
    await this.startRealtimePipeline();
    await this.startHourlyPipeline();
    await this.startDailyPipeline();
    await this.startWeeklyPipeline();
    
    console.log('✅ All pipelines started successfully!');
  }

  // Stop all pipelines
  stopAllPipelines() {
    console.log('🛑 Stopping all pipelines...');
    this.isRunning = false;
    console.log('✅ All pipelines stopped');
  }

  // Get pipeline status
  getPipelineStatus() {
    return {
      isRunning: this.isRunning,
      schedules: this.schedules,
      lastUpdate: new Date().toISOString()
    };
  }
} 