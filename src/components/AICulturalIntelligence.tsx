import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Globe, 
  BarChart3,
  Lightbulb,
  Target,
  Clock,
  Activity,
  Sparkles,
  Crown,
  Award,
  Heart,
  BookOpen,
  Compass,
  Layers,
  Cpu,
  Database,
  Network,
  Cloud,
  Eye,
  Download,
  RefreshCw,
  Maximize2,
  Minimize2,
  Share2,
  Filter,
  Search,
  Plus,
  Star,
  Zap,
  PieChart,
  LineChart,
  Calendar,
  MapPin,
  Flag,
  Languages,
  History,
  TreePine,
  Mountain,
  Waves,
  Sun,
  Moon
} from 'lucide-react';
import { toast } from 'sonner';

interface CulturalPattern {
  id: string;
  name: string;
  description: string;
  confidence: number;
  category: string;
  impact: 'high' | 'medium' | 'low';
  region: string;
  timePeriod: string;
  relevance: number;
}

interface PredictiveInsight {
  id: string;
  title: string;
  description: string;
  probability: number;
  timeframe: string;
  category: string;
  actionable: boolean;
  businessImpact: number;
  culturalSignificance: number;
}

interface HeritageTrend {
  id: string;
  name: string;
  trend: 'rising' | 'stable' | 'declining';
  percentage: number;
  region: string;
  category: string;
  description: string;
}

