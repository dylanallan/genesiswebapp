import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BarChart3, 
  PieChart, 
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  RefreshCw
} from 'lucide-react';
import { advancedAnalytics } from '../lib/advanced-analytics';

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

export const AdvancedAnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [selectedCategory]);

  const loadAnalytics = async () => {
    try {
      const metricsData = selectedCategory === 'all' 
        ? await advancedAnalytics.getMetrics()
        : await advancedAnalytics.getMetrics(selectedCategory);
      
      const insightsData = await advancedAnalytics.getInsights();
      
      setMetrics(metricsData);
      setInsights(insightsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const categories = [
    { id: 'all', name: 'All Metrics', icon: BarChart3 },
    { id: 'performance', name: 'Performance', icon: Zap },
    { id: 'usage', name: 'Usage', icon: Activity },
    { id: 'business', name: 'Business', icon: TrendingUp },
    { id: 'technical', name: 'Technical', icon: PieChart }
  ];

  const filteredMetrics = selectedCategory === 'all' 
    ? metrics 
    : metrics.filter(m => m.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Advanced Analytics</h2>
          <button
            onClick={loadAnalytics}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex space-x-2 overflow-x-auto">
          {categories.map(category => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredMetrics.map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">{metric.name}</h3>
              {getTrendIcon(metric.trend)}
            </div>
            
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-gray-900">
                {typeof metric.value === 'number' ? metric.value.toFixed(1) : metric.value}
              </span>
              <span className={`text-sm font-medium ${
                metric.change > 0 ? 'text-green-600' : 
                metric.change < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
              </span>
            </div>
            
            <div className="mt-2 text-xs text-gray-500">
              Updated: {metric.timestamp.toLocaleTimeString()}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Insights Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI-Generated Insights</h3>
        
        {insights.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No insights available yet. Analytics are being processed...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{insight.title}</h4>
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getImpactColor(insight.impact)}`}>
                    {insight.impact === 'high' && <AlertCircle className="w-3 h-3 mr-1" />}
                    {insight.impact === 'medium' && <Clock className="w-3 h-3 mr-1" />}
                    {insight.impact === 'low' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {insight.impact.toUpperCase()} IMPACT
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{insight.description}</p>
                
                {insight.actionItems.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-2">Action Items:</h5>
                    <ul className="space-y-1">
                      {insight.actionItems.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-sm text-gray-600 flex items-start">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>Confidence: {Math.round(insight.confidence * 100)}%</span>
                  <span>Category: {insight.category}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Real-time Activity Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Activity</h3>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-gray-600">{new Date().toLocaleTimeString()}</span>
            <span>AI Router performance optimized</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <span className="text-gray-600">{new Date(Date.now() - 30000).toLocaleTimeString()}</span>
            <span>New analytics insight generated</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
            <span className="text-gray-600">{new Date(Date.now() - 60000).toLocaleTimeString()}</span>
            <span>Database performance metrics updated</span>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            <span className="text-gray-600">{new Date(Date.now() - 90000).toLocaleTimeString()}</span>
            <span>User activity spike detected</span>
          </div>
        </div>
      </div>
    </div>
  );
};