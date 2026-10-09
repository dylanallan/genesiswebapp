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
// The signed-in user's own AI usage (row-level security scopes every query to them).
// Response time and cost are not tracked per user, so they are reported as NaN ("—" in the UI).
export async function getAIUsageMetrics(timeframeHours: number = 24): Promise<AIUsageMetrics> {
  const since = new Date(Date.now() - timeframeHours * 3600 * 1000);
  const empty: AIUsageMetrics = { totalRequests: 0, successRate: NaN, averageResponseTime: NaN, modelUsage: {}, errorRate: NaN, timeframeHours, tokensUsed: NaN, estimatedCost: NaN };
  try {
    const [{ data: days }, { data: answers }] = await Promise.all([
      supabase.from('ai_usage_daily').select('count').gte('day', since.toISOString().slice(0, 10)),
      supabase.from('messages').select('metadata').eq('role', 'assistant').gte('created_at', since.toISOString()).limit(5000),
    ]);
    const totalRequests = (days ?? []).reduce((sum: number, d: { count: number }) => sum + (d.count ?? 0), 0);
    const modelUsage: Record<string, number> = {};
    (answers ?? []).forEach((m: { metadata: { provider?: string } | null }) => {
      const provider = m.metadata?.provider ?? 'unknown';
      if (provider !== 'error') modelUsage[provider] = (modelUsage[provider] ?? 0) + 1;
    });
    const answered = Object.values(modelUsage).reduce((a, b) => a + b, 0);
    const successRate = totalRequests > 0 ? Math.min(1, answered / totalRequests) : NaN;
    return { ...empty, totalRequests, modelUsage, successRate, errorRate: Number.isNaN(successRate) ? NaN : 1 - successRate };
  } catch (error) {
    console.error('Error getting AI usage metrics:', error);
    return empty;
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
    
    return data.map((item: any) => ({
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
    const totalRating = data.reduce((sum: number, item: any) => sum + item.rating, 0);
    const averageRating = totalRating / data.length;
    
    // Calculate percentages
    const positive = data.filter((item: any) => item.rating >= 4).length;
    const negative = data.filter((item: any) => item.rating <= 2).length;
    const neutral = data.length - positive - negative;
    
    const positivePercentage = (positive / data.length) * 100;
    const negativePercentage = (negative / data.length) * 100;
    const neutralPercentage = (neutral / data.length) * 100;
    
    // Get top categories
    const categoryCount: Record<string, number> = {};
    data.forEach((item: any) => {
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
// The real limit the AI router enforces: messages per UTC day, by plan.
export async function getAIUsageQuota(): Promise<{ plan: string; limit: number; used: number; remaining: number; resetDate: Date }> {
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: sub }, { data: usage }] = await Promise.all([
    supabase.from('subscriptions').select('status').maybeSingle(),
    supabase.from('ai_usage_daily').select('count').eq('day', today).maybeSingle(),
  ]);
  const paid = sub?.status === 'active' || sub?.status === 'trialing';
  const limit = paid ? Number(import.meta.env.VITE_PAID_DAILY_MESSAGES ?? 500) : Number(import.meta.env.VITE_FREE_DAILY_MESSAGES ?? 10);
  const used = usage?.count ?? 0;
  const reset = new Date();
  reset.setUTCHours(24, 0, 0, 0);
  return { plan: paid ? 'pro' : 'free', limit, used, remaining: Math.max(0, limit - used), resetDate: reset };
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