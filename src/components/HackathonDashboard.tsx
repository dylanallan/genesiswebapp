import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Activity, 
  BarChart3, 
  Users, 
  Globe, 
  TrendingUp, 
  Cpu, 
  Zap, 
  Workflow, 
  ChefHat, 
  Calendar, 
  Dna, 
  Mic, 
  Camera, 
  DollarSign, 
  Calculator, 
  Presentation as PresentationScreen 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSession } from '../lib/session-context';
import { toast } from 'sonner';
import { UserProfileButton } from './UserProfileButton';

export const HackathonDashboard: React.FC = () => {
  const session = useSession();
  const [activeFeature, setActiveFeature] = useState('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-genesis-50 via-white to-spiritual-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="w-12 h-12 text-genesis-600 mx-auto mb-4" />
          </motion.div>
          <p className="text-gray-600 font-medium">Loading Genesis Heritage Enterprise...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-genesis-50 via-white to-spiritual-50">
      {/* Enterprise Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Genesis Heritage Pro
                </h1>
                <p className="text-sm text-gray-600">Hackathon Demo</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-800 text-sm font-medium">Live Demo</span>
              </div>
              
              <UserProfileButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Hackathon Demo</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Genesis Heritage Pro combines AI-powered business automation with cultural heritage preservation.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <TrendingUp className="w-8 h-8 text-blue-500 mb-3 mx-auto" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">$37M Valuation</h3>
              <p className="text-gray-600 text-sm">Target valuation based on market analysis and growth potential</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <Zap className="w-8 h-8 text-purple-500 mb-3 mx-auto" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">AI-First Design</h3>
              <p className="text-gray-600 text-sm">Built from the ground up for the AI era</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <Globe className="w-8 h-8 text-green-500 mb-3 mx-auto" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Cultural Intelligence</h3>
              <p className="text-gray-600 text-sm">Respects and integrates cultural context in business operations</p>
            </div>
          </div>
          
          <button
            onClick={() => toast.success('Demo request received!')}
            className="mt-8 px-6 py-3 bg-gradient-to-r from-genesis-500 to-spiritual-500 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            Request Full Demo
          </button>
        </div>
      </main>

      {/* Hackathon Badge */}
      <div className="fixed top-24 right-6 z-40">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 1, type: "spring", stiffness: 100 }}
          className="bg-gradient-to-r from-genesis-500 to-spiritual-500 text-white px-4 py-2 rounded-lg shadow-lg transform -rotate-3"
        >
          <div className="font-bold">$37M Valuation</div>
          <div className="text-xs">Hackathon Champion</div>
        </motion.div>
      </div>

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
              <h3 className="font-semibold text-gray-900 mb-2">Hackathon Demo</h3>
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
                  <span>Target Valuation</span>
                  <div className="flex items-center space-x-1">
                    <span className="text-blue-600 font-bold">$37M</span>
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