import React from 'react';
import { motion } from 'framer-motion';
import { 
  Check, 
  Zap, 
  Users, 
  Database, 
  Globe, 
  Lock, 
  Crown,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

const EnterprisePricingPanel: React.FC = () => {
  const handleUpgrade = (plan: string) => {
    toast.success(`Upgrade request for ${plan} plan received. Our team will contact you shortly.`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Crown className="w-6 h-6 text-spiritual-500" />
          <h2 className="text-xl font-semibold text-gray-900">Enterprise Pricing</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Starter Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="border border-gray-200 rounded-xl overflow-hidden"
        >
          <div className="bg-gray-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Starter</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-3xl font-bold text-gray-900">$99</span>
              <span className="ml-1 text-xl text-gray-500">/month</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">Perfect for small businesses getting started with AI automation</p>
          </div>
          
          <div className="p-6 space-y-4">
            <ul className="space-y-3">
              {[
                'Basic AI automation',
                '5 active workflows',
                '10,000 AI requests/month',
                'Email support',
                'Standard security'
              ].map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
            
            <button
              onClick={() => handleUpgrade('Starter')}
              className="w-full mt-6 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        </motion.div>

        {/* Professional Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border-2 border-spiritual-200 rounded-xl overflow-hidden relative"
        >
          <div className="absolute top-0 right-0">
            <div className="bg-spiritual-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              POPULAR
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-genesis-50 to-spiritual-50 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Professional</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-3xl font-bold text-gray-900">$499</span>
              <span className="ml-1 text-xl text-gray-500">/month</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">Advanced features for growing businesses with cultural context</p>
          </div>
          
          <div className="p-6 space-y-4">
            <ul className="space-y-3">
              {[
                'Advanced AI automation',
                'Unlimited workflows',
                '50,000 AI requests/month',
                'Cultural heritage tools',
                'Priority support',
                'Advanced security',
                'Team collaboration (5 users)'
              ].map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-spiritual-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
            
            <button
              onClick={() => handleUpgrade('Professional')}
              className="w-full mt-6 px-4 py-2 bg-gradient-to-r from-genesis-500 to-spiritual-500 text-white rounded-lg hover:from-genesis-600 hover:to-spiritual-600 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </motion.div>

        {/* Enterprise Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border border-gray-200 rounded-xl overflow-hidden"
        >
          <div className="bg-gray-900 p-6 text-white">
            <h3 className="text-lg font-semibold">Enterprise</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-3xl font-bold">$2,999</span>
              <span className="ml-1 text-xl opacity-75">/month</span>
            </div>
            <p className="mt-2 text-sm opacity-75">Full-featured solution for large organizations with custom needs</p>
          </div>
          
          <div className="p-6 space-y-4">
            <ul className="space-y-3">
              {[
                'Full AI automation suite',
                'Unlimited everything',
                'Custom AI model training',
                'Complete cultural heritage suite',
                'Dedicated account manager',
                'Enterprise-grade security',
                'SSO & advanced user management',
                'Custom integrations',
                'SLA with 99.9% uptime'
              ].map((feature, index) => (
                <li key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-blue-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600">{feature}</span>
                </li>
              ))}
            </ul>
            
            <button
              onClick={() => handleUpgrade('Enterprise')}
              className="w-full mt-6 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center"
            >
              <span>Contact Sales</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </motion.div>
      </div>

      <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-100">
        <div className="flex items-start">
          <Zap className="w-5 h-5 text-blue-500 mr-3 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">White-label Solution Available</h4>
            <p className="text-sm text-blue-700 mt-1">
              Custom-branded solution with revenue sharing model. $50K setup + 20% revenue share.
              Perfect for agencies and enterprise partners.
            </p>
            <button
              onClick={() => handleUpgrade('White-label')}
              className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Request Information
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterprisePricingPanel;