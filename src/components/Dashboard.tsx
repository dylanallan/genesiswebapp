import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FlowBuilder } from './FlowBuilder';
import { MetricsCard } from './MetricsCard';
import { Chat } from './Chat';
import { Brain, Activity, Cpu, LogOut, Search, ChevronDown, Bell, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '@supabase/auth-helpers-react';
import { cn } from '../lib/utils';

const systemMetrics = {
  errorDetection: 0.999,
  errorCorrection: 0.99,
  systemValidation: 0.999,
  performanceMonitoring: 0.999,
  qualityAssurance: 0.999,
};

const targetMetrics = {
  errorDetection: 0.995,
  errorCorrection: 0.98,
  systemValidation: 0.995,
  performanceMonitoring: 0.995,
  qualityAssurance: 0.995,
};

export const Dashboard: React.FC = () => {
  const user = useUser();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-6 h-6 text-genesis-600" />
                <h1 className="text-lg font-medium text-gray-900">Genesis Heritage</h1>
              </div>
              <p className="text-sm text-gray-500 hidden sm:block">
                Automate your business and unlock your roots
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-genesis-500 rounded-full">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-genesis-500"
                >
                  <div className="w-8 h-8 rounded-full bg-genesis-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-genesis-600">
                      {user?.email?.[0].toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {/* Handle settings */}}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search flows, automations, or type / for commands..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-genesis-500 focus:border-genesis-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center space-x-2 px-3 py-1.5 bg-genesis-50 text-genesis-700 rounded-full text-sm"
            >
              <Activity className="w-4 h-4 text-green-500" />
              <span>All Systems Active</span>
            </motion.div>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center space-x-2 px-3 py-1.5 bg-genesis-50 text-genesis-700 rounded-full text-sm"
            >
              <Cpu className="w-4 h-4" />
              <span>Processing Optimized</span>
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <FlowBuilder />
          </div>
          
          <div className="space-y-6">
            <MetricsCard
              title="System Performance"
              metrics={systemMetrics}
              targetMetrics={targetMetrics}
            />
            <Chat
              userName={user?.email?.split('@')[0] || 'User'}
              ancestry="Sample ancestry data"
              businessGoals="Sample business goals"
            />
          </div>
        </div>
      </main>
    </div>
  );
};