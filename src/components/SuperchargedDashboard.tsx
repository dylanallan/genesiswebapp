import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dashboard } from './Dashboard';
import { VoiceCloning } from './VoiceCloning';
import { ARHeritageViewer } from './ARHeritageViewer';
import { DNAInsights } from './DNAInsights';
import { TimelineBuilder } from './TimelineBuilder';
import { CulturalRecipeBook } from './CulturalRecipeBook';
import { 
  Brain, 
  Dna, 
  Mic, 
  Camera, 
  Calendar, 
  ChefHat, 
  Sparkles,
  Globe,
  Users,
  BookOpen,
  Heart,
  Zap
} from 'lucide-react';

const features = [
  {
    id: 'dashboard',
    name: 'AI Dashboard',
    icon: Brain,
    component: Dashboard,
    description: 'Main AI-powered automation hub'
  },
  {
    id: 'voice-cloning',
    name: 'Voice Preservation',
    icon: Mic,
    component: VoiceCloning,
    description: 'Clone and preserve ancestral voices'
  },
  {
    id: 'ar-heritage',
    name: 'AR Heritage',
    icon: Camera,
    component: ARHeritageViewer,
    description: 'Augmented reality heritage exploration'
  },
  {
    id: 'dna-insights',
    name: 'DNA Analysis',
    icon: Dna,
    component: DNAInsights,
    description: 'Comprehensive genetic heritage insights'
  },
  {
    id: 'timeline',
    name: 'Family Timeline',
    icon: Calendar,
    component: TimelineBuilder,
    description: 'Interactive family history timeline'
  },
  {
    id: 'recipes',
    name: 'Cultural Recipes',
    icon: ChefHat,
    component: CulturalRecipeBook,
    description: 'Traditional family recipes and stories'
  }
];

export const SuperchargedDashboard: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState('dashboard');

  const ActiveComponent = features.find(f => f.id === activeFeature)?.component || Dashboard;

  return (
    <div className="min-h-screen bg-gradient-to-br from-genesis-50 via-white to-spiritual-50">
      {/* Enhanced Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-8 h-8 text-genesis-600" />
              <h1 className="text-xl font-bold bg-gradient-to-r from-genesis-600 to-spiritual-600 bg-clip-text text-transparent">
                Genesis Heritage Pro
              </h1>
            </div>

            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              {features.map(feature => {
                const Icon = feature.icon;
                return (
                  <button
                    key={feature.id}
                    onClick={() => setActiveFeature(feature.id)}
                    className={`relative flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200 ${
                      activeFeature === feature.id
                        ? 'bg-white text-genesis-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:block">{feature.name}</span>
                    {activeFeature === feature.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-white rounded-md shadow-sm"
                        style={{ zIndex: -1 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Feature Description Banner */}
      <div className="bg-gradient-to-r from-genesis-500 to-spiritual-500 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-3">
            {React.createElement(features.find(f => f.id === activeFeature)?.icon || Brain, {
              className: "w-6 h-6"
            })}
            <div>
              <h2 className="font-semibold">
                {features.find(f => f.id === activeFeature)?.name}
              </h2>
              <p className="text-sm opacity-90">
                {features.find(f => f.id === activeFeature)?.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeFeature}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ActiveComponent />
        </motion.div>
      </main>

      {/* Floating Action Button for Quick Access */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="relative group">
          <button className="w-14 h-14 bg-gradient-to-r from-genesis-500 to-spiritual-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </button>
          
          <div className="absolute bottom-16 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64">
              <h3 className="font-semibold text-gray-900 mb-2">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                  🎤 Record Voice Sample
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                  📱 Start AR Session
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                  🧬 Upload DNA Data
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                  📅 Add Timeline Event
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};