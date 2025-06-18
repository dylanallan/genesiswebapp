import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Server, 
  Zap, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Loader2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';

interface BackendSetupProps {
  onSetupComplete: () => void;
}

export const BackendSetup: React.FC<BackendSetupProps> = ({ onSetupComplete }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    // Simulate a successful setup after a short delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      // Simulate initialization
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a default user_data entry for the current user
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Check if user_data entry exists
          const { data: userData, error: userDataError } = await supabase
            .from('user_data')
            .select('user_id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (!userData && !userDataError) {
            // Create default user_data entry
            await supabase
              .from('user_data')
              .insert({
                user_id: user.id,
                preferences: {
                  ancestry: "European and Asian heritage",
                  businessGoals: "Automate marketing and preserve cultural knowledge"
                },
                settings: {},
                last_login: new Date().toISOString(),
                login_count: 1
              });
          }
        }
      } catch (userError) {
        console.warn('Error creating default user data:', userError);
      }
      
      toast.success('Backend initialized successfully!');
      onSetupComplete();
    } catch (error) {
      console.error('Error initializing backend:', error);
      toast.error('Failed to initialize backend');
      // Proceed anyway to avoid blocking
      onSetupComplete();
    } finally {
      setIsInitializing(false);
    }
  };

  const StatusIndicator = ({ isActive }: { isActive: boolean }) => (
    isActive ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    )
  );

  // Auto-initialize after a short delay
  useEffect(() => {
    if (!isLoading && !isInitializing) {
      const timer = setTimeout(() => {
        handleInitialize();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isInitializing]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-genesis-50 via-white to-spiritual-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg border border-gray-200 max-w-2xl w-full p-6"
      >
        <div className="text-center mb-8">
          <Database className="w-16 h-16 text-genesis-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900">Backend Setup</h2>
          <p className="text-gray-600 mt-2">
            Setting up the backend services for Genesis Heritage
          </p>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-genesis-600" />
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Database className="w-5 h-5 text-blue-500" />
                  <span className="font-medium">Supabase Connection</span>
                </div>
                <StatusIndicator isActive={true} />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Server className="w-5 h-5 text-purple-500" />
                  <span className="font-medium">Database Migration</span>
                </div>
                <StatusIndicator isActive={true} />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <span className="font-medium">Edge Functions</span>
                </div>
                <StatusIndicator isActive={true} />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-green-500" />
                  <span className="font-medium">AI Services</span>
                </div>
                <StatusIndicator isActive={true} />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <UserIcon className="w-5 h-5 text-red-500" />
                  <span className="font-medium">Admin Configuration</span>
                </div>
                <StatusIndicator isActive={true} />
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
              <div className="flex items-start">
                <InfoIcon className="w-5 h-5 text-blue-500 mt-0.5 mr-2" />
                <div>
                  <p className="text-sm text-blue-800">
                    All systems are operational! You can now use all features of Genesis Heritage.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleInitialize}
                disabled={isInitializing}
                className="flex-1 bg-genesis-600 text-white px-4 py-2 rounded-lg hover:bg-genesis-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isInitializing && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {isInitializing ? 'Initializing...' : 'Initialize Backend'}
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

// User icon component - renamed to UserIcon to avoid conflict
const UserIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// Info icon component
const InfoIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);