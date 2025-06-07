import { supabase } from './supabase';
import { aiRouter } from './ai-router';
import { toast } from 'sonner';

interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  timestamp: Date;
  category: 'performance' | 'usage' | 'business' | 'technical';
}

interface AnalyticsInsight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionItems: string[];
  confidence: number;
  category: string;
}

interface PredictiveAnalysis {
  metric: string;
  prediction: number;
  confidence: number;
  timeframe: string;
  factors: string[];
}

class AdvancedAnalytics {
  private static instance: AdvancedAnalytics;
  private metrics: Map<string, AnalyticsMetric[]> = new Map();
  private insights: AnalyticsInsight[] = [];
  private isCollecting = false;

  private constructor() {
    this.startDataCollection();
    this.startInsightGeneration();
  }

  static getInstance(): AdvancedAnalytics {
    if (!AdvancedAnalytics.instance) {
      AdvancedAnalytics.instance = new AdvancedAnalytics();
    }
    return AdvancedAnalytics.instance;
  }

  private async startDataCollection() {
    setInterval(async () => {
      if (!this.isCollecting) {
        await this.collectMetrics();
      }
    }, 60000); // Collect every minute
  }

  private async startInsightGeneration() {
    setInterval(async () => {
      await this.generateInsights();
    }, 300000); // Generate insights every 5 minutes
  }

  private async collectMetrics() {
    this.isCollecting = true;
    
    try {
      // Collect performance metrics
      const performanceMetrics = await this.collectPerformanceMetrics();
      
      // Collect usage metrics
      const usageMetrics = await this.collectUsageMetrics();
      
      // Collect business metrics
      const businessMetrics = await this.collectBusinessMetrics();
      
      // Collect technical metrics
      const technicalMetrics = await this.collectTechnicalMetrics();
      
      // Store all metrics
      await this.storeMetrics([
        ...performanceMetrics,
        ...usageMetrics,
        ...businessMetrics,
        ...technicalMetrics
      ]);
      
    } catch (error) {
      console.error('Error collecting metrics:', error);
    } finally {
      this.isCollecting = false;
    }
  }

  private async collectPerformanceMetrics(): Promise<AnalyticsMetric[]> {
    const metrics: AnalyticsMetric[] = [];
    
    try {
      // AI Router Performance
      const { data: aiLogs } = await supabase
        .from('ai_request_logs')
        .select('response_time_ms, success, created_at')
        .gte('created_at', new Date(Date.now() - 3600000).toISOString());

      if (aiLogs && aiLogs.length > 0) {
        const avgResponseTime = aiLogs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / aiLogs.length;
        const successRate = aiLogs.filter(log => log.success).length / aiLogs.length;
        
        metrics.push({
          id: 'ai-response-time',
          name: 'AI Response Time',
          value: avgResponseTime,
          trend: this.calculateTrend('ai-response-time', avgResponseTime),
          change: this.calculateChange('ai-response-time', avgResponseTime),
          timestamp: new Date(),
          category: 'performance'
        });

        metrics.push({
          id: 'ai-success-rate',
          name: 'AI Success Rate',
          value: successRate * 100,
          trend: this.calculateTrend('ai-success-rate', successRate * 100),
          change: this.calculateChange('ai-success-rate', successRate * 100),
          timestamp: new Date(),
          category: 'performance'
        });
      }

      // Database Performance
      const { data: dbMetrics } = await supabase.rpc('get_database_performance');
      if (dbMetrics) {
        metrics.push({
          id: 'db-query-time',
          name: 'Database Query Time',
          value: dbMetrics.avg_query_time || 0,
          trend: this.calculateTrend('db-query-time', dbMetrics.avg_query_time || 0),
          change: this.calculateChange('db-query-time', dbMetrics.avg_query_time || 0),
          timestamp: new Date(),
          category: 'performance'
        });
      }

    } catch (error) {
      console.error('Error collecting performance metrics:', error);
    }
    
    return metrics;
  }

  private async collectUsageMetrics(): Promise<AnalyticsMetric[]> {
    const metrics: AnalyticsMetric[] = [];
    
    try {
      // User Activity
      const { data: userActivity } = await supabase
        .from('user_activity_log')
        .select('activity_type, created_at')
        .gte('created_at', new Date(Date.now() - 86400000).toISOString());

      if (userActivity && userActivity.length > 0) {
        const dailyActiveUsers = new Set(userActivity.map(a => a.user_id)).size;
        const totalActivities = userActivity.length;
        
        metrics.push({
          id: 'daily-active-users',
          name: 'Daily Active Users',
          value: dailyActiveUsers,
          trend: this.calculateTrend('daily-active-users', dailyActiveUsers),
          change: this.calculateChange('daily-active-users', dailyActiveUsers),
          timestamp: new Date(),
          category: 'usage'
        });

        metrics.push({
          id: 'user-activities',
          name: 'User Activities',
          value: totalActivities,
          trend: this.calculateTrend('user-activities', totalActivities),
          change: this.calculateChange('user-activities', totalActivities),
          timestamp: new Date(),
          category: 'usage'
        });
      }

    } catch (error) {
      console.error('Error collecting usage metrics:', error);
    }
    
    return metrics;
  }

