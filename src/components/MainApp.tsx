import React, { useState, useEffect } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { Dashboard } from './Dashboard';
import { EnterpriseDashboard } from './EnterpriseDashboard';
import { HackathonDashboard } from './HackathonDashboard';
import { Auth } from './Auth';
import { Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { BackendSetup } from './BackendSetup';
import { ErrorBoundary } from '../lib/error-boundary';

export const MainApp: React.FC = () => {
  const session = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'standard' | 'enterprise' | 'hackathon'>('standard');
  const [showBackendSetup, setShowBackendSetup] = useState(false);

  useEffect(() => {
    // Simplified loading to prevent crashes
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      // Check if backend setup is needed
      const backendInitialized = localStorage.getItem('backend_initialized') === 'true';
      setShowBackendSetup(!backendInitialized);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkUserRole = async () => {
      if (session?.user) {
        try {
          // Get user preferences
          const { data: userData } = await supabase
            .from('user_data')
            .select('preferences')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (userData?.preferences?.viewMode) {
            setViewMode(userData.preferences.viewMode);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
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

  const handleBackendSetupComplete = () => {
    localStorage.setItem('backend_initialized', 'true');
    setShowBackendSetup(false);
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

  if (showBackendSetup) {
    return <BackendSetup onSetupComplete={handleBackendSetupComplete} />;
  }

  // Wrap each dashboard in an ErrorBoundary to prevent crashes
  switch (viewMode) {
    case 'enterprise':
      return (
        <ErrorBoundary>
          <EnterpriseDashboard />
        </ErrorBoundary>
      );
    case 'hackathon':
      return (
        <ErrorBoundary>
          <HackathonDashboard />
        </ErrorBoundary>
      );
    default:
      return (
        <ErrorBoundary>
          <Dashboard onViewModeChange={handleViewModeChange} />
        </ErrorBoundary>
      );
  }
};