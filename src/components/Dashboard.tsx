import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AutomationFlow } from './AutomationFlow';
import { MetricsCard } from './MetricsCard';
import { Chat } from './Chat';
import { ColorSettings } from './ColorSettings';
import { Brain, Activity, Cpu, LogOut, Search, ChevronDown, Bell, Settings, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUser } from '@supabase/auth-helpers-react';
import { useAtom } from 'jotai';
import { userPreferencesAtom } from '../lib/store';
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
  const [showSettings, setShowSettings] = useState(false);
  const [notifications] = useState<string[]>([]);
  const [preferences] = useAtom(userPreferencesAtom);
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const { colorScheme } = preferences;

  return (
    <div className="min-h-screen" style={{ backgroundColor: colorScheme.background }}>
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b" style={{ 
        backgroundColor: colorScheme.primary,
        borderColor: colorScheme.border
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Brain className="w-6 h-6" style={{ color: colorScheme.accent }} />
                <h1 className="text-lg font-medium" style={{ color: colorScheme.text }}>
                  Genesis Heritage
                </h1>
              </div>
              <p className="text-sm hidden sm:block" style={{ color: colorScheme.text }}>
                Automate your business and unlock your roots
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <button 
                className="relative p-2 rounded-full hover:bg-opacity-10"
                style={{ 
                  color: colorScheme.text,
                  backgroundColor: `${colorScheme.secondary}22`
                }}
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-full hover:bg-opacity-10"
                  style={{ 
                    backgroundColor: `${colorScheme.secondary}22`
                  }}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ 
                      backgroundColor: colorScheme.accent,
                      color: colorScheme.primary
                    }}
                  >
                    <span className="text-sm font-medium">
                      {user?.email?.[0].toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4" style={{ color: colorScheme.text }} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg border"
                    style={{ 
                      backgroundColor: colorScheme.primary,
                      borderColor: colorScheme.border
                    }}
                  >
                    <div className="px-4 py-2 border-b" style={{ borderColor: colorScheme.border }}>
                      <p className="text-sm font-medium" style={{ color: colorScheme.text }}>
                        {user?.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowSettings(true);
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-opacity-10 flex items-center"
                      style={{ 
                        color: colorScheme.text,
                        backgroundColor: `${colorScheme.secondary}22`
                      }}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-opacity-10 flex items-center"
                      style={{ backgroundColor: `${colorScheme.secondary}22` }}
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

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="relative max-w-lg w-full mx-4">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute -top-2 -right-2 p-2 rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <ColorSettings />
          </div>
        </div>
      )}

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
          <div className="lg:col-span-2 space-y-6">
            <AutomationFlow />
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