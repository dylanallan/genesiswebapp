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
import HackathonPitch from './HackathonPitch';
import EnterpriseROICalculator from './EnterpriseROICalculator';
import EnterpriseValueProposition from './EnterpriseValueProposition';

const HackathonLandingPage: React.FC = () => {
  const handleContactSales = () => {
    toast.success('Sales inquiry received. Our team will contact you shortly.');
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-br from-genesis-500 to-spiritual-500 rounded-xl overflow-hidden shadow-xl"
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

      {/* Hackathon Pitch */}
      <HackathonPitch />
      
      {/* Value Proposition */}
      <EnterpriseValueProposition />
      
      {/* ROI Calculator */}
      <EnterpriseROICalculator />
      
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
    </div>
  );
};

export default HackathonLandingPage;