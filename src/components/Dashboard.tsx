import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FlowBuilder } from './FlowBuilder';
import { MetricsCard } from './MetricsCard';
import { Chat } from './Chat';
import { Layout, Brain, Activity, Zap, Workflow, Cpu, LogOut, Settings, Users, FileText, Trees as Tree, Database } from 'lucide-react';
import { supabase } from '../lib/supabase';

const systemMetrics = {
  errorDetection: 0.999,
  errorCorrection: 0.99,
  systemValidation: 0.999,
  performanceMonitoring: 0.999,
  qualityAssurance: 0.999,
};

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('flows');
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const tabs = [
    { id: 'flows', label: 'Flow Builder', icon: Workflow },
    { id: 'automation', label: 'Automation', icon: Zap },
    { id: 'spiritual', label: 'Spiritual Mapping', icon: Tree },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'data', label: 'Data Pipeline', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Brain className="w-6 h-6 text-genesis-600" />
              <h1 className="ml-2 text-xl font-semibold text-gray-900">Genesis System</h1>
            </div>
            <div className="hidden md:flex items-center space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                      activeTab === tab.id
                        ? 'text-genesis-600'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </div>
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-genesis-600"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              className="p-2 text-gray-400 hover:text-gray-500"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <Activity className="w-6 h-6 text-green-500" />
            <span className="text-green-600 font-semibold">System Active</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="px-4 py-2 bg-genesis-50 text-genesis-700 rounded-full flex items-center">
              <Cpu className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">All Systems Operational</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {activeTab === 'flows' && <FlowBuilder />}
            {/* Add other tab content components here */}
          </div>
          
          <div className="space-y-6">
            <MetricsCard
              title="System Performance"
              metrics={systemMetrics}
              icon={Brain}
              className="bg-white rounded-lg shadow-sm border border-gray-200"
            />
            <Chat />
          </div>
        </div>
      </main>
    </div>
  );
};