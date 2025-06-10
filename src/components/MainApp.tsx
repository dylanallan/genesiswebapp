import React, { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { Dashboard } from './Dashboard';
import { Auth } from './Auth';
import { Loader2, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export const MainApp: React.FC = () => {
  const session = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'standard' | 'enterprise' | 'hackathon'>('standard');

  useEffect(() => {
    const checkUserRole = async () => {
      if (session?.user) {
        try {
          // Check if user is admin
          const { data: adminData } = await supabase
            .from('admin_roles')
            .select('role_name')
            .eq('user_id', session.user.id)
            .single();

          if (adminData) {
            setUserRole(adminData.role_name);
          } else {
            setUserRole('user');
          }

          // Get user preferences
          const { data: userData } = await supabase
            .from('user_data')
            .select('preferences')
            .eq('user_id', session.user.id)
            .single();

          if (userData?.preferences?.viewMode) {
            setViewMode(userData.preferences.viewMode);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole('user');
        }
      }
      setIsLoading(false);
    };

    checkUserRole();
  }, [session]);

  const handleViewModeChange = async (mode: 'standard' | 'enterprise' | 'hackathon') => {
    setViewMode(mode);
    
    if (session?.user) {
      try {
        await supabase
          .from('user_data')
          .upsert({
            user_id: session.user.id,
            preferences: { viewMode: mode }
          });
      } catch (error) {
        console.error('Error updating view mode preference:', error);
        toast.error('Failed to update view mode');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-genesis-50 via-white to-spiritual-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="w-12 h-12 text-genesis-600 mx-auto mb-4" />
          </motion.div>
          <p className="text-gray-600 font-medium">Loading Genesis Heritage Pro...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return <Dashboard onViewModeChange={handleViewModeChange} />;
};