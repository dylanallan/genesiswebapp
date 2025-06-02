import { supabase } from './supabase';
import { toast } from 'sonner';

interface Prediction {
  category: string;
  probability: number;
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
  actionItems: string[];
}

interface TrendAnalysis {
  trend: string;
  strength: number;
  direction: 'increasing' | 'decreasing' | 'stable';
  relatedFactors: string[];
}

export async function generatePredictions(): Promise<Prediction[]> {
  try {
    // Fetch historical data
    const { data: historicalData, error: historicalError } = await supabase
      .from('analytics_events')
      .select('*')
      .order('timestamp', { ascending: false });

    if (historicalError) throw historicalError;

    // Analyze trends
    const trends = analyzeTrends(historicalData);

    // Generate predictions based on trends
    const predictions = trends.map(trend => ({
      category: trend.trend,
      probability: calculateProbability(trend),
      impact: determineImpact(trend),
      timeframe: estimateTimeframe(trend),
      actionItems: generateActionItems(trend)
    }));

    return predictions;
  } catch (error) {
    console.error('Error generating predictions:', error);
    toast.error('Error analyzing trends');
    throw error;
  }
}

function analyzeTrends(data: any[]): TrendAnalysis[] {
  const trends: TrendAnalysis[] = [];

  // Group data by categories
  const categories = new Map<string, any[]>();
  data?.forEach(event => {
    const category = event.category;
    const events = categories.get(category) || [];
    events.push(event);
    categories.set(category, events);
  });

  // Analyze each category
  categories.forEach((events, category) => {
    const strength = calculateTrendStrength(events);
    const direction = determineTrendDirection(events);
    const factors = identifyRelatedFactors(events);

    trends.push({
      trend: category,
      strength,
      direction,
      relatedFactors: factors
    });
  });

  return trends;
}

function calculateTrendStrength(events: any[]): number {
  // Implement trend strength calculation
  const recentEvents = events.slice(0, Math.min(events.length, 10));
  const frequency = recentEvents.length / 10;
  return Math.min(frequency, 1);
}

function determineTrendDirection(events: any[]): 'increasing' | 'decreasing' | 'stable' {
  if (events.length < 2) return 'stable';

  const recentCount = events.slice(0, 5).length;
  const previousCount = events.slice(5, 10).length;

  if (recentCount > previousCount) return 'increasing';
  if (recentCount < previousCount) return 'decreasing';
  return 'stable';
}

function identifyRelatedFactors(events: any[]): string[] {
  const factors = new Set<string>();
  
  events.forEach(event => {
    if (event.metadata?.relatedFactors) {
      event.metadata.relatedFactors.forEach((factor: string) => factors.add(factor));
    }
  });

  return Array.from(factors);
}

function calculateProbability(trend: TrendAnalysis): number {
  return trend.strength * (trend.direction === 'increasing' ? 1.2 : 0.8);
}

function determineImpact(trend: TrendAnalysis): 'high' | 'medium' | 'low' {
  const score = trend.strength * trend.relatedFactors.length;
  if (score > 0.8) return 'high';
  if (score > 0.4) return 'medium';
  return 'low';
}

function estimateTimeframe(trend: TrendAnalysis): string {
  if (trend.strength > 0.8) return 'Short-term (1-3 months)';
  if (trend.strength > 0.5) return 'Medium-term (3-6 months)';
  return 'Long-term (6+ months)';
}

function generateActionItems(trend: TrendAnalysis): string[] {
  const actionItems = [];

  if (trend.direction === 'increasing') {
    actionItems.push(`Capitalize on growing ${trend.trend} trend`);
    actionItems.push(`Invest in ${trend.trend}-related resources`);
  } else if (trend.direction === 'decreasing') {
    actionItems.push(`Evaluate ${trend.trend} strategy`);
    actionItems.push(`Identify alternative approaches`);
  }

  trend.relatedFactors.forEach(factor => {
    actionItems.push(`Analyze impact of ${factor}`);
  });

  return actionItems;
}