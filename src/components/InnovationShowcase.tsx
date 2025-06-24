import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Zap, 
  Brain, 
  Heart, 
  Crown, 
  Star, 
  Award, 
  Trophy,
  Rocket,
  Lightbulb,
  Target,
  TrendingUp,
  BarChart3,
  Activity,
  Eye,
  EyeOff,
  Play,
  Pause,
  Stop,
  RefreshCw,
  Settings,
  Maximize2,
  Minimize2,
  Filter,
  Search,
  Plus,
  Minus,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  Calendar,
  DollarSign,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Globe,
  BookOpen,
  Compass,
  Map,
  Camera,
  Video,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Music,
  Image,
  FileText,
  File,
  Folder,
  Database,
  Server,
  Cloud,
  Wifi,
  WifiOff,
  Bluetooth,
  BluetoothOff,
  Battery,
  BatteryCharging,
  Power,
  PowerOff,
  Sun,
  Moon,
  CloudRain,
  CloudSnow,
  Wind,
  Thermometer,
  Droplets,
  Umbrella,
  Home,
  Building,
  Store,
  ShoppingCart,
  CreditCard,
  Wallet,
  PiggyBank,
  Coins,
  Bitcoin,
  Ethereum,
  DollarSign as DollarSignIcon,
  Euro,
  Pound,
  Yen,
  Rupee,
  Won,
  Ruble,
  Lari,
  Real,
  Peso,
  Franc,
  Krona,
  Zloty,
  Forint,
  Koruna,
  Leu,
  Lev,
  Tenge,
  Som,
  Manat,
  Dram,
  Hryvnia,
  Tugrik,
  Kyat,
  Kip,
  Riel,
  Dong,
  Baht,
  Ringgit,
  SingaporeDollar,
  HongKongDollar,
  TaiwanDollar,
  AustralianDollar,
  CanadianDollar,
  SwissFranc,
  NorwegianKrone,
  SwedishKrona,
  DanishKrone,
  IcelandicKrona,
  PolishZloty,
  CzechKoruna,
  HungarianForint,
  RomanianLeu,
  BulgarianLev,
  KazakhstaniTenge,
  KyrgyzstaniSom,
  AzerbaijaniManat,
  ArmenianDram,
  GeorgianLari,
  UkrainianHryvnia,
  MongolianTugrik,
  MyanmarKyat,
  LaoKip,
  CambodianRiel,
  VietnameseDong,
  ThaiBaht,
  MalaysianRinggit,
  SingaporeDollar as SGD,
  HongKongDollar as HKD,
  TaiwanDollar as TWD,
  AustralianDollar as AUD,
  CanadianDollar as CAD,
  SwissFranc as CHF,
  NorwegianKrone as NOK,
  SwedishKrona as SEK,
  DanishKrone as DKK,
  IcelandicKrona as ISK,
  PolishZloty as PLN,
  CzechKoruna as CZK,
  HungarianForint as HUF,
  RomanianLeu as RON,
  BulgarianLev as BGN,
  KazakhstaniTenge as KZT,
  KyrgyzstaniSom as KGS,
  AzerbaijaniManat as AZN,
  ArmenianDram as AMD,
  GeorgianLari as GEL,
  UkrainianHryvnia as UAH,
  MongolianTugrik as MNT,
  MyanmarKyat as MMK,
  LaoKip as LAK,
  CambodianRiel as KHR,
  VietnameseDong as VND,
  ThaiBaht as THB,
  MalaysianRinggit as MYR
} from 'lucide-react';
import { toast } from 'sonner';

interface InnovationFeature {
  id: string;
  name: string;
  description: string;
  category: 'ai' | 'cultural' | 'business' | 'integration' | 'future';
  impact: 'revolutionary' | 'breakthrough' | 'innovative' | 'advanced';
  status: 'live' | 'beta' | 'prototype' | 'concept';
  demoUrl?: string;
  technicalComplexity: number;
  marketPotential: number;
  culturalSignificance: number;
  businessValue: number;
  features: string[];
  technologies: string[];
  metrics: {
    accuracy: number;
    speed: number;
    scalability: number;
    userAdoption: number;
  };
  culturalContext: string;
  businessApplication: string;
  futureVision: string;
}

interface LiveDemo {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  participants: number;
  successRate: number;
  realTimeData: any;
}

interface InnovationMetric {
  name: string;
  current: number;
  target: number;
  trend: 'accelerating' | 'stable' | 'declining';
  category: string;
}

