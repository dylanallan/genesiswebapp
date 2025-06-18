import { supabase } from './supabase';
import { toast } from 'sonner';

interface AIUsageMetrics {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  modelUsage: Record<string, number>;
  errorRate: number;
  timeframeHours: number;
  tokensUsed: number;
  estimatedCost: number;
}

interface AIModelPerformance {
  modelId: string;
  modelName: string;
  accuracy: number;
  reliability: number;
  averageResponseTime: number;
  costEfficiency: number;
  usageCount: number;
}

interface AIFeedbackSummary {
  averageRating: number;
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
  totalFeedback: number;
  topCategories: {category: string, count: number}[];
}

/**
 * Get AI usage metrics for the current user
 * @param timeframeHours Number of hours to look back
 * @returns AI usage metrics
 */
export async function getAIUsageMetrics(timeframeHours: number = 24): Promise<AIUsageMetrics> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/ai-metrics?hours=${timeframeHours}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`AI metrics error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting AI usage metrics:', error);
    
    // Return default metrics
    return {
      totalRequests: 0,
      successRate: 1,
      averageResponseTime: 0,
      modelUsage: {},
      errorRate: 0,
      timeframeHours,
      tokensUsed: 0,
      estimatedCost: 0
    };
  }
}

/**
 * Get AI model performance metrics
 * @returns Array of AI model performance metrics
 */
export async function getAIModelPerformance(): Promise<AIModelPerformance[]> {
  try {
    const { data, error } = await supabase
      .from('model_performance_summary')
      .select('*');
    
    if (error) throw error;
    
    return data.map(item => ({
      modelId: item.model_id,
      modelName: item.model_name,
      accuracy: item.avg_value,
      reliability: item.reliability || 0.9,
      averageResponseTime: item.avg_response_time || 1000,
      costEfficiency: item.cost_efficiency || 0.8,
      usageCount: item.sample_count
    }));
  } catch (error) {
    console.error('Error getting AI model performance:', error);
    return [];
  }
}

/**
 * Get AI feedback summary
 * @returns AI feedback summary
 */
export async function getAIFeedbackSummary(): Promise<AIFeedbackSummary> {
  try {
    const { data, error } = await supabase
      .from('ai_feedback')
      .select('rating, categories')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return {
        averageRating: 0,
        positivePercentage: 0,
        negativePercentage: 0,
        neutralPercentage: 0,
        totalFeedback: 0,
        topCategories: []
      };
    }
    
    // Calculate average rating
    const totalRating = data.reduce((sum, item) => sum + item.rating, 0);
    const averageRating = totalRating / data.length;
    
    // Calculate percentages
    const positive = data.filter(item => item.rating >= 4).length;
    const negative = data.filter(item => item.rating <= 2).length;
    const neutral = data.length - positive - negative;
    
    const positivePercentage = (positive / data.length) * 100;
    const negativePercentage = (negative / data.length) * 100;
    const neutralPercentage = (neutral / data.length) * 100;
    
    // Get top categories
    const categoryCount: Record<string, number> = {};
    data.forEach(item => {
      if (item.categories) {
        item.categories.forEach((category: string) => {
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
      }
    });
    
    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      averageRating,
      positivePercentage,
      negativePercentage,
      neutralPercentage,
      totalFeedback: data.length,
      topCategories
    };
  } catch (error) {
    console.error('Error getting AI feedback summary:', error);
    return {
      averageRating: 0,
      positivePercentage: 0,
      negativePercentage: 0,
      neutralPercentage: 0,
      totalFeedback: 0,
      topCategories: []
    };
  }
}

/**
 * Track AI usage for quota management
 * @param tokensUsed Number of tokens used
 * @param model AI model used
 * @returns Boolean indicating if the usage was successfully tracked
 */
export async function trackAIUsage(tokensUsed: number, model: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('track_ai_usage', {
      p_user_id: (await supabase.auth.getUser()).data.user?.id,
      p_tokens_used: tokensUsed,
      p_model: model
    });
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Error tracking AI usage:', error);
    return false;
  }
}

/**
 * Get user's current AI usage quota
 * @returns Object containing quota information
 */
export async function getAIUsageQuota(): Promise<{
  plan: string;
  limit: number;
  used: number;
  remaining: number;
  resetDate: Date;
}> {
  try {
    const { data, error } = await supabase
      .from('ai_usage_quotas')
      .select('*')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single();
    
    if (error) {
      // If no quota exists, return default values
      if (error.code === 'PGRST116') {
        return {
          plan: 'free',
          limit: 100000,
          used: 0,
          remaining: 100000,
          resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        };
      }
      throw error;
    }
    
    return {
      plan: data.plan_type,
      limit: data.monthly_token_limit,
      used: data.tokens_used,
      remaining: data.monthly_token_limit - data.tokens_used,
      resetDate: new Date(data.reset_date)
    };
  } catch (error) {
    console.error('Error getting AI usage quota:', error);
    
    // Return default values
    return {
      plan: 'free',
      limit: 100000,
      used: 0,
      remaining: 100000,
      resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    };
  }
}

/**
 * Analyze a conversation for insights
 * @param sessionId Conversation session ID
 * @returns Boolean indicating if the analysis was successful
 */
export async function analyzeConversation(sessionId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('analyze_conversation', {
      p_session_id: sessionId,
      p_user_id: (await supabase.auth.getUser()).data.user?.id
    });
    
    if (error) throw error;
    
    return !!data;
  } catch (error) {
    console.error('Error analyzing conversation:', error);
    return false;
  }
}