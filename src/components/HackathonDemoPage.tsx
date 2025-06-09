import React, { useState } from 'react';
import { motion } from 'framer-motion';
import EnterpriseHeader from './EnterpriseHeader';
import EnterpriseFeatureNav from './EnterpriseFeatureNav';
import EnterpriseFeatureBanner from './EnterpriseFeatureBanner';
import HackathonLandingPage from './HackathonLandingPage';
import { AutomationFlow } from './AutomationFlow';
import { FlowBuilder } from './FlowBuilder';
import { AdvancedAnalyticsDashboard } from './AdvancedAnalyticsDashboard';
import { Chat } from './Chat';
import { 
  Brain, 
  BarChart3, 
  TrendingUp,
  Workflow,
  Calculator,
  PresentationScreen,
  Home
} from 'lucide-react';

const features = [
  {
    id: 'landing',
    name: 'Hackathon Pitch',
    icon: Home,
    component: HackathonLandingPage,
    description: 'Complete hackathon presentation',
    category: 'core'
  },
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
          <Chat
            userName="Enterprise User"
            ancestry="European and Asian heritage"
            businessGoals="Automate marketing and preserve cultural knowledge"
          />
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
    id: 'demo',
    name: 'Interactive Demo',
    icon: PresentationScreen,
    component: () => (
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <PresentationScreen className="w-6 h-6 text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900">Hackathon Demo Instructions</h2>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
              <h3 className="font-medium text-blue-900 mb-3">Demo Flow (8 minutes)</h3>
              <ol className="space-y-3">
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div className="ml-3">
                    <p className="text-blue-800 font-medium">Problem Statement (1 min)</p>
                    <p className="text-blue-700 text-sm">Show real business pain points</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div className="ml-3">
                    <p className="text-blue-800 font-medium">AI Solution (3 mins)</p>
                    <p className="text-blue-700 text-sm">Live automation creation</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div className="ml-3">
                    <p className="text-blue-800 font-medium">Cultural Intelligence (2 mins)</p>
                    <p className="text-blue-700 text-sm">Heritage-aware recommendations</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    4
                  </div>
                  <div className="ml-3">
                    <p className="text-blue-800 font-medium">Business Impact (2 mins)</p>
                    <p className="text-blue-700 text-sm">ROI calculations and predictions</p>
                  </div>
                </li>
              </ol>
            </div>
            
            <div className="bg-green-50 p-5 rounded-lg border border-green-100">
              <h3 className="font-medium text-green-900 mb-3">Technical Wow Factors</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                  <span className="text-green-800">Sub-second AI responses with streaming</span>
                </li>
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                  <span className="text-green-800">Real-time collaborative editing with conflict resolution</span>
                </li>
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                  <span className="text-green-800">Predictive analytics dashboard with cultural context</span>
                </li>
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                  <span className="text-green-800">Mobile-responsive PWA with offline capabilities</span>
                </li>
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                  <span className="text-green-800">Circuit breaker pattern for resilient AI operations</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-amber-50 p-5 rounded-lg border border-amber-100">
              <h3 className="font-medium text-amber-900 mb-3">Winning Criteria Alignment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-amber-800 mb-2">Technical Excellence (30%)</h4>
                  <div className="w-full bg-amber-200 rounded-full h-2.5">
                    <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-amber-800 mb-2">Innovation (25%)</h4>
                  <div className="w-full bg-amber-200 rounded-full h-2.5">
                    <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '98%' }}></div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-amber-800 mb-2">Market Potential (25%)</h4>
                  <div className="w-full bg-amber-200 rounded-full h-2.5">
                    <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '90%' }}></div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-amber-800 mb-2">Execution (20%)</h4>
                  <div className="w-full bg-amber-200 rounded-full h-2.5">
                    <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    description: 'Hackathon presentation guide',
    category: 'core'
  }
];

export const HackathonDemoPage: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState('landing');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const ActiveComponent = features.find(f => f.id === activeFeature)?.component || features[0].component;
  const activeFeatureData = features.find(f => f.id === activeFeature) || features[0];

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
    </div>
  );
};

export default HackathonDemoPage;