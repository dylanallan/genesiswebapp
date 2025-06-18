import React from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  Activity, 
  BarChart3, 
  Users, 
  Globe, 
  TrendingUp,
  Cpu,
  Zap,
  Workflow,
  ChefHat,
  Calendar,
  Dna,
  Mic,
  Camera
} from 'lucide-react';

interface Feature {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  category: string;
}

interface EnterpriseFeatureNavProps {
  features: Feature[];
  activeFeature: string;
  onFeatureChange: (featureId: string) => void;
  selectedCategory: string;
}

const EnterpriseFeatureNav: React.FC<EnterpriseFeatureNavProps> = ({
  features,
  activeFeature,
  onFeatureChange,
  selectedCategory
}) => {
  const filteredFeatures = selectedCategory === 'all' 
    ? features 
    : features.filter(f => f.category === selectedCategory);

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 py-3 overflow-x-auto scrollbar-hide">
          {filteredFeatures.map(feature => {
            const Icon = feature.icon;
            return (
              <motion.button
                key={feature.id}
                onClick={() => onFeatureChange(feature.id)}
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
  );
};

export default EnterpriseFeatureNav;