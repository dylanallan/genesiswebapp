import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw, 
  Zap,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { errorRecovery } from '../lib/error-recovery';
import { performanceMonitor } from '../lib/performance-monitor';
import { circuitBreakerManager } from '../lib/circuit-breaker';
import { toast } from 'sonner';

interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical';
  components: {
    [key: string]: {
      status: 'healthy' | 'warning' | 'critical';
      message: string;
      lastCheck: Date;
    };
  };
  performance: {
    memoryUsage: number;
    renderTime: number;
    errorRate: number;
  };
}

export const SystemHealthMonitor: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    overall: 'healthy',
    components: {},
    performance: {
      memoryUsage: 0,
      renderTime: 0,
      errorRate: 0
    }
  });
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    if (isMonitoring) {
      const interval = setInterval(checkSystemHealth, 5000);
      return () => clearInterval(interval);
    }
  }, [isMonitoring]);

  const checkSystemHealth = async () => {
    try {
      const performance = performanceMonitor.getMetrics();
      const errors = errorRecovery.getErrorQueue();
      const breakers = circuitBreakerManager.getAllBreakers();

      const components: SystemStatus['components'] = {};

      // Check AI Router
      const aiBreaker = breakers.get('ai-router');
      components['ai-router'] = {
        status: aiBreaker?.getState() === 'OPEN' ? 'critical' : 'healthy',
        message: aiBreaker?.getState() === 'OPEN' ? 'Circuit breaker open' : 'Operating normally',
        lastCheck: new Date()
      };

      // Check Memory Usage
      components['memory'] = {
        status: performance.memoryUsage > 80 ? 'critical' : performance.memoryUsage > 60 ? 'warning' : 'healthy',
        message: `${performance.memoryUsage.toFixed(1)}% used`,
        lastCheck: new Date()
      };

      // Check Render Performance
      components['rendering'] = {
        status: performance.renderTime > 100 ? 'critical' : performance.renderTime > 50 ? 'warning' : 'healthy',
        message: `${performance.renderTime.toFixed(1)}ms average`,
        lastCheck: new Date()
      };

      // Check Error Rate
      const recentErrors = errors.filter(e => 
        Date.now() - e.timestamp.getTime() < 60000 // Last minute
      );
      components['errors'] = {
        status: recentErrors.length > 5 ? 'critical' : recentErrors.length > 2 ? 'warning' : 'healthy',
        message: `${recentErrors.length} errors in last minute`,
        lastCheck: new Date()
      };

      // Determine overall status
      const statuses = Object.values(components).map(c => c.status);
      const overall = statuses.includes('critical') ? 'critical' : 
                    statuses.includes('warning') ? 'warning' : 'healthy';

      setSystemStatus({
        overall,
        components,
        performance: {
          memoryUsage: performance.memoryUsage,
          renderTime: performance.renderTime,
          errorRate: (recentErrors.length / 60) * 100 // Errors per minute as percentage
        }
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const handleForceRecovery = async () => {
    try {
      await errorRecovery.forceRecovery('generic');
      circuitBreakerManager.resetAll();
      toast.success('System recovery initiated');
      await checkSystemHealth();
    } catch (error) {
      toast.error('Recovery failed');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (value: number, threshold: number) => {
    if (value > threshold * 1.2) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (value > threshold) return <TrendingUp className="w-4 h-4 text-yellow-500" />;
    if (value < threshold * 0.5) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">System Health Monitor</h2>
          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(systemStatus.overall)}`}>
            {getStatusIcon(systemStatus.overall)}
            <span className="capitalize">{systemStatus.overall}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`p-2 rounded-lg transition-colors ${
              isMonitoring 
                ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Activity className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleForceRecovery}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Zap className="w-4 h-4" />
            <span>Force Recovery</span>
          </button>
          
          <button
            onClick={checkSystemHealth}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Memory Usage</span>
            {getTrendIcon(systemStatus.performance.memoryUsage, 60)}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {systemStatus.performance.memoryUsage.toFixed(1)}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                systemStatus.performance.memoryUsage > 80 ? 'bg-red-500' :
                systemStatus.performance.memoryUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(systemStatus.performance.memoryUsage, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Render Time</span>
            {getTrendIcon(systemStatus.performance.renderTime, 50)}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {systemStatus.performance.renderTime.toFixed(1)}ms
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                systemStatus.performance.renderTime > 100 ? 'bg-red-500' :
                systemStatus.performance.renderTime > 50 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(systemStatus.performance.renderTime / 2, 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Error Rate</span>
            {getTrendIcon(systemStatus.performance.errorRate, 5)}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {systemStatus.performance.errorRate.toFixed(1)}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                systemStatus.performance.errorRate > 10 ? 'bg-red-500' :
                systemStatus.performance.errorRate > 5 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(systemStatus.performance.errorRate * 10, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Component Status */}
      <div className="space-y-3">
        <h3 className="font-medium text-gray-900">Component Status</h3>
        {Object.entries(systemStatus.components).map(([name, component]) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              {getStatusIcon(component.status)}
              <div>
                <span className="font-medium text-gray-900 capitalize">
                  {name.replace('-', ' ')}
                </span>
                <p className="text-sm text-gray-600">{component.message}</p>
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {component.lastCheck.toLocaleTimeString()}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Last updated: {lastUpdate.toLocaleTimeString()}
        {isMonitoring && <span className="ml-2">• Auto-refresh enabled</span>}
      </div>
    </div>
  );
};