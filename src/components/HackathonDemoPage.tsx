import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Zap, 
  Globe, 
  TrendingUp, 
  Users,
  ArrowRight,
  CheckCircle,
  Shield,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

export const HackathonDemoPage: React.FC = () => {
  const handleContactSales = () => {
    toast.success('Sales inquiry received. Our team will contact you shortly.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-genesis-50 via-white to-spiritual-50">
      {/* Hero Section */}
      <header className="bg-white shadow-xl border-b border-gray-200">
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
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-br from-genesis-500 to-spiritual-500 rounded-xl overflow-hidden shadow-xl mb-12"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            <div className="text-white space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-4xl font-bold">
                  Genesis Heritage Pro
                </h1>
                <p className="text-xl mt-2 opacity-90">
                  AI-Powered Business Automation with Cultural Intelligence
                </p>
              </motion.div>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-lg opacity-90"
              >
                The world's first culturally-intelligent AI platform that combines business automation with heritage preservation.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap gap-4"
              >
                <button
                  onClick={() => toast.success('Demo request received')}
                  className="px-6 py-3 bg-white text-genesis-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Request Demo
                </button>
                
                <button
                  onClick={handleContactSales}
                  className="px-6 py-3 bg-spiritual-600 text-white rounded-lg hover:bg-spiritual-700 transition-colors font-medium"
                >
                  Contact Sales
                </button>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="flex items-center space-x-2 text-sm"
              >
                <div className="flex -space-x-2">
                  <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="User" className="w-8 h-8 rounded-full border-2 border-white" />
                  <img src="https://randomuser.me/api/portraits/men/86.jpg" alt="User" className="w-8 h-8 rounded-full border-2 border-white" />
                  <img src="https://randomuser.me/api/portraits/women/24.jpg" alt="User" className="w-8 h-8 rounded-full border-2 border-white" />
                </div>
                <span className="opacity-90">Trusted by 500+ companies worldwide</span>
              </motion.div>
            </div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center justify-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-genesis-500/30 to-spiritual-500/30 rounded-lg blur-xl"></div>
                <div className="relative bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-lg">
                  <div className="flex items-center space-x-3 mb-4">
                    <Brain className="w-8 h-8 text-genesis-600" />
                    <h3 className="text-xl font-bold text-gray-900">Enterprise ROI</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Time Saved</span>
                      <span className="font-bold text-gray-900">1,240 hours/month</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Cost Savings</span>
                      <span className="font-bold text-gray-900">$62,000/month</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">ROI</span>
                      <span className="font-bold text-gray-900">387%</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Payback Period</span>
                      <span className="font-bold text-gray-900">3.1 months</span>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={() => toast.success('ROI calculator opened')}
                        className="w-full flex items-center justify-center px-4 py-2 bg-genesis-600 text-white rounded-lg hover:bg-genesis-700 transition-colors"
                      >
                        <span>Calculate Your ROI</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Features Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Key Features</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform combines AI-powered business automation with cultural heritage preservation
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
            >
              <Zap className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Automation</h3>
              <p className="text-gray-600">
                Intelligent workflows that understand your business context and optimize automatically
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Natural language workflow creation</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Multi-model AI routing system</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Predictive business intelligence</span>
                </li>
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
            >
              <Globe className="w-12 h-12 text-purple-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Cultural Intelligence</h3>
              <p className="text-gray-600">
                Preserve and integrate cultural heritage into modern business operations
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Heritage-aware business practices</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Cultural context in communications</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Tradition preservation tools</span>
                </li>
              </ul>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
            >
              <Shield className="w-12 h-12 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Enterprise Security</h3>
              <p className="text-gray-600">
                Bank-level data protection with end-to-end encryption
              </p>
              <ul className="mt-4 space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">End-to-end encryption</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Role-based access control</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Compliance with GDPR/CCPA</span>
                </li>
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Pricing</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Flexible plans for businesses of all sizes
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm"
            >
              <div className="p-6 bg-gray-50">
                <h3 className="text-xl font-semibold text-gray-900">Starter</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">$99</span>
                  <span className="ml-1 text-xl text-gray-500">/month</span>
                </div>
                <p className="mt-2 text-gray-600">For small businesses getting started</p>
              </div>
              
              <div className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">5 active workflows</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Basic cultural tools</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Email support</span>
                  </li>
                </ul>
                
                <button
                  onClick={() => toast.success('Starter plan selected!')}
                  className="w-full mt-6 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Get Started
                </button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl overflow-hidden border-2 border-spiritual-200 shadow-lg relative"
            >
              <div className="absolute top-0 right-0">
                <div className="bg-spiritual-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  POPULAR
                </div>
              </div>
              
              <div className="p-6 bg-gradient-to-r from-genesis-50 to-spiritual-50">
                <h3 className="text-xl font-semibold text-gray-900">Professional</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">$499</span>
                  <span className="ml-1 text-xl text-gray-500">/month</span>
                </div>
                <p className="mt-2 text-gray-600">For growing businesses</p>
              </div>
              
              <div className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-spiritual-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Unlimited workflows</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-spiritual-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Advanced cultural tools</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-spiritual-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Priority support</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-spiritual-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Team collaboration (5 users)</span>
                  </li>
                </ul>
                
                <button
                  onClick={() => toast.success('Professional plan selected!')}
                  className="w-full mt-6 px-4 py-2 bg-gradient-to-r from-genesis-500 to-spiritual-500 text-white rounded-lg hover:from-genesis-600 hover:to-spiritual-600 transition-colors"
                >
                  Upgrade Now
                </button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm"
            >
              <div className="p-6 bg-gray-900 text-white">
                <h3 className="text-xl font-semibold">Enterprise</h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-bold">$2,999</span>
                  <span className="ml-1 text-xl opacity-75">/month</span>
                </div>
                <p className="mt-2 opacity-75">For large organizations</p>
              </div>
              
              <div className="p-6">
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Unlimited everything</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Custom AI model training</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">Dedicated account manager</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">SLA with 99.9% uptime</span>
                  </li>
                </ul>
                
                <button
                  onClick={() => toast.success('Enterprise inquiry received!')}
                  className="w-full mt-6 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center"
                >
                  <span>Contact Sales</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 text-white shadow-xl">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
              <p className="text-lg opacity-90 mb-8">
                Join the 500+ companies already using Genesis Heritage Pro to automate their operations while honoring their cultural heritage.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <button
                onClick={() => toast.success('Demo request received')}
                className="px-6 py-3 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Request Demo
              </button>
              
              <button
                onClick={handleContactSales}
                className="px-6 py-3 bg-gradient-to-r from-genesis-500 to-spiritual-500 text-white rounded-lg hover:from-genesis-600 hover:to-spiritual-600 transition-colors font-medium"
              >
                Contact Enterprise Sales
              </button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8 text-sm opacity-80"
            >
              <p>
                Genesis Heritage Pro — Automate your business and unlock your roots
              </p>
              <p className="mt-1">
                Target Valuation: $37M
              </p>
            </motion.div>
          </div>
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
    </div>
  );
};

export default HackathonDemoPage;