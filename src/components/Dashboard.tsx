import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FlowBuilder } from './FlowBuilder';
import { MetricsCard } from './MetricsCard';
import { Chat } from './Chat';
import { Layout, Brain, Activity, Zap, Workflow, Cpu, LogOut, Settings, Users, FileText, Trees as Tree, Database, Search, Bell, Menu, X } from 'lucide-react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 fixed w-full z-10">
        <div className="max-w-full px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 lg:hidden"
              >
                {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <div className="flex-shrink-0 flex items-center">
                <Brain className="w-8 h-8 text-genesis-600" />
                <span className="ml-2 text-xl font-semibold text-gray-900 hidden sm:block">Genesis</span>
              </div>
            </div>

            <div className="flex-1 px-4 flex justify-center max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
              <div className="w-full">
                <label htmlFor="search" className="sr-only">Search</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="search"
                    className="block w-full bg-white border border-gray-300 rounded-lg py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:text-gray-900 focus:placeholder-gray-400 focus:ring-1 focus:ring-genesis-500 focus:border-genesis-500"
                    placeholder="Search..."
                    type="search"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="hidden md:flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-genesis-500 to-spiritual-500 flex items-center justify-center text-white font-medium">
                  {user?.email?.[0].toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 transition duration-200 ease-in-out z-30 w-64 bg-white border-r border-gray-200 pt-16`}>
          <div className="h-full flex flex-col">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-genesis-50 text-genesis-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none xl:order-last">
            <div className="absolute inset-0 py-6 px-4 sm:px-6 lg:px-8">
              <div className="h-full flex flex-col">
                {/* Status Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
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

                {/* Content Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1">
                  <div className="xl:col-span-2 space-y-6">
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
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};