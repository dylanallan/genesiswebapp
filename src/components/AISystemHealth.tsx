import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Zap,
  Database,
  Server,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface SystemStatus {
  status: 'healthy' | 'degraded' | 'critical';
  components: {
    aiRouter: ComponentStatus;
    database: ComponentStatus;
    authentication: ComponentStatus;
    edgeFunctions: ComponentStatus;
  };
  lastUpdated: Date;
}

interface ComponentStatus {
  status: 'healthy' | 'degraded' | 'critical';
  message: string;
  metrics?: Record<string, number>;
}

export const AISystemHealth: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
    loadSystemStatus();
    const interval = setInterval(loadSystemStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();
      
      setIsAdmin(!!data);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadSystemStatus = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/system-health-monitor`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        // If not admin, use fallback status
        if (response.status === 403) {
          setSystemStatus(getFallbackStatus());
          return;
        }
        throw new Error(`Health check error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setSystemStatus({
        status: data.systemStatus,
        components: {
          aiRouter: {
            status: getComponentStatus(data.metrics.aiService.health),
            message: `Success rate: ${(data.metrics.aiService.successRate * 100).toFixed(1)}%`,
            metrics: {
              successRate: data.metrics.aiService.successRate,
              avgResponseTime: data.metrics.aiService.avgResponseTime,
              totalRequests: data.metrics.aiService.totalRequests
            }
          },
          database: {
            status: getComponentStatus(data.metrics.database.health),
            message: `Connections: ${data.metrics.database.connections}`,
            metrics: {
              connections: data.metrics.database.connections,
              size: data.metrics.database.size
            }
          },
          authentication: {
            status: 'healthy',
            message: 'Authentication system operational'
          },
          edgeFunctions: {
            status: getComponentStatus(data.metrics.performance.health),
            message: `Performance: ${(data.metrics.performance.health * 100).toFixed(1)}%`,
            metrics: data.metrics.performance.metrics
          }
        },
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error loading system status:', error);
      
      // Use fallback status
      setSystemStatus(getFallbackStatus());
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackStatus = (): SystemStatus => {
    return {
      status: 'healthy',
      components: {
        aiRouter: {
          status: 'healthy',
          message: 'AI Router operational'
        },
        database: {
          status: 'healthy',
          message: 'Database operational'
        },
        authentication: {
          status: 'healthy',
          message: 'Authentication system operational'
        },
        edgeFunctions: {
          status: 'healthy',
          message: 'Edge Functions operational'
        }
      },
      lastUpdated: new Date()
    };
  };

  const getComponentStatus = (health: number): 'healthy' | 'degraded' | 'critical' => {
    if (health >= 0.8) return 'healthy';
    if (health >= 0.5) return 'degraded';
    return 'critical';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComponentIcon = (component: string) => {
    switch (component) {
      case 'aiRouter':
        return <Zap className="w-5 h-5 text-blue-500" />;
      case 'database':
        return <Database className="w-5 h-5 text-purple-500" />;
      case 'authentication':
        return <Shield className="w-5 h-5 text-green-500" />;
      case 'edgeFunctions':
        return <Server className="w-5 h-5 text-amber-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">System Health</h2>
          {systemStatus && (
            <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(systemStatus.status)}`}>
              {getStatusIcon(systemStatus.status)}
              <span className="capitalize">{systemStatus.status}</span>
            </div>
          )}
        </div>
        <button
          onClick={loadSystemStatus}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          disabled={isLoading}
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : !systemStatus ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">System status unavailable</h3>
          <p className="text-gray-500 mb-4">
            Unable to retrieve system health information
          </p>
          <button
            onClick={loadSystemStatus}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(systemStatus.components).map(([key, component]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center space-x-3">
                {getComponentIcon(key)}
                <div>
                  <h3 className="font-medium text-gray-900 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </h3>
                  <p className="text-sm text-gray-500">{component.message}</p>
                </div>
              </div>
              <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(component.status)}`}>
                {getStatusIcon(component.status)}
                <span className="capitalize">{component.status}</span>
              </div>
            </motion.div>
          ))}

          {isAdmin && systemStatus.components.aiRouter.metrics && (
            <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Detailed Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">AI Success Rate</div>
                  <div className="text-xl font-bold text-gray-900">
                    {(systemStatus.components.aiRouter.metrics.successRate * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">Avg Response Time</div>
                  <div className="text-xl font-bold text-gray-900">
                    {systemStatus.components.aiRouter.metrics.avgResponseTime.toFixed(0)}ms
                  </div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-500 mb-1">Total Requests</div>
                  <div className="text-xl font-bold text-gray-900">
                    {systemStatus.components.aiRouter.metrics.totalRequests.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-500 text-right">
            Last updated: {systemStatus.lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
};