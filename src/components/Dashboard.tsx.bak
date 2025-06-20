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
  X,
  Brain,
  Zap,
  Camera,
  Mic,
  Video,
  BookOpen,
  Heart,
  Trees,
  Star,
  Target,
  BarChart3,
  Cpu,
  Database,
  Network,
  Shield,
  Palette,
  Music,
  Map,
  Clock,
  Award,
  Lightbulb,
  Rocket,
  TrendingUp,
  PieChart,
  Activity,
  Monitor,
  Smartphone,
  Tablet,
  Watch,
  Headphones,
  Speaker,
  Camera as CameraIcon,
  Video as VideoIcon,
  Image,
  File,
  Folder,
  Archive,
  Download,
  Upload,
  Share,
  Link,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Copy,
  Save,
  RefreshCw,
  RotateCcw,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Fullscreen,
  Grid,
  List,
  Columns,
  Rows,
  Layout,
  Sidebar,
  SidebarClose,
  SidebarOpen,
  PanelLeft,
  PanelRight,
  PanelTop,
  PanelBottom,
  Split,
  Merge,
  GitBranch,
  GitCommit,
  GitPullRequest,
  GitMerge,
  GitCompare,
  GitFork,
  Calculator,
  DollarSign,
  CreditCard,
  Table,
  Server,
  Trophy
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { EnhancedAIAssistant } from './EnhancedAIAssistant';
import UniversalSearch from './UniversalSearch';
import { DataSourceAdmin } from './DataSourceAdmin';
import { useSession } from '../lib/session-context';
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
import { FamilyTreeAnalyzer } from './FamilyTreeAnalyzer';
import { FamilyTreeVisualizer } from './FamilyTreeVisualizer';
import { VoiceAgent } from './VoiceAgent';
import { MediaGallery } from './MediaGallery';
import { WorkflowGenerator } from './WorkflowGenerator';
import { AISettings } from './AISettings';
import { SystemHealthMonitor } from './SystemHealthMonitor';
import { AdvancedAnalyticsDashboard } from './AdvancedAnalyticsDashboard';
import { AIUsageStats } from './AIUsageStats';
import { AIContextManager } from './AIContextManager';
import { GenesisVoiceAssistant } from './GenesisVoiceAssistant';
import { FamilyPhotoAnalyzer } from './FamilyPhotoAnalyzer';
import { DNAInsights } from './DNAInsights';
import { ConversationSummarizer } from './ConversationSummarizer';
import { ARHeritageViewer } from './ARHeritageViewer';
import { N8NIntegration } from './N8NIntegration';
import { StartupAdvisor } from './StartupAdvisor';
import { MarketingAutomation } from './MarketingAutomation';
import EnterpriseROICalculator from './EnterpriseROICalculator';
import EnterpriseValueProposition from './EnterpriseValueProposition';
import EnterpriseFeatureComparison from './EnterpriseFeatureComparison';
import EnterprisePricingPanel from './EnterprisePricingPanel';
import EnterpriseMetricsPanel from './EnterpriseMetricsPanel';
import EnterpriseDemo from './EnterpriseDemo';
import HackathonDemoPage from './HackathonDemoPage';
import HackathonLandingPage from './HackathonLandingPage';
import HackathonPitch from './HackathonPitch';
import EliteHackathonApp from './EliteHackathonApp';
import { FamilyTreeVoiceAgent } from './FamilyTreeVoiceAgent';
import { FlowBuilder } from './FlowBuilder';
import { AutomationInterface } from './AutomationInterface';
import { AutomationDashboard } from './AutomationDashboard';
import { AutomationFlow } from './AutomationFlow';
import { AIAdminDashboard } from './AIAdminDashboard';
import { AICustomInstructionsEditor } from './AICustomInstructionsEditor';
import { AIFeedbackAnalytics } from './AIFeedbackAnalytics';
import { AISystemHealth } from './AISystemHealth';
import { BackendStatusIndicator } from './BackendStatusIndicator';
import { ColorSettings } from './ColorSettings';
import { CulturalArtifactForm } from './CulturalArtifactForm';
import { DataTable } from './DataTable';
import { EmptyState } from './EmptyState';
import { LoadingSpinner } from './LoadingSpinner';
import { MetricsCard } from './MetricsCard';
import { PaymentForm } from './PaymentForm';
import { ProfileEditor } from './ProfileEditor';
import { ProfileHistoryViewer } from './ProfileHistoryViewer';
import { SEO } from './SEO';
import { SystemDashboard } from './SystemDashboard';
import { UserProfile } from './UserProfile';
import { UserSettings } from './UserSettings';
import { VideoPlayer } from './VideoPlayer';
import { VoiceCloning } from './VoiceCloning';
import { VoiceRecorder } from './VoiceRecorder';
import { AudioPlayer } from './AudioPlayer';
import { MediaPlayer } from './MediaPlayer';
import { MediaUploader } from './MediaUploader';
import { MediaDemo } from './MediaDemo';
import SettingsPanel from './Settings';