export const AICulturalIntelligence: React.FC = () => {
  const [culturalPatterns, setCulturalPatterns] = useState<CulturalPattern[]>([
    {
      id: '1',
      name: 'Intergenerational Storytelling Revival',
      description: 'Strong resurgence in family oral history preservation across multiple cultures',
      confidence: 94,
      category: 'heritage-preservation',
      impact: 'high',
      region: 'Global',
      timePeriod: '2024-2025',
      relevance: 92
    },
    {
      id: '2',
      name: 'Cultural Fusion in Business',
      description: 'Increasing integration of cultural heritage in modern business practices',
      confidence: 87,
      category: 'business-integration',
      impact: 'high',
      region: 'North America',
      timePeriod: '2024-2026',
      relevance: 89
    },
    {
      id: '3',
      name: 'Digital Heritage Platforms',
      description: 'Growing demand for AI-powered cultural preservation tools',
      confidence: 91,
      category: 'technology',
      impact: 'medium',
      region: 'Global',
      timePeriod: '2024-2027',
      relevance: 85
    }
  ]);

  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[]>([
    {
      id: '1',
      title: 'Cultural Tourism Surge',
      description: 'Expected 156% increase in cultural heritage tourism by 2026',
      probability: 87,
      timeframe: '2024-2026',
      category: 'tourism',
      actionable: true,
      businessImpact: 94,
      culturalSignificance: 89
    },
    {
      id: '2',
      title: 'AI Heritage Assistant Adoption',
      description: '75% of genealogy companies will adopt AI assistants by 2025',
      probability: 92,
      timeframe: '2024-2025',
      category: 'technology',
      actionable: true,
      businessImpact: 91,
      culturalSignificance: 87
    },
    {
      id: '3',
      title: 'Cultural Education Integration',
      description: 'Schools will integrate cultural heritage into 60% of curricula by 2027',
      probability: 78,
      timeframe: '2024-2027',
      category: 'education',
      actionable: false,
      businessImpact: 76,
      culturalSignificance: 95
    }
  ]);

  const [heritageTrends, setHeritageTrends] = useState<HeritageTrend[]>([
    {
      id: '1',
      name: 'DNA Heritage Testing',
      trend: 'rising',
      percentage: 234,
      region: 'Global',
      category: 'genealogy',
      description: 'Massive growth in DNA-based heritage discovery'
    },
    {
      id: '2',
      name: 'Cultural Recipe Preservation',
      trend: 'rising',
      percentage: 167,
      region: 'Global',
      category: 'culinary',
      description: 'Growing interest in preserving traditional family recipes'
    },
    {
      id: '3',
      name: 'Voice Heritage Recording',
      trend: 'rising',
      percentage: 189,
      region: 'Global',
      category: 'technology',
      description: 'Increasing use of voice technology for heritage preservation'
    }
  ]);

  const [activeTab, setActiveTab] = useState('patterns');
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const regions = ['all', 'Global', 'North America', 'Europe', 'Asia', 'Africa', 'Latin America'];
  const categories = ['all', 'heritage-preservation', 'business-integration', 'technology', 'education', 'tourism', 'genealogy', 'culinary'];

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'rising': return 'text-green-600 bg-green-50 border-green-200';
      case 'stable': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'declining': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const filteredPatterns = culturalPatterns.filter(pattern => 
    (selectedRegion === 'all' || pattern.region === selectedRegion) &&
    (selectedCategory === 'all' || pattern.category === selectedCategory)
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Brain className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">AI Cultural Intelligence</h2>
              <p className="text-purple-100">Real-time cultural pattern recognition & predictive analytics</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => toast.success('Refreshing cultural intelligence...')}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            >
              {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-gray-600" />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {regions.map(region => (
                <option key={region} value={region}>
                  {region === 'all' ? 'All Regions' : region}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-gray-600" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'patterns', name: 'Cultural Patterns', icon: Compass },
          { id: 'predictions', name: 'Predictive Insights', icon: Lightbulb },
          { id: 'trends', name: 'Heritage Trends', icon: TrendingUp }
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
      <div className={`${isExpanded ? 'h-[800px]' : 'h-[600px]'} overflow-y-auto`}>
        {activeTab === 'patterns' && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Cultural Pattern Recognition</h3>
              <span className="text-sm text-gray-500">{filteredPatterns.length} patterns detected</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredPatterns.map((pattern) => (
                <motion.div
                  key={pattern.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg border ${getImpactColor(pattern.impact)}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        pattern.impact === 'high' ? 'bg-red-500' :
                        pattern.impact === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <span className="text-sm font-medium capitalize">{pattern.category.replace('-', ' ')}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-purple-600">
                        {pattern.confidence}%
                      </span>
                      <span className="text-xs text-gray-500">{pattern.relevance}% relevant</span>
                    </div>
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mb-2">{pattern.name}</h4>
                  <p className="text-sm text-gray-700 mb-3">{pattern.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3 h-3" />
                      <span>{pattern.region}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3 h-3" />
                      <span>{pattern.timePeriod}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="p-6 space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Predictive Insights</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {predictiveInsights.map((insight) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Lightbulb className="w-5 h-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-700 capitalize">{insight.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-purple-600">{insight.probability}%</div>
                      <div className="text-xs text-gray-500">Probability</div>
                    </div>
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mb-2">{insight.title}</h4>
                  <p className="text-sm text-gray-700 mb-4">{insight.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{insight.businessImpact}%</div>
                      <div className="text-xs text-gray-500">Business Impact</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{insight.culturalSignificance}%</div>
                      <div className="text-xs text-gray-500">Cultural Significance</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{insight.timeframe}</span>
                    {insight.actionable && (
                      <button className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200">
                        Actionable
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="p-6 space-y-6">
            <h3 className="text-xl font-semibold text-gray-900">Heritage Trends</h3>
            
            <div className="space-y-4">
              {heritageTrends.map((trend) => (
                <motion.div
                  key={trend.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 rounded-lg border ${getTrendColor(trend.trend)}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        trend.trend === 'rising' ? 'bg-green-500' :
                        trend.trend === 'stable' ? 'bg-blue-500' : 'bg-red-500'
                      }`} />
                      <h4 className="font-semibold text-gray-900">{trend.name}</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-green-600">+{trend.percentage}%</div>
                      <div className="text-xs text-gray-500 capitalize">{trend.trend}</div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-3">{trend.description}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3 h-3" />
                      <span>{trend.region}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Layers className="w-3 h-3" />
                      <span className="capitalize">{trend.category}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-900 mb-4">Trend Analysis Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">3</div>
                  <div className="text-sm text-gray-600">Rising Trends</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">196%</div>
                  <div className="text-sm text-gray-600">Average Growth</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">Global</div>
                  <div className="text-sm text-gray-600">Primary Region</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Custom icon component for Crystal Ball
const CrystalBall: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2v20" />
    <path d="M2 12h20" />
    <circle cx="12" cy="12" r="3" />
  </svg>
); 