import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Workflow, 
  Zap, 
  Clock, 
  TrendingUp, 
  BarChart3, 
  CheckCircle, 
  AlertTriangle,
  Users,
  Calendar,
  Mail,
  FileText,
  Database,
  RefreshCw
} from 'lucide-react';
import { AutomationInterface } from './AutomationInterface';
import { VoiceAgent } from './VoiceAgent';

export const AutomationDashboard: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold text-gray-900">Automation Dashboard</h2>
        <button
          onClick={refreshData}
          className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Active Workflows</h3>
            <Workflow className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">12</p>
          <div className="flex items-center mt-1 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+3 this month</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Time Saved</h3>
            <Clock className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">127 hrs</p>
          <div className="flex items-center mt-1 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+15% from last month</span>
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
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">98.7%</p>
          <div className="flex items-center mt-1 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+2.3% from last month</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Executions</h3>
            <Zap className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">1,432</p>
          <div className="flex items-center mt-1 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-600">+342 this month</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AutomationInterface />
        </div>
        <div>
          <VoiceAgent />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">Workflow Performance</h3>
          <div className="space-y-4">
            {[
              { name: 'Customer Onboarding', success: 98, icon: Users },
              { name: 'Invoice Processing', success: 100, icon: FileText },
              { name: 'Email Campaigns', success: 95, icon: Mail },
              { name: 'Data Backup', success: 100, icon: Database },
              { name: 'Meeting Scheduler', success: 92, icon: Calendar }
            ].map((workflow, index) => {
              const Icon = workflow.icon;
              return (
                <div key={index} className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Icon className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{workflow.name}</span>
                      <span className="text-sm text-gray-500">{workflow.success}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          workflow.success >= 95 ? 'bg-green-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${workflow.success}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { event: 'Customer Onboarding workflow executed', time: '10 minutes ago', status: 'success', icon: CheckCircle },
              { event: 'Invoice Processing workflow executed', time: '25 minutes ago', status: 'success', icon: CheckCircle },
              { event: 'Social Media Scheduler paused', time: '1 hour ago', status: 'warning', icon: AlertTriangle },
              { event: 'Lead Qualification workflow executed', time: '2 hours ago', status: 'success', icon: CheckCircle },
              { event: 'Data Backup workflow created', time: '1 day ago', status: 'info', icon: Workflow }
            ].map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`p-1 rounded-full ${
                    activity.status === 'success' ? 'bg-green-100 text-green-600' :
                    activity.status === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-gray-900">{activity.event}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
};