  private async collectBusinessMetrics(): Promise<AnalyticsMetric[]> {
    const metrics: AnalyticsMetric[] = [];
    
    try {
      // Automation Workflows
      const { data: workflows } = await supabase
        .from('automation_workflows')
        .select('is_active, created_at')
        .eq('is_active', true);

      if (workflows) {
        metrics.push({
          id: 'active-workflows',
          name: 'Active Workflows',
          value: workflows.length,
          trend: this.calculateTrend('active-workflows', workflows.length),
          change: this.calculateChange('active-workflows', workflows.length),
          timestamp: new Date(),
          category: 'business'
        });
      }

      // Marketing Funnels
      const { data: funnels } = await supabase
        .from('marketing_funnels')
        .select('*');

      if (funnels) {
        const totalConversions = funnels.reduce((sum, funnel) => 
          sum + (funnel.metrics?.conversions || 0), 0);
        
        metrics.push({
          id: 'total-conversions',
          name: 'Total Conversions',
          value: totalConversions,
          trend: this.calculateTrend('total-conversions', totalConversions),
          change: this.calculateChange('total-conversions', totalConversions),
          timestamp: new Date(),
          category: 'business'
        });
      }

    } catch (error) {
      console.error('Error collecting business metrics:', error);
    }
    
    return metrics;
  }

  private async collectTechnicalMetrics(): Promise<AnalyticsMetric[]> {
    const metrics: AnalyticsMetric[] = [];
    
    try {
      // System Health
      const { data: healthMetrics } = await supabase
        .from('system_health_metrics')
        .select('metric_name, metric_value')
        .gte('ts', new Date(Date.now() - 3600000).toISOString());

      if (healthMetrics && healthMetrics.length > 0) {
        const cpuUsage = healthMetrics
          .filter(m => m.metric_name === 'cpu_usage')
          .reduce((sum, m) => sum + m.metric_value, 0) / 
          healthMetrics.filter(m => m.metric_name === 'cpu_usage').length;

        const memoryUsage = healthMetrics
          .filter(m => m.metric_name === 'memory_usage')
          .reduce((sum, m) => sum + m.metric_value, 0) / 
          healthMetrics.filter(m => m.metric_name === 'memory_usage').length;

        if (!isNaN(cpuUsage)) {
          metrics.push({
            id: 'cpu-usage',
            name: 'CPU Usage',
            value: cpuUsage,
            trend: this.calculateTrend('cpu-usage', cpuUsage),
            change: this.calculateChange('cpu-usage', cpuUsage),
            timestamp: new Date(),
            category: 'technical'
          });
        }

        if (!isNaN(memoryUsage)) {
          metrics.push({
            id: 'memory-usage',
            name: 'Memory Usage',
            value: memoryUsage,
            trend: this.calculateTrend('memory-usage', memoryUsage),
            change: this.calculateChange('memory-usage', memoryUsage),
            timestamp: new Date(),
            category: 'technical'
          });
        }
      }

    } catch (error) {
      console.error('Error collecting technical metrics:', error);
    }
    
    return metrics;
  }

  private calculateTrend(metricId: string, currentValue: number): 'up' | 'down' | 'stable' {
    const history = this.metrics.get(metricId) || [];
    if (history.length < 2) return 'stable';
    
    const previousValue = history[history.length - 1].value;
    const threshold = Math.abs(previousValue * 0.05); // 5% threshold
    
    if (currentValue > previousValue + threshold) return 'up';
    if (currentValue < previousValue - threshold) return 'down';
    return 'stable';
  }

  private calculateChange(metricId: string, currentValue: number): number {
    const history = this.metrics.get(metricId) || [];
    if (history.length === 0) return 0;
    
    const previousValue = history[history.length - 1].value;
    if (previousValue === 0) return 0;
    
    return ((currentValue - previousValue) / previousValue) * 100;
  }

