import React, { useState, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: ReactNode;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underlined';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  onChange,
  variant = 'default',
  className
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const variants = {
    default: {
      tabList: "flex space-x-1 border-b border-gray-200",
      tab: (isActive: boolean) => cn(
        "px-4 py-2 text-sm font-medium transition-colors",
        isActive 
          ? "text-genesis-600 border-b-2 border-genesis-600" 
          : "text-gray-600 hover:text-gray-900 hover:border-b-2 hover:border-gray-300"
      )
    },
    pills: {
      tabList: "flex space-x-2",
      tab: (isActive: boolean) => cn(
        "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
        isActive 
          ? "bg-genesis-600 text-white" 
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      )
    },
    underlined: {
      tabList: "flex space-x-4",
      tab: (isActive: boolean) => cn(
        "px-1 py-2 text-sm font-medium transition-colors relative",
        isActive 
          ? "text-genesis-600" 
          : "text-gray-600 hover:text-gray-900"
      )
    }
  };

  return (
    <div className={className}>
      <div className={variants[variant].tabList}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={variants[variant].tab(activeTab === tab.id)}
          >
            <div className="flex items-center space-x-2">
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
            </div>
            {variant === 'underlined' && activeTab === tab.id && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-genesis-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
            )}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {tabs.find(tab => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};