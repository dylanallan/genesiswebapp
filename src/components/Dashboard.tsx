import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AutomationFlow } from './AutomationFlow';
import { MetricsCard } from './MetricsCard';
import { Chat } from './Chat';
import { ColorSettings } from './ColorSettings';
import { Brain, Activity, Cpu, LogOut, Search, ChevronDown, Bell, Settings, X, Zap, Globe, Users, BookOpen, ChefHat, Calendar, Dna, Camera, Mic } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSession } from '@supabase/auth-helpers-react';
import { useAtom } from 'jotai';
import { userPreferencesAtom } from '../lib/store';
import { cn } from '../lib/utils';
import { CulturalRecipeBook } from './CulturalRecipeBook';
import { TimelineBuilder } from './TimelineBuilder';
import { DNAInsights } from './DNAInsights';
import { ARHeritageViewer } from './ARHeritageViewer';
import { VoiceCloning } from './VoiceCloning';

interface DashboardProps {
  onViewModeChange: (mode: 'standard' | 'enterprise' | 'hackathon') => void;
}

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

const features = [
  { id: 'dashboard', name: 'AI Dashboard', icon: Brain },
  { id: 'recipes', name: 'Cultural Recipes', icon: ChefHat },
  { id: 'timeline', name: 'Family Timeline', icon: Calendar },
  { id: 'dna', name: 'DNA Analysis', icon: Dna },
  { id: 'ar', name: 'AR Heritage', icon: Camera },
  { id: 'voice', name: 'Voice Preservation', icon: Mic },
];

export const Dashboard: React.FC<DashboardProps> = ({ onViewModeChange }) => {
  const session = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications] = useState<string[]>([]);
  const [preferences] = useAtom(userPreferencesAtom);
  const [activeFeature, setActiveFeature] = useState('dashboard');
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const { colorScheme } = preferences;

  const renderFeature = () => {
    switch (activeFeature) {
      case 'recipes':
        return <CulturalRecipeBook />;
      case 'timeline':
        return <TimelineBuilder />;
      case 'dna':
        return <DNAInsights />;
      case 'ar':
        return <ARHeritageViewer />;
      case 'voice':
        return <VoiceCloning />;
      case 'dashboard':
      default:
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AutomationFlow />
            </div>
            <div className="space-y-6">
              <MetricsCard
                title="System Performance"
                metrics={systemMetrics}
                targetMetrics={targetMetrics}
              />
              <Chat
                userName={session?.user?.email?.split('@')[0] || 'User'}
                ancestry="Sample ancestry data"
                businessGoals="Sample business goals"
              />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colorScheme.background }}>
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b" style={{ 
        backgroundColor: colorScheme.primary,
        borderColor: colorScheme.border
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
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

            <div className="flex items-center space-x-2">
              <div className="relative">
                <button
                  onClick={() => onViewModeChange('enterprise')}
                  className="px-3 py-1.5 text-sm bg-gradient-to-r from-genesis-500 to-spiritual-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Switch to Enterprise
                </button>
              </div>

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
              
              {session && (
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
                        {session.user?.email?.[0].toUpperCase()}
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
                          {session.user?.email}
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
                        onClick={() => onViewModeChange('hackathon')}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-opacity-10 flex items-center"
                        style={{ 
                          color: colorScheme.text,
                          backgroundColor: `${colorScheme.secondary}22`
                        }}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Hackathon Demo
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
              )}
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

      {/* Feature Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 py-3 overflow-x-auto scrollbar-hide">
            {features.map(feature => {
              const Icon = feature.icon;
              return (
                <motion.button
                  key={feature.id}
                  onClick={() => setActiveFeature(feature.id)}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
                    activeFeature === feature.id
                      ? 'bg-gradient-to-r from-genesis-50 to-spiritual-50 text-genesis-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className={`w-4 h-4 ${activeFeature === feature.id ? 'text-genesis-600' : ''}`} />
                  <span className="text-sm font-medium">{feature.name}</span>
                  {activeFeature === feature.id && (
                    <motion.div
                      layoutId="activeFeatureIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-genesis-500 to-spiritual-500"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </motion.button>
              );
            })}
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

        {renderFeature()}
      </main>

      {/* Enhanced Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          <motion.button 
            className="w-14 h-14 bg-gradient-to-r from-genesis-500 to-spiritual-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Zap className="w-6 h-6" />
          </motion.button>
          
          <div className="absolute bottom-16 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64">
              <h3 className="font-semibold text-gray-900 mb-2">System Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>AI Router</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600">Optimal</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Database</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600">Optimal</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Automation</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Analytics</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-600">Running</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};