import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Zap, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { getAIUsageMetrics, getAIUsageQuota } from '../lib/ai-analytics';

export const AIUsageStats: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [quota, setQuota] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState(24); // hours

  useEffect(() => {
    loadData();
  }, [timeframe]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [metricsData, quotaData] = await Promise.all([
        getAIUsageMetrics(timeframe),
        getAIUsageQuota()
      ]);
      
      setMetrics(metricsData);
      setQuota(quotaData);
    } catch (error) {
      console.error('Error loading AI usage stats:', error);
      toast.error('Failed to load AI usage statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };

  const getUsagePercentage = () => {
    if (!quota) return 0;
    return (quota.used / quota.limit) * 100;
  };

  const getUsageColor = () => {
    const percentage = getUsagePercentage();
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">AI Usage Statistics</h2>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(parseInt(e.target.value))}
            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
          >
            <option value="24">Last 24 hours</option>
            <option value="72">Last 3 days</option>
            <option value="168">Last 7 days</option>
            <option value="720">Last 30 days</option>
          </select>
          <button
            onClick={loadData}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            disabled={isLoading}
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Quota Usage */}
          {quota && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="font-medium text-blue-900 mb-2 flex items-center space-x-2">
                <Zap className="w-5 h-5 text-blue-500" />
                <span>Monthly Quota ({quota.plan.toUpperCase()} Plan)</span>
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-blue-700">
                    {formatNumber(quota.used)} / {formatNumber(quota.limit)} tokens used
                  </span>
                  <span className="text-blue-700">
                    {getUsagePercentage().toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getUsageColor()} transition-all duration-500`}
                    style={{ width: `${getUsagePercentage()}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs text-blue-600">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Resets on {new Date(quota.resetDate).toLocaleDateString()}</span>
                  </div>
                  <span>{formatNumber(quota.remaining)} tokens remaining</span>
                </div>
              </div>
            </div>
          )}

          {/* Usage Metrics */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Total Requests</h3>
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.totalRequests)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  In the last {timeframe} hours
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Success Rate</h3>
                  {metrics.successRate > 0.95 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
                <p className="text-2xl font-bold text-gray-900">{(metrics.successRate * 100).toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {metrics.errorRate > 0 ? `${(metrics.errorRate * 100).toFixed(1)}% error rate` : 'No errors detected'}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Response Time</h3>
                  <Clock className="w-5 h-5 text-purple-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{metrics.averageResponseTime.toFixed(0)}ms</p>
                <p className="text-xs text-gray-500 mt-1">
                  Average response time
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Estimated Cost</h3>
                  <Zap className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCost(metrics.estimatedCost || 0)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatNumber(metrics.tokensUsed || 0)} tokens used
                </p>
              </motion.div>
            </div>
          )}

          {/* Model Usage */}
          {metrics && metrics.modelUsage && Object.keys(metrics.modelUsage).length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4">Model Usage</h3>
              <div className="space-y-4">
                {Object.entries(metrics.modelUsage).map(([model, count]: [string, any]) => (
                  <div key={model} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-gray-700">{model}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-48 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500"
                          style={{ width: `${(count / metrics.totalRequests) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-500 w-16 text-right">
                        {count} ({((count / metrics.totalRequests) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};