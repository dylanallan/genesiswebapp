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
  X, 
  Plus,
  Copy,
  ArrowRight
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
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadIntegrationSettings();
      loadTemplates();
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

  const loadTemplates = async () => {
    try {
      // In a real implementation, fetch from database or n8n API
      // For demo, we'll use mock data
      setTemplates([
        {
          id: '1',
          name: 'Customer Onboarding',
          description: 'Automate the customer onboarding process including welcome emails, data collection, and CRM updates',
          category: 'Customer Management',
          nodes: 12
        },
        {
          id: '2',
          name: 'Document Processing',
          description: 'Extract data from documents, update databases, and notify relevant team members',
          category: 'Document Management',
          nodes: 8
        },
        {
          id: '3',
          name: 'Email Campaign',
          description: 'Schedule and send personalized email campaigns with tracking and follow-ups',
          category: 'Marketing',
          nodes: 10
        },
        {
          id: '4',
          name: 'Data Synchronization',
          description: 'Keep data in sync between multiple systems and databases',
          category: 'Data Management',
          nodes: 6
        }
      ]);
    } catch (error) {
      console.error('Error loading templates:', error);
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
      
      // In a real implementation, save to database
      try {
        await supabase
          .from('integration_settings')
          .upsert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            integration_type: 'n8n',
            settings: {
              url: n8nUrl,
              api_key: apiKey,
              webhook_url: webhookUrl,
              connected_at: new Date().toISOString()
            },
            is_active: true
          });
      } catch (dbError) {
        console.warn('Failed to save to database, using localStorage fallback:', dbError);
      }
      
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
      
      // In a real implementation, update database
      try {
        await supabase
          .from('integration_settings')
          .update({ is_active: false })
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .eq('integration_type', 'n8n');
      } catch (dbError) {
        console.warn('Failed to update database, using localStorage fallback:', dbError);
      }
      
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

  const importTemplate = async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;
      
      toast.success(`Importing ${template.name} template to n8n...`);
      
      // In a real implementation, this would call the n8n API to import the template
      // For demo, we'll simulate success
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(`${template.name} template imported successfully! Open n8n to customize.`);
      
      // Open n8n in a new tab
      window.open(n8nUrl, '_blank');
    } catch (error) {
      console.error('Error importing template:', error);
      toast.error('Failed to import template');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
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
          <p className="text-sm text-gray-600">
            Connect Genesis Heritage to n8n to create powerful automation workflows that integrate with your cultural heritage data.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              {isConnected ? (
                <div className="p-6 space-y-6">
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
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">Workflow Templates</h3>
                      <span className="text-sm text-gray-500">{templates.length} templates available</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {templates.map(template => (
                        <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{template.name}</h4>
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              {template.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{template.nodes} nodes</span>
                            <button
                              onClick={() => importTemplate(template.id)}
                              className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                            >
                              <ArrowRight className="w-4 h-4" />
                              <span>Import to n8n</span>
                            </button>
                          </div>
                        </div>
                      ))}
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
                <div className="p-6 space-y-6">
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