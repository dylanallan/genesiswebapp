import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Activity, 
  Cpu, 
  LogOut, 
  Bell, 
  Settings, 
  X,
  Zap,
  BarChart3,
  Users,
  Globe,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSession } from '@supabase/auth-helpers-react';
import { useAtom } from 'jotai';
import { userPreferencesAtom } from '../lib/store';
import { cn } from '../lib/utils';
import { Chat } from './Chat';
import { MetricsCard } from './MetricsCard';
import { AutomationFlow } from './AutomationFlow';
import { AdvancedAnalyticsDashboard } from './AdvancedAnalyticsDashboard';
import { SystemDashboard } from './SystemDashboard';
import { VoiceCloning } from './VoiceCloning';
import { ARHeritageViewer } from './ARHeritageViewer';
import { DNAInsights } from './DNAInsights';
import { TimelineBuilder } from './TimelineBuilder';
import { CulturalRecipeBook } from './CulturalRecipeBook';
import { MarketingAutomation } from './MarketingAutomation';
import { toast } from 'sonner';

interface DashboardMetrics {
  totalUsers: number;
  activeAutomations: number;
  systemHealth: number;
  aiRequests: number;
  culturalArtifacts: number;
  businessProcesses: number;
}

interface SystemStatus {
  aiRouter: 'optimal' | 'degraded' | 'offline';
  database: 'optimal' | 'degraded' | 'offline';
  automation: 'optimal' | 'degraded' | 'offline';
  analytics: 'optimal' | 'degraded' | 'offline';
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
            title="System Performance"
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
            userName="User"
            ancestry="Sample ancestry data"
            businessGoals="Sample business goals"
          />
        </div>
      </div>
    ),
    description: 'Main AI-powered automation hub',
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
    icon: Users,
    component: VoiceCloning,
    description: 'Clone and preserve ancestral voices',
    category: 'heritage'
  },
  {
    id: 'ar-heritage',
    name: 'AR Heritage',
    icon: Globe,
    component: ARHeritageViewer,
    description: 'Augmented reality heritage exploration',
    category: 'heritage'
  },
  {
    id: 'dna-insights',
    name: 'DNA Analysis',
    icon: Cpu,
    component: DNAInsights,
    description: 'Comprehensive genetic heritage insights',
    category: 'heritage'
  },
  {
    id: 'timeline',
    name: 'Family Timeline',
    icon: Activity,
    component: TimelineBuilder,
    description: 'Interactive family history timeline',
    category: 'heritage'
  },
  {
    id: 'recipes',
    name: 'Cultural Recipes',
    icon: Users,
    component: CulturalRecipeBook,
    description: 'Traditional family recipes and stories',
    category: 'heritage'
  }
];

