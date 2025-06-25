import React, { useState, useEffect } from 'react';
import { GlobalDataHub } from '../lib/global-data-hub.js';
import { AdvancedAnalyticsEngine } from '../lib/advanced-analytics-engine.js';

interface StreamStatus {
  status: string;
  lastUpdate: string;
  priority: string;
  frequency: string;
  dataSize: number;
}

interface IntelligenceMetrics {
  totalRecords: number;
  activeStreams: number;
  processingRate: number;
  lastUpdate: string;
}

interface IntelligenceInsight {
  domain: string;
  insight: string;
  confidence: number;
  timestamp: string;
}

interface IntelligenceRecommendation {
  type: string;
  domains: string[];
  recommendation: string;
  confidence: number;
  priority: string;
}

interface IntelligenceAlert {
  type: string;
  stream: string;
  message: string;
  severity: string;
  timestamp: string;
}

const GlobalIntelligenceDashboard: React.FC = () => {
  const [dataHub, setDataHub] = useState<GlobalDataHub | null>(null);
  const [streamStatus, setStreamStatus] = useState<Record<string, StreamStatus>>({});
  const [metrics, setMetrics] = useState<IntelligenceMetrics | null>(null);
  const [insights, setInsights] = useState<IntelligenceInsight[]>([]);
  const [recommendations, setRecommendations] = useState<IntelligenceRecommendation[]>([]);
  const [alerts, setAlerts] = useState<IntelligenceAlert[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomain, setSelectedDomain] = useState<string>('all');

  useEffect(() => {
    initializeDataHub();
  }, []);

  const initializeDataHub = async () => {
    try {
      const hub = new GlobalDataHub();
      await hub.initializeDataStreams();
      setDataHub(hub);
      
      // Start real-time updates
      startRealTimeUpdates(hub);
    } catch (error) {
      console.error('Error initializing data hub:', error);
    } finally {
      setLoading(false);
    }
  };

  const startRealTimeUpdates = (hub: GlobalDataHub) => {
    const updateInterval = setInterval(async () => {
      try {
        const dashboard = await hub.generateIntelligenceDashboard();
        
        setStreamStatus(dashboard.streams);
        setMetrics(dashboard.metrics);
        setInsights(dashboard.intelligence.insights);
        setRecommendations(dashboard.intelligence.recommendations);
        setAlerts(dashboard.alerts);
        setTrends(dashboard.trends);
      } catch (error) {
        console.error('Error updating dashboard:', error);
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(updateInterval);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'initializing': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 border-red-500';
      case 'medium': return 'bg-yellow-100 border-yellow-500';
      case 'low': return 'bg-green-100 border-green-500';
      default: return 'bg-gray-100 border-gray-500';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Global Intelligence Dashboard
          </h1>
          <p className="text-purple-200">
            Real-time cross-domain analytics and intelligence insights
          </p>
        </div>

        {/* Metrics Overview */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-2">Total Records</h3>
              <p className="text-3xl font-bold text-purple-400">
                {formatNumber(metrics.totalRecords)}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-2">Active Streams</h3>
              <p className="text-3xl font-bold text-green-400">
                {metrics.activeStreams}
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-2">Processing Rate</h3>
              <p className="text-3xl font-bold text-blue-400">
                {(metrics.processingRate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-2">Last Update</h3>
              <p className="text-sm text-purple-200">
                {formatTimestamp(metrics.lastUpdate || '')}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Data Streams Status */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Data Streams</h2>
            <div className="space-y-4">
              {Object.entries(streamStatus).map(([name, status]) => (
                <div key={name} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-white capitalize">{name}</h3>
                    <p className="text-sm text-purple-200">
                      {status.frequency} • {formatTimestamp(status.lastUpdate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${getStatusColor(status.status)}`}>
                      {status.status}
                    </p>
                    <p className={`text-sm ${getPriorityColor(status.priority)}`}>
                      {status.priority} priority
                    </p>
                    <p className="text-xs text-gray-400">
                      {status.dataSize} records
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Intelligence Insights */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Key Insights</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {insights.slice(0, 10).map((insight, index) => (
                <div key={index} className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-purple-400 capitalize">
                      {insight.domain}
                    </span>
                    <span className="text-sm text-green-400">
                      {(insight.confidence * 100).toFixed(1)}% confidence
                    </span>
                  </div>
                  <p className="text-white text-sm">{insight.insight}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatTimestamp(insight.timestamp)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Recommendations</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recommendations.slice(0, 8).map((rec, index) => (
                <div key={index} className="p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-blue-400">
                      {rec.type.replace('_', ' ')}
                    </span>
                    <span className={`text-sm px-2 py-1 rounded ${getPriorityColor(rec.priority)}`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-white text-sm mb-2">{rec.recommendation}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-purple-200">
                      {rec.domains.join(', ')}
                    </span>
                    <span className="text-xs text-green-400">
                      {(rec.confidence * 100).toFixed(1)}% confidence
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">Active Alerts</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {alerts.length > 0 ? (
                alerts.map((alert, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-red-600 capitalize">
                        {alert.type}
                      </span>
                      <span className={`text-sm px-2 py-1 rounded ${getPriorityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-gray-800 text-sm mb-2">{alert.message}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 capitalize">
                        {alert.stream}
                      </span>
                      <span className="text-xs text-gray-600">
                        {formatTimestamp(alert.timestamp)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-green-400">No active alerts</p>
                  <p className="text-sm text-gray-400">All systems operational</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trends Analysis */}
        <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-6">Trend Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trends.slice(0, 6).map((trend, index) => (
              <div key={index} className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-purple-400 capitalize">
                    {trend.domain}
                  </span>
                  <span className={`text-sm ${trend.direction === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                    {trend.direction} ↑
                  </span>
                </div>
                <p className="text-white text-sm mb-2">{trend.trend}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {(trend.strength * 100).toFixed(1)}% strength
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTimestamp(trend.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalIntelligenceDashboard; 