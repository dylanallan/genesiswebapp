import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, LogOut, ChevronDown } from 'lucide-react';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { UserSettings } from './UserSettings';

export const UserProfileButton: React.FC = () => {
  const session = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  if (!session) return null;

  return (
    <>
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
            className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg border bg-white z-50"
          >
            <div className="px-4 py-2 border-b">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session.user?.email}
              </p>
            </div>
            <button
              onClick={() => {
                setShowSettings(true);
                setShowUserMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </button>
            <button
              onClick={() => {
                handleSignOut();
                setShowUserMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 flex items-center"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </button>
          </motion.div>
        )}
      </div>

      <UserSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </>
  );
};