import React from 'react';
import { motion } from 'framer-motion';
import { 
  Check, 
  X, 
  HelpCircle, 
  ArrowRight,
  Zap,
  Shield,
  Users,
  Database,
  Globe,
  Brain
} from 'lucide-react';
import { toast } from 'sonner';

const EnterpriseFeatureComparison: React.FC = () => {
  const handleUpgrade = () => {
    toast.success('Upgrade request received. Our team will contact you shortly.');
  };

  const features = [
    {
      category: 'AI Capabilities',
      icon: <Brain className="w-5 h-5 text-blue-500" />,
      items: [
        { name: 'AI-powered automation', starter: true, professional: true, enterprise: true },
        { name: 'Multi-model AI routing', starter: false, professional: true, enterprise: true },
        { name: 'Custom AI model training', starter: false, professional: false, enterprise: true },
        { name: 'GPT-4 & Claude 3 access', starter: false, professional: true, enterprise: true },
        { name: 'Unlimited AI requests', starter: false, professional: false, enterprise: true }
      ]
    },
    {
      category: 'Business Features',
      icon: <Zap className="w-5 h-5 text-purple-500" />,
      items: [
        { name: 'Workflow automation', starter: true, professional: true, enterprise: true },
        { name: 'Marketing automation', starter: false, professional: true, enterprise: true },
        { name: 'Advanced analytics', starter: false, professional: true, enterprise: true },
        { name: 'Custom integrations', starter: false, professional: false, enterprise: true },
        { name: 'White-label option', starter: false, professional: false, enterprise: true }
      ]
    },
    {
      category: 'Cultural Heritage',
      icon: <Globe className="w-5 h-5 text-green-500" />,
      items: [
        { name: 'Basic cultural insights', starter: true, professional: true, enterprise: true },
        { name: 'Voice preservation', starter: false, professional: true, enterprise: true },
        { name: 'AR heritage exploration', starter: false, professional: true, enterprise: true },
        { name: 'DNA analysis integration', starter: false, professional: false, enterprise: true },
        { name: 'Custom cultural AI training', starter: false, professional: false, enterprise: true }
      ]
    },
    {
      category: 'Data & Storage',
      icon: <Database className="w-5 h-5 text-amber-500" />,
      items: [
        { name: 'Data storage', starter: '10GB', professional: '100GB', enterprise: 'Unlimited' },
        { name: 'Backup frequency', starter: 'Weekly', professional: 'Daily', enterprise: 'Real-time' },
        { name: 'Data retention', starter: '30 days', professional: '1 year', enterprise: 'Unlimited' },
        { name: 'Export capabilities', starter: 'Basic', professional: 'Advanced', enterprise: 'Full' },
        { name: 'Custom data pipelines', starter: false, professional: false, enterprise: true }
      ]
    },
    {
      category: 'Security',
      icon: <Shield className="w-5 h-5 text-red-500" />,
      items: [
        { name: 'Data encryption', starter: true, professional: true, enterprise: true },
        { name: 'SSO integration', starter: false, professional: false, enterprise: true },
        { name: 'Role-based access', starter: false, professional: true, enterprise: true },
        { name: 'Audit logging', starter: false, professional: true, enterprise: true },
        { name: 'Custom security policies', starter: false, professional: false, enterprise: true }
      ]
    },
    {
      category: 'Support',
      icon: <Users className="w-5 h-5 text-blue-500" />,
      items: [
        { name: 'Support channels', starter: 'Email', professional: 'Email, Chat', enterprise: 'Email, Chat, Phone' },
        { name: 'Response time', starter: '48 hours', professional: '24 hours', enterprise: '1 hour' },
        { name: 'Dedicated account manager', starter: false, professional: false, enterprise: true },
        { name: 'Training sessions', starter: false, professional: '2/year', enterprise: 'Unlimited' },
        { name: 'SLA', starter: false, professional: false, enterprise: true }
      ]
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Zap className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Enterprise Feature Comparison</h2>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th scope="col" className="py-3 px-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                Feature
              </th>
              <th scope="col" className="py-3 px-6 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">
                Starter
                <div className="text-gray-900 font-bold mt-1">$99/month</div>
              </th>
              <th scope="col" className="py-3 px-6 text-center text-xs font-medium text-spiritual-500 uppercase tracking-wider w-1/4 bg-gradient-to-r from-genesis-50 to-spiritual-50">
                Professional
                <div className="text-gray-900 font-bold mt-1">$499/month</div>
              </th>
              <th scope="col" className="py-3 px-6 text-center text-xs font-medium text-blue-500 uppercase tracking-wider w-1/4">
                Enterprise
                <div className="text-gray-900 font-bold mt-1">$2,999/month</div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {features.map((category, categoryIndex) => (
              <React.Fragment key={categoryIndex}>
                <tr className="bg-gray-50">
                  <td colSpan={4} className="py-3 px-6">
                    <div className="flex items-center space-x-2">
                      {category.icon}
                      <span className="font-medium text-gray-900">{category.category}</span>
                    </div>
                  </td>
                </tr>
                {category.items.map((feature, featureIndex) => (
                  <tr key={`${categoryIndex}-${featureIndex}`} className="hover:bg-gray-50">
                    <td className="py-3 px-6 text-sm text-gray-900">
                      {feature.name}
                    </td>
                    <td className="py-3 px-6 text-center">
                      {typeof feature.starter === 'boolean' ? (
                        feature.starter ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-gray-700">{feature.starter}</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-center bg-gradient-to-r from-genesis-50 to-spiritual-50">
                      {typeof feature.professional === 'boolean' ? (
                        feature.professional ? (
                          <Check className="w-5 h-5 text-spiritual-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-gray-700">{feature.professional}</span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-center">
                      {typeof feature.enterprise === 'boolean' ? (
                        feature.enterprise ? (
                          <Check className="w-5 h-5 text-blue-500 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 mx-auto" />
                        )
                      ) : (
                        <span className="text-sm text-gray-700">{feature.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleUpgrade}
          className="py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Get Starter
        </button>
        <button
          onClick={handleUpgrade}
          className="py-2 px-4 bg-gradient-to-r from-genesis-500 to-spiritual-500 text-white rounded-lg hover:from-genesis-600 hover:to-spiritual-600 transition-colors"
        >
          Upgrade to Professional
        </button>
        <button
          onClick={handleUpgrade}
          className="py-2 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center"
        >
          <span>Contact Enterprise Sales</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={() => toast.success('Custom quote request received')}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Need a custom plan? Get a personalized quote
        </button>
      </div>
    </div>
  );
};

export default EnterpriseFeatureComparison;