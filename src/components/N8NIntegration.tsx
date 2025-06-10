import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Workflow, 
  Zap, 
  Link, 
  ExternalLink, 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  X 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface N8NIntegrationProps {
  isOpen: boolean;
  onClose: () => void;
}

export const N8NIntegration: React.FC<N8NIntegrationProps> = ({ isOpen, onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [n8nUrl, setN8nUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadIntegrationSettings();
    }
  }, [isOpen]);

  const loadIntegrationSettings = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, fetch from database
      // For demo, we'll simulate a delay and use mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockConnected = localStorage.getItem('n8n_connected') === 'true';
      const mockN8nUrl = localStorage.getItem('n8n_url') || '';
      const mockApiKey = localStorage.getItem('n8n_api_key') || '';
      const mockWebhookUrl = localStorage.getItem('n8n_webhook_url') || 'https://genesis-heritage.com/api/n8n-webhook';
      
      setIsConnected(mockConnected);
      setN8nUrl(mockN8nUrl);
      setApiKey(mockApiKey);
      setWebhookUrl(mockWebhookUrl);
    } catch (error) {
      console.error('Error loading integration settings:', error);
      toast.error('Failed to load integration settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!n8nUrl) {
      toast.error('Please enter your n8n URL');
      return;
    }

    setIsTestingConnection(true);
    try {
      // In a real implementation, test the connection to n8n
      // For demo, we'll simulate a delay and success
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Save to localStorage for demo purposes
      localStorage.setItem('n8n_connected', 'true');
      localStorage.setItem('n8n_url', n8nUrl);
      localStorage.setItem('n8n_api_key', apiKey);
      
      setIsConnected(true);
      toast.success('Successfully connected to n8n');
    } catch (error) {
      console.error('Error connecting to n8n:', error);
      toast.error('Failed to connect to n8n');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect from n8n?')) return;
    
    setIsLoading(true);
    try {
      // In a real implementation, remove the integration from database
      // For demo, we'll simulate a delay and success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Remove from localStorage for demo purposes
      localStorage.removeItem('n8n_connected');
      localStorage.removeItem('n8n_url');
      localStorage.removeItem('n8n_api_key');
      
      setIsConnected(false);
      setN8nUrl('');
      setApiKey('');
      toast.success('Disconnected from n8n');
    } catch (error) {
      console.error('Error disconnecting from n8n:', error);
      toast.error('Failed to disconnect from n8n');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Workflow className="w-6 h-6 text-orange-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">n8n Integration</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {isConnected ? (
                <div className="space-y-6">
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-2" />
                    <div>
                      <h3 className="font-medium text-green-800">Connected to n8n</h3>
                      <p className="text-sm text-green-700 mt-1">
                        Your Genesis Heritage account is successfully connected to n8n.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        n8n Instance URL
                      </label>
                      <div className="flex">
                        <input
                          type="text"
                          value={n8nUrl}
                          readOnly
                          className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-l-lg text-gray-700"
                        />
                        <button
                          onClick={() => window.open(n8nUrl, '_blank')}
                          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-r-lg hover:bg-gray-300 transition-colors"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        Webhook URL (for n8n)
                      </label>
                      <div className="flex">
                        <input
                          type="text"
                          value={webhookUrl}
                          readOnly
                          className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-l-lg text-gray-700"
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(webhookUrl);
                            toast.success('Webhook URL copied to clipboard');
                          }}
                          className="px-3 py-2 bg-gray-200 text-gray-700 rounded-r-lg hover:bg-gray-300 transition-colors"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Use this URL in n8n webhook nodes to send data to Genesis Heritage
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h3 className="font-medium text-gray-900">Integration Options</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => window.open(`${n8nUrl}/workflows/new`, '_blank')}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Create New Workflow</span>
                      </button>
                      
                      <button
                        onClick={() => window.open(`${n8nUrl}/workflows`, '_blank')}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        <Workflow className="w-5 h-5" />
                        <span>View All Workflows</span>
                      </button>
                      
                      <button
                        onClick={() => window.open(`${n8nUrl}/settings`, '_blank')}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <Settings className="w-5 h-5" />
                        <span>n8n Settings</span>
                      </button>
                      
                      <button
                        onClick={() => window.open('https://docs.n8n.io/', '_blank')}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <ExternalLink className="w-5 h-5" />
                        <span>n8n Documentation</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={handleDisconnect}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      Disconnect from n8n
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div className="flex items-start">
                      <Zap className="w-5 h-5 text-blue-500 mt-0.5 mr-2" />
                      <div>
                        <h3 className="font-medium text-blue-800">Connect to n8n</h3>
                        <p className="text-sm text-blue-700 mt-1">
                          Connect your Genesis Heritage account to n8n to automate your business processes and free up time for cultural exploration.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        n8n Instance URL *
                      </label>
                      <input
                        type="text"
                        value={n8nUrl}
                        onChange={(e) => setN8nUrl(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="https://your-n8n-instance.com"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the URL of your n8n instance
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700">
                        API Key (optional)
                      </label>
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="n8n API key for secure access"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        For enhanced security, provide your n8n API key
                      </p>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 mr-2" />
                      <div>
                        <h3 className="font-medium text-yellow-800">Important</h3>
                        <p className="text-sm text-yellow-700 mt-1">
                          Make sure your n8n instance is accessible from the internet if you want to use webhooks. For local development, you can use tools like ngrok.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConnect}
                      disabled={isTestingConnection || !n8nUrl}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      {isTestingConnection ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <>
                          <Link className="w-5 h-5" />
                          <span>Connect to n8n</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Copy icon component
function Copy({ className }: { className?: string }) {
  return (
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
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  );
}