  private async storeMetrics(metrics: AnalyticsMetric[]) {
    for (const metric of metrics) {
      const history = this.metrics.get(metric.id) || [];
      history.push(metric);
      
      // Keep only last 100 data points
      if (history.length > 100) {
        history.shift();
      }
      
      this.metrics.set(metric.id, history);
      
      // Store in database
      try {
        await supabase
          .from('analytics_metrics')
          .insert({
            metric_id: metric.id,
            name: metric.name,
            value: metric.value,
            trend: metric.trend,
            change_percent: metric.change,
            category: metric.category,
            timestamp: metric.timestamp.toISOString()
          });
      } catch (error) {
        console.error('Error storing metric:', error);
      }
    }
  }

  private async generateInsights() {
    try {
      const allMetrics = Array.from(this.metrics.values()).flat();
      
      if (allMetrics.length === 0) return;
      
      // Use AI to generate insights
      const prompt = `
        Analyze the following system metrics and generate actionable insights:
        
        ${allMetrics.map(m => `${m.name}: ${m.value} (${m.trend}, ${m.change.toFixed(2)}% change)`).join('\n')}
        
        Please provide:
        1. Key insights about system performance
        2. Potential issues or opportunities
        3. Specific action items
        4. Priority levels for each insight
        
        Focus on actionable recommendations for system optimization.
      `;

      let fullResponse = '';
      for await (const chunk of aiRouter.routeRequest({
        prompt,
        type: 'analysis',
        quality: 'premium'
      })) {
        fullResponse += chunk;
      }

      // Parse AI response and create insights
      const insights = this.parseInsightsFromAI(fullResponse);
      this.insights = insights;
      
      // Store insights in database
      for (const insight of insights) {
        await supabase
          .from('analytics_insights')
          .insert({
            title: insight.title,
            description: insight.description,
            impact: insight.impact,
            action_items: insight.actionItems,
            confidence: insight.confidence,
            category: insight.category,
            created_at: new Date().toISOString()
          });
      }
      
    } catch (error) {
      console.error('Error generating insights:', error);
    }
  }

  private parseInsightsFromAI(response: string): AnalyticsInsight[] {
    // Simple parsing logic - in production, this would be more sophisticated
    const insights: AnalyticsInsight[] = [];
    
    // Extract insights from AI response
    const lines = response.split('\n').filter(line => line.trim());
    let currentInsight: Partial<AnalyticsInsight> = {};
    
    for (const line of lines) {
      if (line.includes('Insight:') || line.includes('Issue:') || line.includes('Opportunity:')) {
        if (currentInsight.title) {
          insights.push(this.completeInsight(currentInsight));
        }
        currentInsight = {
          id: Date.now().toString() + Math.random(),
          title: line.replace(/^.*?:/, '').trim(),
          actionItems: []
        };
      } else if (line.includes('Action:') || line.includes('Recommendation:')) {
        if (currentInsight.actionItems) {
          currentInsight.actionItems.push(line.replace(/^.*?:/, '').trim());
        }
      } else if (line.includes('Impact:')) {
        const impact = line.toLowerCase();
        currentInsight.impact = impact.includes('high') ? 'high' : 
                               impact.includes('medium') ? 'medium' : 'low';
      }
    }
    
    if (currentInsight.title) {
      insights.push(this.completeInsight(currentInsight));
    }
    
    return insights;
  }

  private completeInsight(partial: Partial<AnalyticsInsight>): AnalyticsInsight {
    return {
      id: partial.id || Date.now().toString(),
      title: partial.title || 'System Insight',
      description: partial.description || 'AI-generated system insight',
      impact: partial.impact || 'medium',
      actionItems: partial.actionItems || [],
      confidence: partial.confidence || 0.8,
      category: partial.category || 'general'
    };
  }

  // Public API
  async getMetrics(category?: string): Promise<AnalyticsMetric[]> {
    const allMetrics = Array.from(this.metrics.values()).flat();
    return category 
      ? allMetrics.filter(m => m.category === category)
      : allMetrics;
  }

  async getInsights(): Promise<AnalyticsInsight[]> {
    return this.insights;
  }

  async getPredictiveAnalysis(metricId: string): Promise<PredictiveAnalysis | null> {
    const history = this.metrics.get(metricId);
    if (!history || history.length < 10) return null;
    
    // Simple linear regression for prediction
    const values = history.slice(-10).map(m => m.value);
    const trend = this.calculateLinearTrend(values);
    
    return {
      metric: metricId,
      prediction: values[values.length - 1] + trend,
      confidence: 0.75,
      timeframe: '1 hour',
      factors: ['Historical trend', 'Current performance']
    };
  }

  private calculateLinearTrend(values: number[]): number {
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }
}

export const advancedAnalytics = AdvancedAnalytics.getInstance();