import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  Users, 
  Calendar, 
  FileText, 
  Globe, 
  Settings, 
  Plus,
  Search,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { EnhancedAIAssistant } from './EnhancedAIAssistant';
import UniversalSearch from './UniversalSearch';
import { DataSourceAdmin } from './DataSourceAdmin';
// import { CulturalArtifactGallery } from './CulturalArtifactGallery';
// import { TraditionsManager } from './TraditionsManager';
// import { FamilyContactManager } from './FamilyContactManager';
// import { CelebrationManager } from './CelebrationManager';
// import { CulturalStoryLibrary } from './CulturalStoryLibrary';
// import { CulturalRecipeBook } from './CulturalRecipeBook';
// import { TimelineBuilder } from './TimelineBuilder';
// import { AutomationHub } from './AutomationHub';
// import { UserProfileManager } from './UserProfileManager';
import { useSession } from '@supabase/auth-helpers-react';
import { useAtom } from 'jotai';
import { userPreferencesAtom } from '../lib/store';
import { cn } from '../lib/utils';
import { CulturalArtifactGallery } from './CulturalArtifactGallery';
import { TraditionsManager } from './TraditionsManager';
import { FamilyContactManager } from './FamilyContactManager';
import { CelebrationManager } from './CelebrationManager';
import { CulturalStoryLibrary } from './CulturalStoryLibrary';
import { CulturalRecipeBook } from './CulturalRecipeBook';
import { TimelineBuilder } from './TimelineBuilder';
import { AutomationHub } from './AutomationHub';
import { UserProfileManager } from './UserProfileManager';
import { UserProfileButton } from './UserProfileButton';
import { ErrorBoundary } from '../lib/error-boundary';
import { chatApi } from '../api/chat';

interface DashboardProps {
  onViewModeChange: (mode: 'standard' | 'enterprise' | 'hackathon') => void;
}

const features = [
  {
    id: 'search',
    name: 'Universal Search',
    icon: Search,
    component: UniversalSearch,
    description: 'Search across all data sources',
    category: 'core'
  },
  {
    id: 'data',
    name: 'Data Sources',
    icon: FileText,
    component: DataSourceAdmin,
    description: 'Manage data sources and integrations',
    category: 'core'
  }
];

export const Dashboard: React.FC<DashboardProps> = ({ onViewModeChange }) => {
  const session = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications] = useState<string[]>([]);
  const [preferences] = useAtom(userPreferencesAtom);
  const [activeFeature, setActiveFeature] = useState('search');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [testResult, setTestResult] = useState<string>('');
  
  const { colorScheme } = preferences;

  const filteredFeatures = selectedCategory === 'all' 
    ? features 
    : features.filter(f => f.category === selectedCategory);

  const ActiveComponent = features.find(f => f.id === activeFeature)?.component || features[0].component;

  const categories = [
    { id: 'all', name: 'All Features', icon: Plus },
    { id: 'core', name: 'Core System', icon: Home },
    { id: 'heritage', name: 'Heritage Tools', icon: Globe },
    { id: 'business', name: 'Business Tools', icon: Plus }
  ];

  const testChatAPI = async () => {
    try {
      console.log('🧪 Testing Chat API...');
      const response = await chatApi.sendMessage('Hello! Can you help me with genealogy research?');
      console.log('✅ Test result:', response);
      setTestResult(`✅ Success! Provider: ${response.provider}, Model: ${response.model}, Response: ${response.response.substring(0, 100)}...`);
      toast.success('Chat API test successful!');
    } catch (error: any) {
      console.error('❌ Test failed:', error);
      setTestResult(`❌ Error: ${error.message || 'Unknown error'}`);
      toast.error('Chat API test failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-genesis-50 via-white to-spiritual-50">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-sm" style={{ 
        borderColor: colorScheme.border
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Home className="w-6 h-6 text-genesis-600" />
                <h1 className="text-lg font-medium text-gray-900">
                  Genesis Heritage
                </h1>
              </div>
              <p className="text-sm hidden sm:block text-gray-600">
                Automate your business and unlock your roots
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={testChatAPI}
                className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                title="Test Chat API"
              >
                Test Chat
              </button>
              
              <div className="relative">
                <button
                  onClick={() => onViewModeChange('enterprise')}
                  className="px-3 py-1.5 text-sm bg-gradient-to-r from-genesis-500 to-spiritual-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Switch to Enterprise
                </button>
              </div>

              <button 
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              
              <UserProfileButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Feature Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 py-3 overflow-x-auto scrollbar-hide">
            {filteredFeatures.map(feature => {
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
              <Home className="w-4 h-4 text-green-500" />
              <span>All Systems Active</span>
            </motion.div>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex items-center space-x-2 px-3 py-1.5 bg-genesis-50 text-genesis-700 rounded-full text-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Processing Optimized</span>
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ErrorBoundary>
              {typeof ActiveComponent === 'function' ? <ActiveComponent /> : (
                <div className="p-6 bg-red-100 text-red-800 rounded-lg">
                  <h2 className="text-xl font-bold mb-2">Component Error</h2>
                  <p>Feature component is not available or is not a valid React component.</p>
                </div>
              )}
            </ErrorBoundary>
            
            {/* Test Results Display */}
            {testResult && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                <h3 className="font-semibold mb-2">Chat API Test Result:</h3>
                <p className="text-sm">{testResult}</p>
                <button
                  onClick={() => setTestResult('')}
                  className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
          <div className="space-y-6">
            <ErrorBoundary>
              <EnhancedAIAssistant />
            </ErrorBoundary>
          </div>
        </div>
      </main>

      {/* Enhanced Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          <motion.button 
            className="w-14 h-14 bg-gradient-to-r from-genesis-500 to-spiritual-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-6 h-6" />
          </motion.button>
          
          <div className="absolute bottom-16 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64">
              <h3 className="font-semibold text-gray-900 mb-2">Enhanced AI Features</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Semantic Search</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Context Awareness</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Multi-model Routing</span>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600">Active</span>
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