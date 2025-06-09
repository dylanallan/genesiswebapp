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
  Camera
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

import EnterpriseHeader from './EnterpriseHeader';
import EnterpriseFeatureNav from './EnterpriseFeatureNav';
import EnterpriseFeatureBanner from './EnterpriseFeatureBanner';
import { AutomationFlow } from './AutomationFlow';
import { MetricsCard } from './MetricsCard';
import { Chat } from './Chat';
import { AdvancedAnalyticsDashboard } from './AdvancedAnalyticsDashboard';
import { SystemDashboard } from './SystemDashboard';
import { VoiceCloning } from './VoiceCloning';
import { ARHeritageViewer } from './ARHeritageViewer';
import { DNAInsights } from './DNAInsights';
import { TimelineBuilder } from './TimelineBuilder';
import { CulturalRecipeBook } from './CulturalRecipeBook';
import { MarketingAutomation } from './MarketingAutomation';
import { FlowBuilder } from './FlowBuilder';

interface DashboardMetrics {
  totalUsers: number;
  activeAutomations: number;
  systemHealth: number;
  aiRequests: number;
  culturalArtifacts: number;
  businessProcesses: number;
}

const features = [
  {
    id: 'dashboard',
    name: 'AI Dashboard',
    icon: Brain,
    component: () => (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AutomationFlow />
        </div>
        <div className="space-y-6">
          <MetricsCard
            title="Enterprise Performance"
            metrics={{
              errorDetection: 0.999,
              errorCorrection: 0.99,
              systemValidation: 0.999,
              performanceMonitoring: 0.999,
              qualityAssurance: 0.999,
            }}
            targetMetrics={{
              errorDetection: 0.995,
              errorCorrection: 0.98,
              systemValidation: 0.995,
              performanceMonitoring: 0.995,
              qualityAssurance: 0.995,
            }}
          />
          <Chat
            userName="Enterprise User"
            ancestry="Sample ancestry data"
            businessGoals="Sample business goals"
          />
        </div>
      </div>
    ),
    description: 'AI-powered enterprise automation hub',
    category: 'core'
  },
  {
    id: 'system-monitor',
    name: 'System Monitor',
    icon: Activity,
    component: SystemDashboard,
    description: 'Real-time system optimization and monitoring',
    category: 'core'
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
    id: 'workflow-builder',
    name: 'Workflow Builder',
    icon: Workflow,
    component: FlowBuilder,
    description: 'Enterprise workflow automation builder',
    category: 'business'
  },
  {
    id: 'marketing',
    name: 'Marketing Automation',
    icon: TrendingUp,
    component: MarketingAutomation,
    description: 'Automated marketing funnels and campaigns',
    category: 'business'
  },
  {
    id: 'voice-cloning',
    name: 'Voice Preservation',
    icon: Mic,
    component: VoiceCloning,
    description: 'Clone and preserve ancestral voices',
    category: 'heritage'
  },
  {
    id: 'ar-heritage',
    name: 'AR Heritage',
    icon: Camera,
    component: ARHeritageViewer,
    description: 'Augmented reality heritage exploration',
    category: 'heritage'
  },
  {
    id: 'dna-insights',
    name: 'DNA Analysis',
    icon: Dna,
    component: DNAInsights,
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
    id: 'recipes',
    name: 'Cultural Recipes',
    icon: ChefHat,
    component: CulturalRecipeBook,
    description: 'Traditional family recipes and stories',
    category: 'heritage'
  }
];

export const EnterpriseDashboard: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    activeAutomations: 0,
    systemHealth: 0,
    aiRequests: 0,
    culturalArtifacts: 0,
    businessProcesses: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load dashboard metrics
      const [
        usersResult,
        automationsResult,
        aiRequestsResult,
        artifactsResult,
        businessResult
      ] = await Promise.allSettled([
        supabase.from('user_data').select('user_id', { count: 'exact' }),
        supabase.from('automation_workflows').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('ai_request_logs').select('id', { count: 'exact' }).gte('created_at', new Date(Date.now() - 86400000).toISOString()),
        supabase.from('cultural_artifacts').select('id', { count: 'exact' }),
        supabase.from('marketing_funnels').select('id', { count: 'exact' })
      ]);

      setDashboardMetrics({
        totalUsers: usersResult.status === 'fulfilled' ? usersResult.value.count || 0 : 0,
        activeAutomations: automationsResult.status === 'fulfilled' ? automationsResult.value.count || 0 : 0,
        systemHealth: 98.5,
        aiRequests: aiRequestsResult.status === 'fulfilled' ? aiRequestsResult.value.count || 0 : 0,
        culturalArtifacts: artifactsResult.status === 'fulfilled' ? artifactsResult.value.count || 0 : 0,
        businessProcesses: businessResult.status === 'fulfilled' ? businessResult.value.count || 0 : 0
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

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
              <h3 className="font-semibold text-gray-900 mb-2">Enterprise Status</h3>
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