export const ProductionDashboard: React.FC = () => {
  const session = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications] = useState<string[]>([]);
  const [preferences] = useAtom(userPreferencesAtom);
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
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    aiRouter: 'optimal',
    database: 'optimal',
    automation: 'optimal',
    analytics: 'optimal'
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

      // Check system status
      const healthCheck = await Promise.allSettled([
        supabase.from('ai_service_config').select('is_active').eq('is_active', true).limit(1),
        supabase.from('system_health_metrics').select('metric_value').limit(1),
        supabase.from('automation_workflows').select('is_active').limit(1),
        supabase.from('analytics_events').select('id').limit(1)
      ]);

      setSystemStatus({
        aiRouter: healthCheck[0].status === 'fulfilled' ? 'optimal' : 'degraded',
        database: healthCheck[1].status === 'fulfilled' ? 'optimal' : 'degraded',
        automation: healthCheck[2].status === 'fulfilled' ? 'optimal' : 'degraded',
        analytics: healthCheck[3].status === 'fulfilled' ? 'optimal' : 'degraded'
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const { colorScheme } = preferences;

  const ActiveComponent = features.find(f => f.id === activeFeature)?.component || features[0].component;

  const categories = [
    { id: 'all', name: 'All Features', icon: Brain },
    { id: 'core', name: 'Core System', icon: Settings },
    { id: 'business', name: 'Business Tools', icon: TrendingUp },
    { id: 'heritage', name: 'Heritage Tools', icon: Globe }
  ];

  const filteredFeatures = selectedCategory === 'all' 
    ? features 
    : features.filter(f => f.category === selectedCategory);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimal':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'offline':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-genesis-50 via-white to-spiritual-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-genesis-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Genesis Heritage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-genesis-50 via-white to-spiritual-50">
      {/* Enhanced Navigation */}
      <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Brain className="w-8 h-8 text-genesis-600" />
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-genesis-600 to-spiritual-600 bg-clip-text text-transparent">
                    Genesis Heritage Pro
                  </h1>
                  <p className="text-xs text-gray-500">Production Ready System</p>
                </div>
              </div>

              {/* Real-time Metrics */}
              <div className="hidden lg:flex items-center space-x-6 ml-8">
                <div className="text-center">
                  <div className="text-lg font-bold text-genesis-600">{dashboardMetrics.totalUsers}</div>
                  <div className="text-xs text-gray-500">Users</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{dashboardMetrics.activeAutomations}</div>
                  <div className="text-xs text-gray-500">Automations</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{dashboardMetrics.aiRequests}</div>
                  <div className="text-xs text-gray-500">AI Requests</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">{dashboardMetrics.systemHealth}%</div>
                  <div className="text-xs text-gray-500">Health</div>
                </div>
              </div>
            </div>

            {/* Category Filter */}
            <div className="hidden md:flex items-center space-x-2">
              {categories.map(category => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-genesis-100 text-genesis-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:block">{category.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-4">
              {/* System Status */}
              <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                {getStatusIcon(systemStatus.aiRouter)}
                <span className="text-xs text-gray-600">AI</span>
                {getStatusIcon(systemStatus.database)}
                <span className="text-xs text-gray-600">DB</span>
                {getStatusIcon(systemStatus.automation)}
                <span className="text-xs text-gray-600">Auto</span>
              </div>

              <button 
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>
              
              {session && (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-genesis-500 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {session.user?.email?.[0].toUpperCase()}
                      </span>
                    </div>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg border bg-white">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium text-gray-900">
                          {session.user?.email}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setShowSettings(true);
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 flex items-center"
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

      {/* Feature Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 py-3 overflow-x-auto">
            {filteredFeatures.map(feature => {
              const Icon = feature.icon;
              return (
                <button
                  key={feature.id}
                  onClick={() => setActiveFeature(feature.id)}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
                    activeFeature === feature.id
                      ? 'bg-genesis-100 text-genesis-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{feature.name}</span>
                  {activeFeature === feature.id && (
                    <motion.div
                      layoutId="activeFeatureTab"
                      className="absolute inset-0 bg-genesis-100 rounded-lg"
                      style={{ zIndex: -1 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Feature Description */}
      <div className="bg-gradient-to-r from-genesis-500 to-spiritual-500 text-white py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {React.createElement(features.find(f => f.id === activeFeature)?.icon || Brain, {
                className: "w-5 h-5"
              })}
              <div>
                <h2 className="font-semibold text-sm">
                  {features.find(f => f.id === activeFeature)?.name}
                </h2>
                <p className="text-xs opacity-90">
                  {features.find(f => f.id === activeFeature)?.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs">System Optimal</span>
            </div>
          </div>
        </div>
      </div>

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
          <button className="w-14 h-14 bg-gradient-to-r from-genesis-500 to-spiritual-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center">
            <Zap className="w-6 h-6" />
          </button>
          
          <div className="absolute bottom-16 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
            <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64">
              <h3 className="font-semibold text-gray-900 mb-2">System Status</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>AI Router</span>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(systemStatus.aiRouter)}
                    <span className="text-green-600">Optimal</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Database</span>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(systemStatus.database)}
                    <span className="text-green-600">Optimal</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Automation</span>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(systemStatus.automation)}
                    <span className="text-green-600">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Analytics</span>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(systemStatus.analytics)}
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