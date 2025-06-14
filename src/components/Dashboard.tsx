import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Activity, 
  Cpu, 
  Bell, 
  X, 
  Zap, 
  Globe, 
  Users, 
  BookOpen, 
  ChefHat, 
  Calendar,
  Database,
  Sparkles
} from 'lucide-react';
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
import { toast } from 'sonner';
import { UserProfileButton } from './UserProfileButton';
import { EnhancedAIAssistant } from './EnhancedAIAssistant';
import { ErrorBoundary } from '../lib/error-boundary';

interface DashboardProps {
  onViewModeChange: (mode: 'standard' | 'enterprise' | 'hackathon') => void;
}

const features = [
  {
    id: 'artifacts',
    name: 'Cultural Artifacts',
    icon: Globe,
    component: CulturalArtifactGallery,
    description: 'Main AI-powered automation hub',
    category: 'core'
  },
  {
    id: 'traditions',
    name: 'Traditions',
    icon: BookOpen,
    component: TraditionsManager,
    description: 'Real-time system optimization and monitoring',
    category: 'core'
  },
  {
    id: 'contacts',
    name: 'Family Contacts',
    icon: Users,
    component: FamilyContactManager,
    description: 'AI-powered insights and predictive analytics',
    category: 'core'
  },
  {
    id: 'celebrations',
    name: 'Celebrations',
    icon: Calendar,
    component: CelebrationManager,
    description: 'Clone and preserve ancestral voices',
    category: 'heritage'
  },
  {
    id: 'stories',
    name: 'Cultural Stories',
    icon: BookOpen,
    component: CulturalStoryLibrary,
    description: 'Augmented reality heritage exploration',
    category: 'heritage'
  },
  {
    id: 'recipes',
    name: 'Cultural Recipes',
    icon: ChefHat,
    component: CulturalRecipeBook,
    description: 'Comprehensive genetic heritage insights',
    category: 'heritage'
  },
  {
    id: 'timeline',
    name: 'Family Timeline',
    icon: Calendar,
    component: TimelineBuilder,
    description: 'Interactive family history timeline',
    category: 'heritage'
  },
  {
    id: 'automation',
    name: 'Business Automation',
    icon: Zap,
    component: AutomationHub,
    description: 'Traditional family recipes and stories',
    category: 'business'
  },
  {
    id: 'profile',
    name: 'User Profile',
    icon: Users,
    component: UserProfileManager,
    description: 'User profile management',
    category: 'core'
  }
];

export const Dashboard: React.FC<DashboardProps> = ({ onViewModeChange }) => {
  const session = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications] = useState<string[]>([]);
  const [preferences] = useAtom(userPreferencesAtom);
  const [activeFeature, setActiveFeature] = useState('artifacts');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { colorScheme } = preferences;

  const filteredFeatures = selectedCategory === 'all' 
    ? features 
    : features.filter(f => f.category === selectedCategory);

  const ActiveComponent = features.find(f => f.id === activeFeature)?.component || features[0].component;

  const categories = [
    { id: 'all', name: 'All Features', icon: Sparkles },
    { id: 'core', name: 'Core System', icon: Brain },
    { id: 'heritage', name: 'Heritage Tools', icon: Globe },
    { id: 'business', name: 'Business Tools', icon: Zap }
  ];

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
                <Brain className="w-6 h-6 text-genesis-600" />
                <h1 className="text-lg font-medium text-gray-900">
                  Genesis Heritage
                </h1>
              </div>
              <p className="text-sm hidden sm:block text-gray-600">
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
          <div className="lg:col-span-2">
            <ErrorBoundary>
              <ActiveComponent />
            </ErrorBoundary>
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
            <Sparkles className="w-6 h-6" />
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