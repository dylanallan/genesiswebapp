import React from 'react';
import { motion } from 'framer-motion';

interface EnterpriseFeatureBannerProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const EnterpriseFeatureBanner: React.FC<EnterpriseFeatureBannerProps> = ({
  title,
  description,
  icon
}) => {
  return (
    <div className="bg-gradient-to-r from-genesis-500 to-spiritual-500 text-white py-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <motion.div 
            className="flex items-center space-x-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {icon}
            <div>
              <h2 className="font-semibold text-lg">{title}</h2>
              <p className="text-sm opacity-90">{description}</p>
            </div>
          </motion.div>
          
          <motion.div 
            className="flex items-center space-x-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center space-x-1 px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span>Enterprise Ready</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseFeatureBanner;