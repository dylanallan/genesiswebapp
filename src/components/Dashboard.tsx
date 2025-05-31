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
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Brain className="w-8 h-8 text-genesis-600" />
              <div className="ml-2">
                <h1 className="text-xl font-semibold text-gray-900">Genesis Heritage</h1>
                <p className="text-sm text-gray-500">Automate your business and unlock your roots</p>
              </div>
            </div>

            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="search"
                  placeholder="Search flows..."
                  className="block w-full bg-gray-50 border border-gray-300 rounded-lg py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-genesis-500 focus:border-genesis-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-500" />
                <span className="text-sm text-green-600 font-medium">System Active</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="px-4 py-2 bg-genesis-50 text-genesis-700 rounded-full flex items-center">
              <Cpu className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">All Systems Operational</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <FlowBuilder />
          </div>
          
          <div className="space-y-6">
            <MetricsCard
              title="Heritage System Performance"
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