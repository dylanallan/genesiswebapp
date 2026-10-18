import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { t, useLang } from '../lib/i18n';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className
}) => {
  useLang();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-lg border border-gray-200",
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-gray-400 mb-4 shadow-sm"
      >
        {icon}
      </motion.div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">{t(title)}</h3>
      <p className="text-gray-500 mb-6 max-w-md">{t(description)}</p>
      
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-genesis-600 text-white rounded-lg hover:bg-genesis-700 transition-colors"
        >
          {t(action.label)}
        </button>
      )}
    </motion.div>
  );
};