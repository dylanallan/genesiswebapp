import { supabase } from './supabase';
import nlp from 'compromise';
import natural from 'natural';
import { toast } from 'sonner';

interface InsightResult {
  category: 'cultural' | 'business' | 'personal' | 'historical';
  confidence: number;
  insights: string[];
  recommendations: string[];
  patterns: Pattern[];
}

interface Pattern {
  type: string;
  frequency: number;
  significance: number;
  examples: string[];
}

export async function analyzeUserData(): Promise<InsightResult[]> {
  try {
    // Fetch user's cultural data
    const { data: culturalData, error: culturalError } = await supabase
      .from('cultural_artifacts')
      .select('*');

    if (culturalError) throw culturalError;

    // Fetch user's business data
    const { data: businessData, error: businessError } = await supabase
      .from('business_records')
      .select('*');

    if (businessError) throw businessError;

    // Initialize NLP tools
    const classifier = new natural.BayesClassifier();
    const tfidf = new natural.TfIdf();

    // Train classifier with known patterns
    culturalData?.forEach(item => {
      classifier.addDocument(item.description, item.category);
      tfidf.addDocument(item.description);
    });
    classifier.train();

    // Analyze patterns and generate insights
    const insights: InsightResult[] = [];

    // Cultural insights
    const culturalInsights = analyzeCulturalPatterns(culturalData, tfidf);
    insights.push(culturalInsights);

    // Business insights
    const businessInsights = analyzeBusinessPatterns(businessData, classifier);
    insights.push(businessInsights);

    // Historical insights
    const historicalInsights = analyzeHistoricalConnections(culturalData, businessData);
    insights.push(historicalInsights);

    return insights;
  } catch (error) {
    console.error('Error analyzing user data:', error);
    toast.error('Error generating insights');
    throw error;
  }
}

function analyzeCulturalPatterns(data: any[], tfidf: natural.TfIdf): InsightResult {
  const patterns: Pattern[] = [];
  const insights: string[] = [];
  const recommendations: string[] = [];

  // Analyze text for cultural patterns
  data?.forEach(item => {
    const doc = nlp(item.description);
    const terms = tfidf.listTerms(0);
    
    // Find significant cultural terms
    const culturalTerms = terms
      .filter(term => term.tfidf > 2)
      .map(term => term.term);

    if (culturalTerms.length > 0) {
      patterns.push({
        type: 'cultural_terminology',
        frequency: culturalTerms.length,
        significance: calculateSignificance(culturalTerms),
        examples: culturalTerms
      });
    }

    // Analyze traditions and customs
    const traditions = doc.match('#Verb (ceremony|ritual|celebration)').out('array');
    if (traditions.length > 0) {
      patterns.push({
        type: 'traditional_practices',
        frequency: traditions.length,
        significance: 0.8,
        examples: traditions
      });
    }
  });

  // Generate insights based on patterns
  if (patterns.length > 0) {
    insights.push('Strong cultural preservation practices detected');
    insights.push('Multiple traditional ceremonies documented');
    recommendations.push('Consider documenting oral histories');
    recommendations.push('Create digital archives of cultural artifacts');
  }

  return {
    category: 'cultural',
    confidence: calculateConfidence(patterns),
    insights,
    recommendations,
    patterns
  };
}

function analyzeBusinessPatterns(data: any[], classifier: natural.BayesClassifier): InsightResult {
  const patterns: Pattern[] = [];
  const insights: string[] = [];
  const recommendations: string[] = [];

  data?.forEach(record => {
    const classification = classifier.classify(record.description);
    const doc = nlp(record.description);

    // Analyze business practices
    const practices = doc.match('(implement|use|apply) #Adjective #Noun').out('array');
    if (practices.length > 0) {
      patterns.push({
        type: 'business_practices',
        frequency: practices.length,
        significance: 0.9,
        examples: practices
      });
    }

    // Identify innovation opportunities
    const innovations = doc.match('(new|innovative|modern) #Noun').out('array');
    if (innovations.length > 0) {
      patterns.push({
        type: 'innovation_opportunities',
        frequency: innovations.length,
        significance: 0.85,
        examples: innovations
      });
    }
  });

  // Generate insights and recommendations
  if (patterns.length > 0) {
    insights.push('Traditional business practices identified');
    insights.push('Potential innovation areas discovered');
    recommendations.push('Integrate traditional practices with modern technology');
    recommendations.push('Develop cultural business innovation strategy');
  }

  return {
    category: 'business',
    confidence: calculateConfidence(patterns),
    insights,
    recommendations,
    patterns
  };
}

function analyzeHistoricalConnections(culturalData: any[], businessData: any[]): InsightResult {
  const patterns: Pattern[] = [];
  const insights: string[] = [];
  const recommendations: string[] = [];

  // Combine cultural and business data for historical analysis
  const allData = [...(culturalData || []), ...(businessData || [])];
  const timelineEvents = new Map<string, string[]>();

  allData.forEach(item => {
    const doc = nlp(item.description);
    const dates = doc.dates().out('array');
    
    dates.forEach(date => {
      const events = timelineEvents.get(date) || [];
      events.push(item.description);
      timelineEvents.set(date, events);
    });
  });

  // Analyze historical patterns
  if (timelineEvents.size > 0) {
    patterns.push({
      type: 'historical_timeline',
      frequency: timelineEvents.size,
      significance: 0.95,
      examples: Array.from(timelineEvents.keys())
    });

    insights.push('Historical timeline established');
    insights.push('Cultural-business connections identified');
    recommendations.push('Create interactive historical timeline');
    recommendations.push('Document historical business evolution');
  }

  return {
    category: 'historical',
    confidence: calculateConfidence(patterns),
    insights,
    recommendations,
    patterns
  };
}

function calculateSignificance(terms: string[]): number {
  // Implement significance calculation logic
  return Math.min(terms.length / 10, 1);
}

function calculateConfidence(patterns: Pattern[]): number {
  if (patterns.length === 0) return 0;
  
  const totalSignificance = patterns.reduce((sum, pattern) => sum + pattern.significance, 0);
  return totalSignificance / patterns.length;
}