interface DashboardProps {
  onViewModeChange: (mode: 'standard' | 'enterprise' | 'hackathon') => void;
}

const features = [
  // Core System Features
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
    icon: Database,
    component: DataSourceAdmin,
    description: 'Manage data sources and integrations',
    category: 'core'
  },
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    icon: Brain,
    component: EnhancedAIAssistant,
    description: 'Advanced AI chat and assistance',
    category: 'core'
  },
  {
    id: 'voice-agent',
    name: 'Voice Agent',
    icon: Mic,
    component: VoiceAgent,
    description: 'Voice-powered AI interactions',
    category: 'core'
  },
  {
    id: 'ai-settings',
    name: 'AI Settings',
    icon: Settings,
    component: AISettings,
    description: 'Configure AI models and preferences',
    category: 'core'
  },
  {
    id: 'settings',
    name: 'System Settings',
    icon: Settings,
    component: SettingsPanel,
    description: 'Manage application settings and configuration',
    category: 'core'
  },

  // Heritage Tools
  {
    id: 'family-tree',
    name: 'Family Tree Analyzer',
    icon: Trees,
    component: FamilyTreeAnalyzer,
    description: 'Analyze and visualize family trees',
    category: 'heritage'
  },
  {
    id: 'family-tree-viz',
    name: 'Family Tree Visualizer',
    icon: Network,
    component: FamilyTreeVisualizer,
    description: 'Interactive family tree visualization',
    category: 'heritage'
  },
  {
    id: 'cultural-artifacts',
    name: 'Cultural Artifacts',
    icon: Heart,
    component: CulturalArtifactGallery,
    description: 'Manage cultural artifacts and heritage items',
    category: 'heritage'
  },
  {
    id: 'traditions',
    name: 'Traditions Manager',
    icon: BookOpen,
    component: TraditionsManager,
    description: 'Document and preserve family traditions',
    category: 'heritage'
  },
  {
    id: 'family-contacts',
    name: 'Family Contacts',
    icon: Users,
    component: FamilyContactManager,
    description: 'Manage family contact information',
    category: 'heritage'
  },
  {
    id: 'celebrations',
    name: 'Celebration Manager',
    icon: Calendar,
    component: CelebrationManager,
    description: 'Plan and track family celebrations',
    category: 'heritage'
  },
  {
    id: 'cultural-stories',
    name: 'Cultural Stories',
    icon: BookOpen,
    component: CulturalStoryLibrary,
    description: 'Preserve cultural stories and narratives',
    category: 'heritage'
  },
  {
    id: 'cultural-recipes',
    name: 'Cultural Recipes',
    icon: Heart,
    component: CulturalRecipeBook,
    description: 'Document family recipes and cooking traditions',
    category: 'heritage'
  },
  {
    id: 'family-photos',
    name: 'Family Photo Analyzer',
    icon: Camera,
    component: FamilyPhotoAnalyzer,
    description: 'AI-powered photo analysis and organization',
    category: 'heritage'
  },
  {
    id: 'dna-insights',
    name: 'DNA Insights',
    icon: Activity,
    component: DNAInsights,
    description: 'Analyze DNA data and genetic insights',
    category: 'heritage'
  },
  {
    id: 'ar-heritage',
    name: 'AR Heritage Viewer',
    icon: Eye,
    component: ARHeritageViewer,
    description: 'Augmented reality heritage exploration',
    category: 'heritage'
  },
  {
    id: 'family-tree-voice',
    name: 'Family Tree Voice Agent',
    icon: Mic,
    component: FamilyTreeVoiceAgent,
    description: 'Voice-controlled family tree navigation',
    category: 'heritage'
  },

  // Business Tools
  {
    id: 'automation-hub',
    name: 'Automation Hub',
    icon: Zap,
    component: AutomationHub,
    description: 'Business process automation',
    category: 'business'
  },
  {
    id: 'workflow-generator',
    name: 'Workflow Generator',
    icon: GitBranch,
    component: WorkflowGenerator,
    description: 'Generate automated workflows',
    category: 'business'
  },
  {
    id: 'n8n-integration',
    name: 'N8N Integration',
    icon: Network,
    component: N8NIntegration,
    description: 'Connect with N8N automation platform',
    category: 'business'
  },
  {
    id: 'startup-advisor',
    name: 'Startup Advisor',
    icon: Rocket,
    component: StartupAdvisor,
    description: 'AI-powered startup guidance',
    category: 'business'
  },
  {
    id: 'marketing-automation',
    name: 'Marketing Automation',
    icon: TrendingUp,
    component: MarketingAutomation,
    description: 'Automate marketing campaigns',
    category: 'business'
  },
  {
    id: 'enterprise-roi',
    name: 'Enterprise ROI Calculator',
    icon: Calculator,
    component: EnterpriseROICalculator,
    description: 'Calculate return on investment',
    category: 'business'
  },
  {
    id: 'enterprise-value',
    name: 'Enterprise Value Proposition',
    icon: Target,
    component: EnterpriseValueProposition,
    description: 'Define enterprise value propositions',
    category: 'business'
  },
  {
    id: 'enterprise-features',
    name: 'Enterprise Feature Comparison',
    icon: BarChart3,
    component: EnterpriseFeatureComparison,
    description: 'Compare enterprise features',
    category: 'business'
  },
  {
    id: 'enterprise-pricing',
    name: 'Enterprise Pricing Panel',
    icon: DollarSign,
    component: EnterprisePricingPanel,
    description: 'Manage enterprise pricing',
    category: 'business'
  },
  {
    id: 'enterprise-metrics',
    name: 'Enterprise Metrics Panel',
    icon: PieChart,
    component: EnterpriseMetricsPanel,
    description: 'Track enterprise metrics',
    category: 'business'
  },
  {
    id: 'enterprise-demo',
    name: 'Enterprise Demo',
    icon: Monitor,
    component: EnterpriseDemo,
    description: 'Enterprise demonstration platform',
    category: 'business'
  },
  {
    id: 'automation-interface',
    name: 'Automation Interface',
    icon: Cpu,
    component: AutomationInterface,
    description: 'Advanced automation interface',
    category: 'business'
  },
  {
    id: 'automation-dashboard',
    name: 'Automation Dashboard',
    icon: Activity,
    component: AutomationDashboard,
    description: 'Monitor automation performance',
    category: 'business'
  },
  {
    id: 'automation-flow',
    name: 'Automation Flow',
    icon: GitBranch,
    component: AutomationFlow,
    description: 'Design automation flows',
    category: 'business'
  },
  {
    id: 'flow-builder',
    name: 'Flow Builder',
    icon: GitMerge,
    component: FlowBuilder,
    description: 'Visual flow builder',
    category: 'business'
  },

  // Media & Content
  {
    id: 'media-gallery',
    name: 'Media Gallery',
    icon: Image,
    component: MediaGallery,
    description: 'Organize and display media content',
    category: 'media'
  },
  {
    id: 'video-player',
    name: 'Video Player',
    icon: Video,
    component: VideoPlayer,
    description: 'Advanced video playback',
    category: 'media'
  },
  {
    id: 'audio-player',
    name: 'Audio Player',
    icon: Music,
    component: AudioPlayer,
    description: 'Audio playback and management',
    category: 'media'
  },
  {
    id: 'media-player',
    name: 'Media Player',
    icon: Play,
    component: MediaPlayer,
    description: 'Universal media player',
    category: 'media'
  },
  {
    id: 'media-uploader',
    name: 'Media Uploader',
    icon: Upload,
    component: MediaUploader,
    description: 'Upload and manage media files',
    category: 'media'
  },
  {
    id: 'media-demo',
    name: 'Media Demo',
    icon: Camera,
    component: MediaDemo,
    description: 'Media functionality demonstration',
    category: 'media'
  },
  {
    id: 'voice-recorder',
    name: 'Voice Recorder',
    icon: Mic,
    component: VoiceRecorder,
    description: 'Record and manage voice content',
    category: 'media'
  },
  {
    id: 'voice-cloning',
    name: 'Voice Cloning',
    icon: Copy,
    component: VoiceCloning,
    description: 'AI voice cloning technology',
    category: 'media'
  },
  {
    id: 'genesis-voice',
    name: 'Genesis Voice Assistant',
    icon: Speaker,
    component: GenesisVoiceAssistant,
    description: 'Advanced voice assistant',
    category: 'media'
  },

  // Analytics & Monitoring
  {
    id: 'advanced-analytics',
    name: 'Advanced Analytics',
    icon: BarChart3,
    component: AdvancedAnalyticsDashboard,
    description: 'Comprehensive analytics dashboard',
    category: 'analytics'
  },
  {
    id: 'system-health',
    name: 'System Health Monitor',
    icon: Activity,
    component: SystemHealthMonitor,
    description: 'Monitor system performance',
    category: 'analytics'
  },
  {
    id: 'ai-usage-stats',
    name: 'AI Usage Statistics',
    icon: PieChart,
    component: AIUsageStats,
    description: 'Track AI usage and performance',
    category: 'analytics'
  },
  {
    id: 'ai-feedback',
    name: 'AI Feedback Analytics',
    icon: TrendingUp,
    component: AIFeedbackAnalytics,
    description: 'Analyze AI feedback and performance',
    category: 'analytics'
  },
  {
    id: 'ai-system-health',
    name: 'AI System Health',
    icon: Shield,
    component: AISystemHealth,
    description: 'Monitor AI system health',
    category: 'analytics'
  },
  {
    id: 'backend-status',
    name: 'Backend Status',
    icon: Server,
    component: BackendStatusIndicator,
    description: 'Monitor backend services',
    category: 'analytics'
  },

  // User Management
  {
    id: 'user-profile',
    name: 'User Profile',
    icon: User,
    component: UserProfile,
    description: 'Manage user profiles',
    category: 'user'
  },
  {
    id: 'user-settings',
    name: 'User Settings',
    icon: Settings,
    component: UserSettings,
    description: 'User preferences and settings',
    category: 'user'
  },
  {
    id: 'user-profile-manager',
    name: 'User Profile Manager',
    icon: Users,
    component: UserProfileManager,
    description: 'Advanced user profile management',
    category: 'user'
  },
  {
    id: 'profile-editor',
    name: 'Profile Editor',
    icon: Edit,
    component: ProfileEditor,
    description: 'Edit user profiles',
    category: 'user'
  },
  {
    id: 'profile-history',
    name: 'Profile History',
    icon: Clock,
    component: ProfileHistoryViewer,
    description: 'View profile change history',
    category: 'user'
  },

  // AI & Context Management
  {
    id: 'ai-context',
    name: 'AI Context Manager',
    icon: Brain,
    component: AIContextManager,
    description: 'Manage AI conversation context',
    category: 'ai'
  },
  {
    id: 'ai-custom-instructions',
    name: 'AI Custom Instructions',
    icon: FileText,
    component: AICustomInstructionsEditor,
    description: 'Edit AI custom instructions',
    category: 'ai'
  },
  {
    id: 'ai-admin',
    name: 'AI Admin Dashboard',
    icon: Shield,
    component: AIAdminDashboard,
    description: 'Administer AI systems',
    category: 'ai'
  },
  {
    id: 'conversation-summarizer',
    name: 'Conversation Summarizer',
    icon: FileText,
    component: ConversationSummarizer,
    description: 'Summarize conversations',
    category: 'ai'
  },

  // Timeline & Organization
  {
    id: 'timeline-builder',
    name: 'Timeline Builder',
    icon: Clock,
    component: TimelineBuilder,
    description: 'Build interactive timelines',
    category: 'timeline'
  },

  // Hackathon Features
  {
    id: 'hackathon-demo',
    name: 'Hackathon Demo',
    icon: Rocket,
    component: HackathonDemoPage,
    description: 'Hackathon demonstration page',
    category: 'hackathon'
  },
  {
    id: 'hackathon-landing',
    name: 'Hackathon Landing',
    icon: Star,
    component: HackathonLandingPage,
    description: 'Hackathon landing page',
    category: 'hackathon'
  },
  {
    id: 'hackathon-pitch',
    name: 'Hackathon Pitch',
    icon: Award,
    component: HackathonPitch,
    description: 'Hackathon pitch presentation',
    category: 'hackathon'
  },
  {
    id: 'elite-hackathon',
    name: 'Elite Hackathon App',
    icon: Trophy,
    component: EliteHackathonApp,
    description: 'Elite hackathon application',
    category: 'hackathon'
  },

  // Additional Tools
  {
    id: 'system-dashboard',
    name: 'System Dashboard',
    icon: Monitor,
    component: SystemDashboard,
    description: 'System overview dashboard',
    category: 'tools'
  },
  {
    id: 'color-settings',
    name: 'Color Settings',
    icon: Palette,
    component: ColorSettings,
    description: 'Customize color schemes',
    category: 'tools'
  },
  {
    id: 'cultural-artifact-form',
    name: 'Cultural Artifact Form',
    icon: Edit,
    component: CulturalArtifactForm,
    description: 'Add cultural artifacts',
    category: 'tools'
  },
  {
    id: 'data-table',
    name: 'Data Table',
    icon: Table,
    component: DataTable,
    description: 'Interactive data tables',
    category: 'tools'
  },
  {
    id: 'payment-form',
    name: 'Payment Form',
    icon: CreditCard,
    component: PaymentForm,
    description: 'Process payments',
    category: 'tools'
  },
  {
    id: 'seo',
    name: 'SEO Tools',
    icon: Search,
    component: SEO,
    description: 'Search engine optimization',
    category: 'tools'
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: Settings,
    component: SettingsPanel,
    description: 'Manage application settings',
    category: 'tools'
  }
];

export const Dashboard: React.FC<DashboardProps> = ({ onViewModeChange }) => {
  const { session } = useSession();
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
    { id: 'business', name: 'Business Tools', icon: Zap },
    { id: 'media', name: 'Media & Content', icon: Camera },
    { id: 'analytics', name: 'Analytics & Monitoring', icon: BarChart3 },
    { id: 'user', name: 'User Management', icon: Users },
    { id: 'ai', name: 'AI & Context', icon: Brain },
    { id: 'timeline', name: 'Timeline & Organization', icon: Clock },
    { id: 'hackathon', name: 'Hackathon Features', icon: Rocket },
    { id: 'tools', name: 'Additional Tools', icon: Settings }
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

      {/* Category Filter */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 py-3 overflow-x-auto scrollbar-hide">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <motion.button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-white text-genesis-700 shadow-sm border border-gray-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className={`w-4 h-4 ${selectedCategory === category.id ? 'text-genesis-600' : ''}`} />
                  <span className="text-sm font-medium">{category.name}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

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