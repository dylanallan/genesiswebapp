import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  Zap, 
  RefreshCw, 
  Settings,
  Database,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { AISystemHealth } from './AISystemHealth';
import { AIUsageStats } from './AIUsageStats';
import { AIFeedbackAnalytics } from './AIFeedbackAnalytics';
import { AISettings } from './AISettings';

export const AIAdminDashboard: React.FC = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRequests: 0,
    successRate: 0,
    averageResponseTime: 0,
    totalTokens: 0,
    estimatedCost: 0
  });

  useEffect(() => {
    checkAdminStatus();
    loadMetrics();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();
      
      setIsAdmin(!!data);
      
      if (!data) {
        toast.error('Admin access required');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast.error('Failed to verify admin status');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/ai-metrics`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Metrics error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setMetrics({
        totalUsers: data.systemMetrics.totalUsers,
        activeUsers: data.systemMetrics.activeUsers,
        totalRequests: data.systemMetrics.totalRequests,
        successRate: data.systemMetrics.successRate,
        averageResponseTime: data.systemMetrics.averageResponseTime,
        totalTokens: data.userMetrics.totalTokens || 0,
        estimatedCost: data.userMetrics.estimatedCost || 0
      });
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Admin Access Required</h3>
          <p className="text-gray-500 mb-4">
            You need administrator privileges to access this dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">AI System Administration</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={loadMetrics}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.totalUsers}</p>
          <div className="flex items-center mt-1 text-sm">
            <span className="text-gray-600">{metrics.activeUsers} active today</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Requests</h3>
            <Zap className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.totalRequests}</p>
          <div className="flex items-center mt-1 text-sm">
            <span className="text-gray-600">Last 24 hours</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Success Rate</h3>
            {metrics.successRate > 0.95 ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            )}
          </div>
          <p className="text-2xl font-bold text-gray-900">{(metrics.successRate * 100).toFixed(1)}%</p>
          <div className="flex items-center mt-1 text-sm">
            <span className="text-gray-600">System health</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Response Time</h3>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{metrics.averageResponseTime.toFixed(0)}ms</p>
          <div className="flex items-center mt-1 text-sm">
            <span className="text-gray-600">Average</span>
          </div>
        </motion.div>
      </div>

      {/* System Health */}
      <AISystemHealth />

      {/* Usage Stats */}
      <AIUsageStats />

      {/* Feedback Analytics */}
      <AIFeedbackAnalytics />

      {/* Settings Modal */}
      <AISettings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};