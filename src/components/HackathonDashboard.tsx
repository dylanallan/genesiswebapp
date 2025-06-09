import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import EnterpriseHeader from './EnterpriseHeader';
import EnterpriseFeatureNav from './EnterpriseFeatureNav';
import EnterpriseFeatureBanner from './EnterpriseFeatureBanner';
import EnterpriseMetricsPanel from './EnterpriseMetricsPanel';
import EnterprisePricingPanel from './EnterprisePricingPanel';
import EnterpriseFeatureComparison from './EnterpriseFeatureComparison';
import EnterpriseROICalculator from './EnterpriseROICalculator';
import EnterpriseDemo from './EnterpriseDemo';
import { AutomationFlow } from './AutomationFlow';
import { FlowBuilder } from './FlowBuilder';
import { AdvancedAnalyticsDashboard } from './AdvancedAnalyticsDashboard';
import { Chat } from './Chat';
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
  PresentationScreen
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSession } from '@supabase/auth-helpers-react';
import { toast } from 'sonner';

const features = [
  {
    id: 'dashboard',
    name: 'AI Dashboard',
    icon: Brain,
    component: () => (
      <div className="space-y-6">
        <EnterpriseMetricsPanel 
          metrics={{
            totalUsers: 1250,
            activeAutomations: 87,
            systemHealth: 99.8,
            aiRequests: 125000,
            culturalArtifacts: 3750,
            businessProcesses: 450,
            responseTime: 120,
            uptime: 99.98
          }}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AutomationFlow />
          </div>
          <div className="space-y-6">
            <Chat
              userName="Enterprise User"
              ancestry="European and Asian heritage"
              businessGoals="Automate marketing and preserve cultural knowledge"
            />
          </div>
        </div>
      </div>
    ),
    description: 'AI-powered enterprise automation hub',
    category: 'core'
  },
  {
    id: 'workflow-builder',
    name: 'Workflow Builder',
    icon: Workflow,
    component: FlowBuilder,
    description: 'Enterprise workflow automation builder',
    category: 'business'
  },
  {
    id: 'analytics',
    name: 'Advanced Analytics',
    icon: BarChart3,
    component: AdvancedAnalyticsDashboard,
    description: 'AI-powered insights and predictive analytics',
    category: 'core'
  },
  {
    id: 'pricing',
    name: 'Enterprise Pricing',
    icon: DollarSign,
    component: EnterprisePricingPanel,
    description: 'Flexible pricing for businesses of all sizes',
    category: 'business'
  },
  {
    id: 'features',
    name: 'Feature Comparison',
    icon: Activity,
    component: EnterpriseFeatureComparison,
    description: 'Detailed comparison of all available features',
    category: 'business'
  },
  {
    id: 'roi-calculator',
    name: 'ROI Calculator',
    icon: Calculator,
    component: EnterpriseROICalculator,
    description: 'Calculate your return on investment',
    category: 'business'
  },
  {
    id: 'demo',
    name: 'Interactive Demo',
    icon: PresentationScreen,
    component: EnterpriseDemo,
    description: 'See Genesis Heritage Pro in action',
    category: 'core'
  }
];

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

  const ActiveComponent = features.find(f => f.id === activeFeature)?.component || features[0].component;
  const activeFeatureData = features.find(f => f.id === activeFeature) || features[0];

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
      <EnterpriseHeader 
        onCategoryChange={setSelectedCategory}
        selectedCategory={selectedCategory}
      />

      {/* Feature Navigation */}
      <EnterpriseFeatureNav 
        features={features}
        activeFeature={activeFeature}
        onFeatureChange={setActiveFeature}
        selectedCategory={selectedCategory}
      />

      {/* Feature Banner */}
      <EnterpriseFeatureBanner 
        title={activeFeatureData.name}
        description={activeFeatureData.description}
        icon={React.createElement(activeFeatureData.icon, { className: "w-5 h-5" })}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <motion.div
          key={activeFeature}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ActiveComponent />
        </motion.div>
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