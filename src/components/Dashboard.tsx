import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FlowBuilder } from './FlowBuilder';
import { MetricsCard } from './MetricsCard';
import { Chat } from './Chat';
import { Layout, Brain, Activity, Zap, Workflow, Cpu, LogOut, Settings, Users, FileText, Trees as Tree, Database, Search, Bell, Menu } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('flows');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const user = useUser();
  
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <Brain className="w-8 h-8 text-genesis-600" />
                <span className="ml-2 text-xl font-semibold text-gray-900">Genesis</span>
              </div>
              <div className="hidden md:flex items-center space-x-1 ml-10">
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

            <div className="hidden md:flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="relative">
                <button className="flex items-center space-x-3 p-2 rounded-full hover:bg-gray-100">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-genesis-500 to-spiritual-500 flex items-center justify-center text-white font-medium">
                    {user?.email?.[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user?.email}</span>
                </button>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </button>
            </div>

            <div className="flex md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-genesis-500"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-base font-medium ${
                    activeTab === tab.id
                      ? 'bg-genesis-100 text-genesis-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-genesis-500 to-spiritual-500 flex items-center justify-center text-white font-medium">
                  {user?.email?.[0].toUpperCase()}
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">{user?.email}</div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign out
              </button>
            </div>
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
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-genesis-500 focus:border-transparent"
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>
            <div className="px-4 py-2 bg-genesis-50 text-genesis-700 rounded-full flex items-center">
              <Cpu className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">All Systems Operational</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'flows' && <FlowBuilder />}
            {/* Add other tab content components here */}
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