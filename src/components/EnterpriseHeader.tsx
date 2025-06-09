import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, 
  ChevronDown, 
  Bell, 
  Settings, 
  LogOut, 
  Users, 
  BarChart3, 
  Globe, 
  Zap,
  Lock,
  Crown,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSession } from '@supabase/auth-helpers-react';
import { toast } from 'sonner';

interface EnterpriseHeaderProps {
  onCategoryChange: (category: string) => void;
  selectedCategory: string;
}

const EnterpriseHeader: React.FC<EnterpriseHeaderProps> = ({ 
  onCategoryChange, 
  selectedCategory 
}) => {
  const session = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications] = useState<string[]>([]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const categories = [
    { id: 'all', name: 'All Features', icon: Brain },
    { id: 'core', name: 'Core System', icon: Settings },
    { id: 'business', name: 'Business Tools', icon: BarChart3 },
    { id: 'heritage', name: 'Heritage Tools', icon: Globe }
  ];

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <motion.div 
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <Brain className="w-8 h-8 text-genesis-600" />
                <motion.div 
                  className="absolute -top-1 -right-1 w-3 h-3 bg-spiritual-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-genesis-600 to-spiritual-600 bg-clip-text text-transparent">
                  Genesis Heritage Pro
                </h1>
                <div className="flex items-center space-x-1">
                  <Crown className="w-3 h-3 text-spiritual-500" />
                  <p className="text-xs text-gray-500">Enterprise Edition</p>
                </div>
              </div>
            </motion.div>

            {/* Enterprise Badges */}
            <div className="hidden lg:flex items-center space-x-3 ml-8">
              <div className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                <Lock className="w-3 h-3" />
                <span>Enterprise Security</span>
              </div>
              <div className="flex items-center space-x-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                <CheckCircle className="w-3 h-3" />
                <span>99.9% Uptime SLA</span>
              </div>
              <div className="flex items-center space-x-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                <Zap className="w-3 h-3" />
                <span>AI-Powered</span>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="hidden md:flex items-center space-x-2">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => onCategoryChange(category.id)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-genesis-100 text-genesis-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden lg:block">{category.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            {/* System Status */}
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-600">All Systems Optimal</span>
            </div>

            <button 
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            
            {session && (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-genesis-500 to-spiritual-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {session.user?.email?.[0].toUpperCase()}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>

                {showUserMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-64 rounded-lg shadow-lg border bg-white"
                  >
                    <div className="px-4 py-3 border-b">
                      <p className="text-sm font-medium text-gray-900">
                        {session.user?.email}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Enterprise Account
                      </p>
                    </div>
                    
                    <div className="py-2">
                      <button
                        onClick={() => {
                          toast.info('Account settings coming soon');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center"
                      >
                        <Settings className="w-4 h-4 mr-2 text-gray-500" />
                        Account Settings
                      </button>
                      <button
                        onClick={() => {
                          toast.info('Team management coming soon');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center"
                      >
                        <Users className="w-4 h-4 mr-2 text-gray-500" />
                        Team Management
                      </button>
                      <button
                        onClick={() => {
                          toast.info('Usage analytics coming soon');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center"
                      >
                        <BarChart3 className="w-4 h-4 mr-2 text-gray-500" />
                        Usage Analytics
                      </button>
                    </div>
                    
                    <div className="py-2 border-t">
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 flex items-center"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default EnterpriseHeader;