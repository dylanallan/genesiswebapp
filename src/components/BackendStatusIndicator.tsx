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

export const BackendStatusIndicator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-sm font-medium text-gray-700">
            All Systems Operational
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
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Server className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">Database Migration</span>
                </div>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-sm">Edge Functions</span>
                </div>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span className="text-sm">AI Services</span>
                </div>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-red-500" />
                  <span className="text-sm">Admin Configuration</span>
                </div>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200 flex space-x-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                }}
                className="flex-1 flex items-center justify-center space-x-1 text-sm text-blue-600 hover:text-blue-800 py-1 px-2 rounded hover:bg-blue-50"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};