export const InnovationShowcase: React.FC = () => {
  const [innovationFeatures, setInnovationFeatures] = useState<InnovationFeature[]>([
    {
      id: '1',
      name: 'Cultural DNA Pattern Recognition',
      description: 'AI-powered analysis of cultural heritage patterns to predict business trends and user behavior',
      category: 'ai',
      impact: 'revolutionary',
      status: 'live',
      technicalComplexity: 95,
      marketPotential: 98,
      culturalSignificance: 100,
      businessValue: 96,
      features: [
        'Real-time cultural pattern analysis',
        'Predictive heritage trend modeling',
        'Cross-cultural business intelligence',
        'Automated cultural sensitivity scoring'
      ],
      technologies: [
        'Advanced Neural Networks',
        'Cultural Linguistics AI',
        'Heritage Data Mining',
        'Predictive Analytics Engine'
      ],
      metrics: {
        accuracy: 94,
        speed: 89,
        scalability: 92,
        userAdoption: 87
      },
      culturalContext: 'Preserves and analyzes cultural DNA patterns across generations',
      businessApplication: 'Predicts market trends based on cultural heritage insights',
      futureVision: 'Universal cultural intelligence platform for global business optimization'
    },
    {
      id: '2',
      name: 'Ancestral Voice Reconstruction',
      description: 'AI-powered reconstruction of ancestral voices from historical recordings and family stories',
      category: 'cultural',
      impact: 'breakthrough',
      status: 'beta',
      technicalComplexity: 88,
      marketPotential: 92,
      culturalSignificance: 100,
      businessValue: 85,
      features: [
        'Voice pattern reconstruction',
        'Emotional tone preservation',
        'Multi-language support',
        'Family story integration'
      ],
      technologies: [
        'Voice Synthesis AI',
        'Emotional Intelligence',
        'Historical Audio Processing',
        'Cultural Linguistics'
      ],
      metrics: {
        accuracy: 91,
        speed: 85,
        scalability: 88,
        userAdoption: 93
      },
      culturalContext: 'Brings ancestral voices back to life for future generations',
      businessApplication: 'Creates personalized voice experiences for customer engagement',
      futureVision: 'Complete family voice preservation and storytelling platform'
    },
    {
      id: '3',
      name: 'Heritage-Aware Business Automation',
      description: 'Business automation that respects and incorporates cultural heritage values and traditions',
      category: 'integration',
      impact: 'innovative',
      status: 'live',
      technicalComplexity: 82,
      marketPotential: 95,
      culturalSignificance: 89,
      businessValue: 94,
      features: [
        'Cultural value-based decision making',
        'Heritage-respecting automation workflows',
        'Community impact optimization',
        'Sustainable business practices'
      ],
      technologies: [
        'Cultural Intelligence Engine',
        'Ethical AI Framework',
        'Community Impact Analytics',
        'Sustainable Business Logic'
      ],
      metrics: {
        accuracy: 87,
        speed: 92,
        scalability: 89,
        userAdoption: 91
      },
      culturalContext: 'Ensures business practices honor cultural heritage and community values',
      businessApplication: 'Automates business processes while preserving cultural integrity',
      futureVision: 'Global standard for culturally-aware business automation'
    },
    {
      id: '4',
      name: 'Quantum Cultural Computing',
      description: 'Next-generation quantum computing applied to cultural heritage preservation and analysis',
      category: 'future',
      impact: 'revolutionary',
      status: 'prototype',
      technicalComplexity: 100,
      marketPotential: 99,
      culturalSignificance: 98,
      businessValue: 97,
      features: [
        'Quantum cultural pattern analysis',
        'Multi-dimensional heritage mapping',
        'Instant cultural intelligence',
        'Universal heritage preservation'
      ],
      technologies: [
        'Quantum Computing',
        'Cultural Quantum Algorithms',
        'Multi-dimensional AI',
        'Universal Heritage Database'
      ],
      metrics: {
        accuracy: 99,
        speed: 100,
        scalability: 100,
        userAdoption: 85
      },
      culturalContext: 'Preserves cultural heritage in quantum space for eternity',
      businessApplication: 'Instant cultural intelligence for real-time business decisions',
      futureVision: 'Quantum-powered cultural preservation and business optimization'
    }
  ]);

  const [liveDemos, setLiveDemos] = useState<LiveDemo[]>([
    {
      id: '1',
      name: 'Real-Time Cultural Pattern Analysis',
      description: 'Live demonstration of AI analyzing cultural patterns in real-time',
      isActive: true,
      participants: 1247,
      successRate: 94.3,
      realTimeData: {
        patternsDetected: 156,
        culturalInsights: 89,
        businessPredictions: 67,
        accuracy: 94.2
      }
    },
    {
      id: '2',
      name: 'Heritage Voice Reconstruction',
      description: 'Live demo of ancestral voice reconstruction technology',
      isActive: true,
      participants: 892,
      successRate: 91.7,
      realTimeData: {
        voicesReconstructed: 23,
        emotionalAccuracy: 89.4,
        culturalPreservation: 96.1,
        userSatisfaction: 94.8
      }
    },
    {
      id: '3',
      name: 'Cultural Business Automation',
      description: 'Live demonstration of heritage-aware business processes',
      isActive: false,
      participants: 567,
      successRate: 88.9,
      realTimeData: {
        processesAutomated: 45,
        culturalAlignment: 92.3,
        efficiencyGain: 34.7,
        communityImpact: 89.1
      }
    }
  ]);

  const [innovationMetrics, setInnovationMetrics] = useState<InnovationMetric[]>([
    {
      name: 'Innovation Velocity',
      current: 94,
      target: 100,
      trend: 'accelerating',
      category: 'Development'
    },
    {
      name: 'Cultural Impact Score',
      current: 98,
      target: 100,
      trend: 'accelerating',
      category: 'Heritage'
    },
    {
      name: 'Business Value Creation',
      current: 92,
      target: 95,
      trend: 'accelerating',
      category: 'Business'
    },
    {
      name: 'Technical Excellence',
      current: 89,
      target: 95,
      trend: 'stable',
      category: 'Technology'
    },
    {
      name: 'Market Adoption',
      current: 87,
      target: 90,
      trend: 'accelerating',
      category: 'Market'
    },
    {
      name: 'Future Readiness',
      current: 96,
      target: 100,
      trend: 'accelerating',
      category: 'Innovation'
    }
  ]);

  const [activeTab, setActiveTab] = useState('features');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedImpact, setSelectedImpact] = useState('all');

  const categories = ['all', 'ai', 'cultural', 'business', 'integration', 'future'];
  const impacts = ['all', 'revolutionary', 'breakthrough', 'innovative', 'advanced'];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'revolutionary': return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'breakthrough': return 'text-red-600 bg-red-50 border-red-200';
      case 'innovative': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'advanced': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-100 text-green-700';
      case 'beta': return 'bg-blue-100 text-blue-700';
      case 'prototype': return 'bg-yellow-100 text-yellow-700';
      case 'concept': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'accelerating': return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      case 'stable': return <Minus className="w-4 h-4 text-blue-600" />;
      case 'declining': return <ArrowDownRight className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const filteredFeatures = innovationFeatures.filter(feature => 
    (selectedCategory === 'all' || feature.category === selectedCategory) &&
    (selectedImpact === 'all' || feature.impact === selectedImpact)
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-8 h-8" />
              <Crown className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Innovation Showcase</h2>
              <p className="text-purple-100">Cutting-edge AI, cultural preservation, and business automation</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">96%</div>
            <div className="text-xs text-purple-100">Innovation Score</div>
          </div>
        </div>
      </div>

      {/* Innovation Metrics Overview */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 border-b border-purple-200">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {innovationMetrics.map((metric) => (
            <div key={metric.name} className="text-center">
              <div className="text-lg font-bold text-gray-900">{metric.current}%</div>
              <div className="text-xs text-gray-600">{metric.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-600" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-gray-600" />
            <select
              value={selectedImpact}
              onChange={(e) => setSelectedImpact(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {impacts.map(impact => (
                <option key={impact} value={impact}>
                  {impact === 'all' ? 'All Impact Levels' : impact.charAt(0).toUpperCase() + impact.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'features', name: 'Innovation Features', icon: Sparkles },
          { id: 'demos', name: 'Live Demos', icon: Play },
          { id: 'metrics', name: 'Innovation Metrics', icon: BarChart3 },
          { id: 'roadmap', name: 'Future Roadmap', icon: Rocket }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-500'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="h-[600px] overflow-y-auto">
        {activeTab === 'features' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Revolutionary Innovation Features</h3>
              <span className="text-sm text-gray-500">{filteredFeatures.length} innovations</span>
            </div>

            <div className="space-y-6">
              {filteredFeatures.map((feature) => (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-6 rounded-lg border ${getImpactColor(feature.impact)}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        feature.impact === 'revolutionary' ? 'bg-purple-500' :
                        feature.impact === 'breakthrough' ? 'bg-red-500' :
                        feature.impact === 'innovative' ? 'bg-blue-500' : 'bg-green-500'
                      }`} />
                      <span className="text-sm font-medium uppercase">{feature.category}</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}>
                        {feature.status}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">Complexity: {feature.technicalComplexity}%</span>
                    </div>
                  </div>
                  
                  <h4 className="text-xl font-bold text-gray-900 mb-3">{feature.name}</h4>
                  <p className="text-gray-700 mb-4">{feature.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-3">Key Features</h5>
                      <ul className="space-y-2">
                        {feature.features.map((feat, index) => (
                          <li key={index} className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-3">Technologies</h5>
                      <div className="flex flex-wrap gap-2">
                        {feature.technologies.map((tech, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">{feature.metrics.accuracy}%</div>
                      <div className="text-xs text-gray-600">Accuracy</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">{feature.metrics.speed}%</div>
                      <div className="text-xs text-gray-600">Speed</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">{feature.metrics.scalability}%</div>
                      <div className="text-xs text-gray-600">Scalability</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-lg font-bold text-orange-600">{feature.metrics.userAdoption}%</div>
                      <div className="text-xs text-gray-600">Adoption</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h6 className="font-medium text-blue-900 mb-1">Cultural Context</h6>
                      <p className="text-blue-800">{feature.culturalContext}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h6 className="font-medium text-green-900 mb-1">Business Application</h6>
                      <p className="text-green-800">{feature.businessApplication}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <h6 className="font-medium text-purple-900 mb-1">Future Vision</h6>
                      <p className="text-purple-800">{feature.futureVision}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'demos' && (
          <div className="p-6 space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Live Innovation Demonstrations</h3>
            
            <div className="space-y-6">
              {liveDemos.map((demo) => (
                <div key={demo.id} className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">{demo.name}</h4>
                      <p className="text-gray-700 mb-2">{demo.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${demo.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="text-sm text-gray-600">{demo.isActive ? 'Live' : 'Offline'}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{demo.participants}</div>
                      <div className="text-xs text-gray-600">Participants</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{demo.successRate}%</div>
                      <div className="text-xs text-gray-600">Success Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {demo.isActive ? '🔴' : '⚪'}
                      </div>
                      <div className="text-xs text-gray-600">Status</div>
                    </div>
                    <div className="text-center">
                      <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                        {demo.isActive ? 'Join Demo' : 'Schedule Demo'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-3">Real-Time Data</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(demo.realTimeData).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <div className="text-lg font-bold text-gray-900">{value}</div>
                          <div className="text-xs text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="p-6 space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Innovation Performance Metrics</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {innovationMetrics.map((metric) => (
                <div key={metric.name} className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">{metric.name}</h4>
                    {getTrendIcon(metric.trend)}
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${metric.current}%` }}
                          />
                        </div>
                        <span className="text-lg font-bold text-purple-600">{metric.current}%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Target</span>
                      <span className="text-sm font-medium text-gray-900">{metric.target}%</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <span className="text-xs text-gray-500 uppercase">{metric.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'roadmap' && (
          <div className="p-6 space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Future Innovation Roadmap</h3>
            
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-gray-900 mb-4">Phase 1: Quantum Cultural Computing (2024-2025)</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <h5 className="font-medium text-gray-900">Quantum Heritage Preservation</h5>
                      <p className="text-sm text-gray-600">Store cultural heritage in quantum space for eternal preservation</p>
                    </div>
                    <button className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">
                      Research
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <h5 className="font-medium text-gray-900">Multi-Dimensional Cultural Analysis</h5>
                      <p className="text-sm text-gray-600">Analyze cultural patterns across multiple dimensions simultaneously</p>
                    </div>
                    <button className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700">
                      Develop
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-gray-900 mb-4">Phase 2: Universal Cultural Intelligence (2025-2026)</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <h5 className="font-medium text-gray-900">Global Cultural Database</h5>
                      <p className="text-sm text-gray-600">Create comprehensive database of all world cultures</p>
                    </div>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                      Plan
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <h5 className="font-medium text-gray-900">AI Cultural Ambassadors</h5>
                      <p className="text-sm text-gray-600">AI systems that understand and respect all cultural contexts</p>
                    </div>
                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                      Design
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-lg border border-green-200">
                <h4 className="font-semibold text-gray-900 mb-4">Phase 3: Cultural Singularity (2026+)</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <h5 className="font-medium text-gray-900">Complete Cultural Preservation</h5>
                      <p className="text-sm text-gray-600">Preserve all cultural heritage for future generations</p>
                    </div>
                    <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                      Vision
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <h5 className="font-medium text-gray-900">Universal Cultural Harmony</h5>
                      <p className="text-sm text-gray-600">AI systems that promote cultural understanding and harmony</p>
                    </div>
                    <button className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                      Envision
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-gray-900 mb-4">Innovation Impact Projections</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">99.9%</div>
                  <div className="text-sm text-gray-600">Cultural Preservation</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">$50B+</div>
                  <div className="text-sm text-gray-600">Market Value</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">7.9B</div>
                  <div className="text-sm text-gray-600">People Impacted</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 