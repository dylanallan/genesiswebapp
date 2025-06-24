import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Shield, 
  Zap, 
  Globe, 
  BarChart3,
  Settings,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Target,
  Clock,
  Activity,
  Sparkles,
  Rocket,
  Crown,
  Award,
  Lightbulb,
  PieChart,
  LineChart,
  Calendar,
  Star,
  Heart,
  BookOpen,
  Compass,
  Layers,
  Cpu,
  Database,
  Network,
  Cloud,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Download,
  Upload,
  RefreshCw,
  RotateCcw,
  Maximize2,
  Minimize2,
  Share2,
  Copy,
  ExternalLink,
  Filter,
  Search,
  Plus,
  Minus,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

interface CulturalIntelligenceScore {
  overall: number;
  heritage: number;
  business: number;
  automation: number;
  innovation: number;
}

interface BusinessImpact {
  revenueIncrease: number;
  timeSaved: number;
  efficiencyGain: number;
  customerSatisfaction: number;
  marketExpansion: number;
}

interface AIInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'trend' | 'optimization';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number;
  category: string;
  timestamp: Date;
  actionable: boolean;
}

export const EnterpriseEnhancements: React.FC = () => {
  const [culturalScore, setCulturalScore] = useState<CulturalIntelligenceScore>({
    overall: 87,
    heritage: 92,
    business: 85,
    automation: 89,
    innovation: 91
  });

  const [businessImpact, setBusinessImpact] = useState<BusinessImpact>({
    revenueIncrease: 47,
    timeSaved: 1240,
    efficiencyGain: 73,
    customerSatisfaction: 94,
    marketExpansion: 156
  });

  const [aiInsights, setAiInsights] = useState<AIInsight[]>([
    {
      id: '1',
      type: 'opportunity',
      title: 'Cultural Market Expansion',
      description: 'Your heritage data shows strong potential in the Asian market segment. Consider launching targeted campaigns.',
      impact: 'high',
      confidence: 94,
      category: 'market-expansion',
      timestamp: new Date(),
      actionable: true
    },
    {
      id: '2',
      type: 'optimization',
      title: 'Automation Workflow Enhancement',
      description: 'AI detected 3 redundant steps in your marketing automation. Potential 23% efficiency gain.',
      impact: 'medium',
      confidence: 87,
      category: 'automation',
      timestamp: new Date(Date.now() - 3600000),
      actionable: true
    },
    {
      id: '3',
      type: 'trend',
      title: 'Heritage Interest Surge',
      description: 'Interest in cultural heritage preservation has increased 156% in your target demographic.',
      impact: 'high',
      confidence: 91,
      category: 'cultural-trends',
      timestamp: new Date(Date.now() - 7200000),
      actionable: false
    }
  ]);

  const [activeTab, setActiveTab] = useState('insights');
  const [isExpanded, setIsExpanded] = useState(false);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Crown className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Enterprise Intelligence Hub</h2>
              <p className="text-blue-100">AI-Powered Cultural & Business Insights</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'insights', name: 'AI Insights', icon: Lightbulb },
          { id: 'cultural', name: 'Cultural Intelligence', icon: Globe },
          { id: 'business', name: 'Business Impact', icon: TrendingUp },
          { id: 'automation', name: 'Automation Analytics', icon: Zap }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
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
      <div className={`${isExpanded ? 'h-[800px]' : 'h-[600px]'} overflow-y-auto`}>
        {activeTab === 'insights' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">AI-Generated Insights</h3>
              <button
                onClick={() => toast.success('Refreshing insights...')}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {aiInsights.map((insight) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border ${getImpactColor(insight.impact)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        insight.type === 'opportunity' ? 'bg-green-500' :
                        insight.type === 'risk' ? 'bg-red-500' :
                        insight.type === 'trend' ? 'bg-blue-500' : 'bg-yellow-500'
                      }`} />
                      <span className="text-sm font-medium capitalize">{insight.type}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${getConfidenceColor(insight.confidence)}`}>
                        {insight.confidence}%
                      </span>
                      {insight.actionable && (
                        <button className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200">
                          <Target className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mb-2">{insight.title}</h4>
                  <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{insight.category.replace('-', ' ')}</span>
                    <span>{insight.timestamp.toLocaleTimeString()}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cultural' && (
          <div className="p-6 space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Cultural Intelligence Score</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(culturalScore).map(([key, value]) => (
                <div key={key} className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 capitalize">
                      {key === 'overall' ? 'Overall Score' : key}
                    </h4>
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{value}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Score</span>
                      <span className="font-medium text-gray-900">{value}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">Cultural Intelligence Breakdown</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Heritage Preservation</span>
                    <span className="font-medium text-green-600">Excellent</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cultural Sensitivity</span>
                    <span className="font-medium text-green-600">Excellent</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Language Support</span>
                    <span className="font-medium text-yellow-600">Good</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Market Adaptation</span>
                    <span className="font-medium text-green-600">Excellent</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cultural Trends</span>
                    <span className="font-medium text-green-600">Excellent</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Community Engagement</span>
                    <span className="font-medium text-yellow-600">Good</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'business' && (
          <div className="p-6 space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Business Impact Metrics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(businessImpact).map(([key, value]) => (
                <div key={key} className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </h4>
                    <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {key.includes('Revenue') || key.includes('Time') || key.includes('Market') ? value : `${value}%`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current</span>
                      <span className="font-medium text-gray-900">
                        {key.includes('Revenue') ? `$${value.toLocaleString()}` :
                         key.includes('Time') ? `${value} hours` :
                         key.includes('Market') ? `${value}%` : `${value}%`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-600 to-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(value, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">ROI Analysis</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">387%</div>
                  <div className="text-sm text-gray-600">Total ROI</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">3.1</div>
                  <div className="text-sm text-gray-600">Months Payback</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">$62K</div>
                  <div className="text-sm text-gray-600">Monthly Savings</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'automation' && (
          <div className="p-6 space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Automation Analytics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-gray-900 mb-4">Active Workflows</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Marketing Automation</span>
                    <span className="font-medium text-purple-600">12 active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Customer Service</span>
                    <span className="font-medium text-purple-600">8 active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Data Processing</span>
                    <span className="font-medium text-purple-600">15 active</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Heritage Analysis</span>
                    <span className="font-medium text-purple-600">6 active</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-gray-900 mb-4">Performance Metrics</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Success Rate</span>
                    <span className="font-medium text-green-600">94.7%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Average Response Time</span>
                    <span className="font-medium text-blue-600">2.3s</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Error Rate</span>
                    <span className="font-medium text-red-600">0.3%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Uptime</span>
                    <span className="font-medium text-green-600">99.9%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-4">Recent Automation Events</h4>
              <div className="space-y-3">
                {[
                  { time: '2 min ago', event: 'Marketing campaign triggered for 1,247 users', status: 'success' },
                  { time: '5 min ago', event: 'Heritage analysis completed for Rodriguez family', status: 'success' },
                  { time: '8 min ago', event: 'Customer service ticket auto-resolved', status: 'success' },
                  { time: '12 min ago', event: 'Data backup completed successfully', status: 'success' }
                ].map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm text-gray-700">{event.event}</span>
                    </div>
                    <span className="text-xs text-gray-500">{event.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 