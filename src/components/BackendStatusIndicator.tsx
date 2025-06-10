import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  Server, 
  Zap, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  User
} from 'lucide-react';
import { checkBackendStatus, BackendStatus } from '../lib/backend-status';
import { initializeBackend } from '../lib/initialize-backend';
import { toast } from 'sonner';

export const BackendStatusIndicator: React.FC = () => {
  const [status, setStatus] = useState<BackendStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    checkStatus();
    
    // Check status every 5 minutes
    const interval = setInterval(checkStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const currentStatus = await checkBackendStatus();
      setStatus(currentStatus);
    } catch (error) {
      console.error('Error checking backend status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      const success = await initializeBackend();
      
      if (success) {
        await checkStatus();
        toast.success('Backend initialized successfully');
      }
    } catch (error) {
      console.error('Error initializing backend:', error);
      toast.error('Failed to initialize backend');
    } finally {
      setIsInitializing(false);
    }
  };

  const getStatusColor = (status: 'operational' | 'partial' | 'offline') => {
    switch (status) {
      case 'operational':
        return 'bg-green-500';
      case 'partial':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: 'operational' | 'partial' | 'offline') => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'partial':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <RefreshCw className="w-4 h-4 text-gray-500" />;
    }
  };

  if (!status) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <div className={`w-2 h-2 rounded-full ${getStatusColor(status.overallStatus)}`} />
          <span className="text-sm font-medium text-gray-700">
            {status.overallStatus === 'operational' ? 'All Systems Operational' : 
             status.overallStatus === 'partial' ? 'Partial System Availability' :
             'Systems Offline'}
          </span>
        </button>
        
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-12 left-0 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-72"
          >
            <h3 className="font-medium text-gray-900 mb-3">System Status</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Supabase Connection</span>
                </div>
                {status.supabaseConnected ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Server className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Database Migration</span>
                </div>
                {status.databaseMigrated ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-sm">Edge Functions</span>
                </div>
                {status.edgeFunctionsDeployed ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-sm">AI Services</span>
                </div>
                {status.aiServicesConfigured ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Admin Configuration</span>
                </div>
                {status.adminConfigured ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200 flex space-x-2">
              <button
                onClick={checkStatus}
                className="flex-1 flex items-center justify-center space-x-1 text-sm text-blue-600 hover:text-blue-800 py-1 px-2 rounded hover:bg-blue-50"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
              
              {status.overallStatus !== 'operational' && (
                <button
                  onClick={handleInitialize}
                  disabled={isInitializing}
                  className="flex-1 flex items-center justify-center space-x-1 text-sm text-green-600 hover:text-green-800 py-1 px-2 rounded hover:bg-green-50 disabled:opacity-50"
                >
                  {isInitializing ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Zap className="w-3 h-3" />
                  )}
                  <span>Initialize</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};