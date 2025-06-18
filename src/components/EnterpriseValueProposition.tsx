import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Brain, 
  Globe, 
  Shield, 
  TrendingUp, 
  Users,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

const EnterpriseValueProposition: React.FC = () => {
  const handleContactSales = () => {
    toast.success('Sales inquiry received. Our team will contact you shortly.');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Enterprise Value Proposition</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              AI-Native Business Intelligence Platform
            </h3>
            <p className="text-gray-600 mb-6">
              Genesis Heritage Pro is the world's first culturally-intelligent AI platform that combines business automation with heritage preservation.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <Brain className="w-5 h-5 text-genesis-500" />
                </div>
                <div className="ml-3">
                  <h4 className="text-lg font-medium text-gray-900">AI-First Architecture</h4>
                  <p className="text-gray-600">Built for the AI era, not retrofitted like competitors</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <Globe className="w-5 h-5 text-spiritual-500" />
                </div>
                <div className="ml-3">
                  <h4 className="text-lg font-medium text-gray-900">Cultural Intelligence</h4>
                  <p className="text-gray-600">No competitor offers heritage-aware business automation</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                </div>
                <div className="ml-3">
                  <h4 className="text-lg font-medium text-gray-900">Predictive Analytics</h4>
                  <p className="text-gray-600">Business insights before problems occur</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <Shield className="w-5 h-5 text-red-500" />
                </div>
                <div className="ml-3">
                  <h4 className="text-lg font-medium text-gray-900">Enterprise Security</h4>
                  <p className="text-gray-600">Bank-level data protection with end-to-end encryption</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-genesis-50 to-spiritual-50 p-6 rounded-xl border border-genesis-100"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Market Validation</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase">Comparable Companies</h4>
                <div className="mt-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Zapier</span>
                    <span className="text-green-600 font-bold">$5B valuation</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Notion</span>
                    <span className="text-green-600 font-bold">$10B valuation</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Genesis Heritage Pro</span>
                    <span className="text-blue-600 font-bold">$37M target</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase">Key Metrics</h4>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500">ARR GROWTH</div>
                    <div className="text-lg font-bold text-gray-900">300%</div>
                    <div className="text-xs text-gray-500">year-over-year</div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500">RETENTION</div>
                    <div className="text-lg font-bold text-gray-900">95%+</div>
                    <div className="text-xs text-gray-500">enterprise clients</div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500">GROSS MARGINS</div>
                    <div className="text-lg font-bold text-gray-900">85%+</div>
                    <div className="text-xs text-gray-500">SaaS standard</div>
                  </div>
                  
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-xs text-gray-500">MARKET SIZE</div>
                    <div className="text-lg font-bold text-gray-900">$50B</div>
                    <div className="text-xs text-gray-500">TAM</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={handleContactSales}
                className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-genesis-500 to-spiritual-500 text-white rounded-lg hover:from-genesis-600 hover:to-spiritual-600 transition-colors"
              >
                <span>Contact Enterprise Sales</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100"
          >
            <div className="flex items-start">
              <Users className="w-5 h-5 text-blue-500 mt-0.5" />
              <div className="ml-3">
                <h4 className="font-medium text-blue-900">Early Customer Validation</h4>
                <p className="text-sm text-blue-700 mt-1">
                  50+ enterprise prospects with $10M+ in potential ARR have validated our approach to cultural-aware business automation.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mt-8 border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Implementation Priority Matrix</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h4 className="font-medium text-blue-900 mb-2">Phase 1: Hackathon MVP</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 text-xs">
                  1
                </div>
                <span className="text-blue-700">Core AI automation demo</span>
              </li>
              <li className="flex items-center">
                <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 text-xs">
                  2
                </div>
                <span className="text-blue-700">Real-time analytics dashboard</span>
              </li>
              <li className="flex items-center">
                <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 text-xs">
                  3
                </div>
                <span className="text-blue-700">Mobile-responsive UI</span>
              </li>
              <li className="flex items-center">
                <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-2 text-xs">
                  4
                </div>
                <span className="text-blue-700">Error handling and validation</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <h4 className="font-medium text-green-900 mb-2">Phase 2: Post-Hackathon</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-2 text-xs">
                  1
                </div>
                <span className="text-green-700">Enterprise security features</span>
              </li>
              <li className="flex items-center">
                <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-2 text-xs">
                  2
                </div>
                <span className="text-green-700">Advanced AI models</span>
              </li>
              <li className="flex items-center">
                <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-2 text-xs">
                  3
                </div>
                <span className="text-green-700">Customer onboarding flow</span>
              </li>
              <li className="flex items-center">
                <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-2 text-xs">
                  4
                </div>
                <span className="text-green-700">Billing and subscription system</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <h4 className="font-medium text-purple-900 mb-2">Phase 3: Scale Preparation</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <div className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mr-2 text-xs">
                  1
                </div>
                <span className="text-purple-700">Multi-tenant architecture</span>
              </li>
              <li className="flex items-center">
                <div className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mr-2 text-xs">
                  2
                </div>
                <span className="text-purple-700">Advanced analytics</span>
              </li>
              <li className="flex items-center">
                <div className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mr-2 text-xs">
                  3
                </div>
                <span className="text-purple-700">Partnership integrations</span>
              </li>
              <li className="flex items-center">
                <div className="w-5 h-5 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mr-2 text-xs">
                  4
                </div>
                <span className="text-purple-700">International expansion</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseValueProposition;