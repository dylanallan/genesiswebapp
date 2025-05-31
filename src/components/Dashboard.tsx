import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FlowBuilder } from './FlowBuilder';
import { MetricsCard } from './MetricsCard';
import { Chat } from './Chat';
import { Brain, Activity, Cpu, LogOut, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '@supabase/auth-helpers-react';

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
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-4">
              <Brain className="w-6 h-6 text-genesis-600" />
              <h1 className="text-lg font-medium text-gray-900">Genesis Heritage</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <Activity className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Active</span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4" />
              </button>
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
              placeholder="Search flows..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-genesis-500 focus:border-genesis-500"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-genesis-50 text-genesis-700 rounded-full text-sm">
            <Cpu className="w-4 h-4" />
            <span>All Systems Operational</span>
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