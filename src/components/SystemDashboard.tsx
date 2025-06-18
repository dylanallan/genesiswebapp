import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, 
  Cpu, 
  Database, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Settings,
  Play,
  Pause
} from 'lucide-react';
import { systemOptimizer } from '../lib/system-optimizer';
import { toast } from 'sonner';

interface SystemComponent {
  id: string;
  name: string;
  status: 'optimal' | 'needs_optimization' | 'critical';
  performance: number;
  lastOptimized: Date;
  dependencies: string[];
}

export const SystemDashboard: React.FC = () => {
  const [components, setComponents] = useState<SystemComponent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [autoOptimization, setAutoOptimization] = useState(true);

  useEffect(() => {
    loadSystemStatus();
    const interval = setInterval(loadSystemStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSystemStatus = async () => {
    try {
      const status = await systemOptimizer.getSystemStatus();
      setComponents(status);
    } catch (error) {
      console.error('Failed to load system status:', error);
      toast.error('Failed to load system status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceOptimization = async (componentId: string) => {
    try {
      await systemOptimizer.forceOptimization(componentId);
      toast.success('Optimization queued');
      await loadSystemStatus();
    } catch (error) {
      console.error('Failed to queue optimization:', error);
      toast.error('Failed to queue optimization');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimal':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'needs_optimization':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'needs_optimization':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComponentIcon = (componentId: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'ai-router': <Cpu className="w-6 h-6" />,
      'database-layer': <Database className="w-6 h-6" />,
      'authentication': <Settings className="w-6 h-6" />,
      'ui-components': <BarChart3 className="w-6 h-6" />,
      'automation-engine': <Zap className="w-6 h-6" />,
      'analytics-system': <TrendingUp className="w-6 h-6" />,
      'cultural-features': <Activity className="w-6 h-6" />,
      'business-automation': <RefreshCw className="w-6 h-6" />,
      'edge-functions': <Cpu className="w-6 h-6" />,
      'performance-optimization': <TrendingUp className="w-6 h-6" />
    };
    return iconMap[componentId] || <Activity className="w-6 h-6" />;
  };

  const overallHealth = components.length > 0 
    ? components.reduce((sum, comp) => sum + comp.performance, 0) / components.length 
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall System Health */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">System Health Overview</h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Auto-Optimization</span>
              <button
                onClick={() => setAutoOptimization(!autoOptimization)}
                className={`p-1 rounded ${autoOptimization ? 'text-green-500' : 'text-gray-400'}`}
              >
                {autoOptimization ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={loadSystemStatus}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {Math.round(overallHealth * 100)}%
            </div>
            <div className="text-sm text-gray-600">Overall Health</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {components.filter(c => c.status === 'optimal').length}
            </div>
            <div className="text-sm text-gray-600">Optimal</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {components.filter(c => c.status === 'needs_optimization').length}
            </div>
            <div className="text-sm text-gray-600">Need Optimization</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {components.filter(c => c.status === 'critical').length}
            </div>
            <div className="text-sm text-gray-600">Critical</div>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${overallHealth * 100}%` }}
          />
        </div>
      </div>

      {/* Component Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {components.map((component, index) => (
          <motion.div
            key={component.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white rounded-xl shadow-sm border-2 p-6 cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedComponent === component.id ? 'border-blue-500' : 'border-gray-200'
            }`}
            onClick={() => setSelectedComponent(
              selectedComponent === component.id ? null : component.id
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getComponentIcon(component.id)}
                <div>
                  <h3 className="font-semibold text-gray-900">{component.name}</h3>
                  <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(component.status)}`}>
                    {getStatusIcon(component.status)}
                    <span className="capitalize">{component.status.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Performance</span>
                <span className="text-sm font-medium">{Math.round(component.performance * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    component.performance >= 0.9 ? 'bg-green-500' :
                    component.performance >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${component.performance * 100}%` }}
                />
              </div>

              <div className="text-xs text-gray-500">
                Last optimized: {component.lastOptimized.toLocaleDateString()}
              </div>

              {selectedComponent === component.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-4 border-t border-gray-200"
                >
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Dependencies:</span>
                      <div className="text-gray-600">
                        {component.dependencies.length > 0 
                          ? component.dependencies.join(', ') 
                          : 'None'
                        }
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleForceOptimization(component.id);
                      }}
                      className="w-full mt-3 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    >
                      Force Optimization
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Real-time Optimization Log */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Activity</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">{new Date().toLocaleTimeString()}</span>
            <span>AI Router optimization completed</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">{new Date(Date.now() - 60000).toLocaleTimeString()}</span>
            <span>Database layer performance improved</span>
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600">{new Date(Date.now() - 120000).toLocaleTimeString()}</span>
            <span>Analytics system optimization queued</span>
          </div>
        </div>
      </div>
    </div>
  );
};