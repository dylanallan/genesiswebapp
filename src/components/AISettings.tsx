import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Save, 
  X, 
  Zap, 
  Brain, 
  RefreshCw,
  Shield,
  Database,
  MessageSquare,
  Search,
  Edit,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { aiRouter } from '../lib/ai-router';
import { AICustomInstructionsEditor } from './AICustomInstructionsEditor';

interface AISettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AISettings: React.FC<AISettingsProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [providerStatus, setProviderStatus] = useState<Map<string, any>>(new Map());
  const [showCustomInstructionsEditor, setShowCustomInstructionsEditor] = useState(false);
  const [settings, setSettings] = useState({
    general: {
      defaultModel: 'auto',
      streamResponses: true,
      saveConversations: true,
      enableFeedback: true
    },
    memory: {
      includeUserContext: true,
      includeConversationHistory: true,
      includeCustomInstructions: true,
      includeSemanticSearch: true,
      semanticSearchThreshold: 0.7,
      semanticSearchCount: 5,
      maxConversationLength: 10
    },
    providers: {
      openaiApiKey: '',
      anthropicApiKey: '',
      googleApiKey: ''
    },
    advanced: {
      enableDebugMode: false,
      logTokenUsage: true,
      enableCircuitBreaker: true,
      enableErrorRecovery: true
    }
  });
  const [customInstructions, setCustomInstructions] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      loadProviderStatus();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // Load user preferences
      const { data: userData, error: userError } = await supabase
        .from('user_data')
        .select('preferences')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      if (!userError && userData?.preferences?.aiSettings) {
        setSettings(userData.preferences.aiSettings);
      }
      
      // Load custom instructions
      const { data: instructionsData, error: instructionsError } = await supabase
        .from('ai_custom_instructions')
        .select('instructions')
        .eq('is_active', true)
        .maybeSingle();
      
      if (!instructionsError && instructionsData?.instructions) {
        setCustomInstructions(instructionsData.instructions);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProviderStatus = async () => {
    try {
      const status = await aiRouter.getProviderStatus();
      setProviderStatus(status);
    } catch (error) {
      console.error('Error loading provider status:', error);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Save user preferences
      const { error: userError } = await supabase
        .from('user_data')
        .update({
          preferences: {
            aiSettings: settings
          }
        })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
      
      if (userError) throw userError;
      
      // Save custom instructions
      if (customInstructions.trim()) {
        const { error: instructionsError } = await supabase
          .from('ai_custom_instructions')
          .upsert({
            user_id: (await supabase.auth.getUser()).data.user?.id,
            instructions: customInstructions,
            is_active: true,
            updated_at: new Date().toISOString()
          });
        
        if (instructionsError) throw instructionsError;
      }
      
      // Save API keys to provider config (admin only)
      const { data: adminRole } = await supabase
        .from('admin_roles')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .maybeSingle();
      
      if (adminRole && settings.providers) {
        if (settings.providers.openaiApiKey) {
          await supabase
            .from('ai_service_config')
            .update({ api_key: settings.providers.openaiApiKey })
            .eq('service_name', 'openai');
        }
        
        if (settings.providers.anthropicApiKey) {
          await supabase
            .from('ai_service_config')
            .update({ api_key: settings.providers.anthropicApiKey })
            .eq('service_name', 'anthropic');
        }
        
        if (settings.providers.googleApiKey) {
          await supabase
            .from('ai_service_config')
            .update({ api_key: settings.providers.googleApiKey })
            .eq('service_name', 'google');
        }
      }
      
      toast.success('Settings saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleProvider = async (providerId: string) => {
    try {
      const provider = providerStatus.get(providerId);
      if (!provider) return;
      
      if (provider.isActive) {
        await aiRouter.disableProvider(providerId);
      } else {
        await aiRouter.enableProvider(providerId);
      }
      
      await loadProviderStatus();
    } catch (error) {
      console.error('Error toggling provider:', error);
      toast.error('Failed to update provider status');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex"
      >
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
          <div className="flex items-center space-x-2 mb-6">
            <Settings className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">AI Settings</h2>
          </div>
          
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                activeTab === 'general' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Brain className="w-4 h-4" />
                <span>General</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('memory')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                activeTab === 'memory' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Memory & Context</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('providers')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                activeTab === 'providers' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>AI Providers</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('instructions')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                activeTab === 'instructions' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4" />
                <span>Custom Instructions</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('advanced')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                activeTab === 'advanced' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Advanced</span>
              </div>
            </button>
          </nav>
        </div>
        
        {/* Content */}
        <div className="flex-1 flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {activeTab === 'general' && 'General Settings'}
              {activeTab === 'memory' && 'Memory & Context Settings'}
              {activeTab === 'providers' && 'AI Provider Settings'}
              {activeTab === 'instructions' && 'Custom Instructions'}
              {activeTab === 'advanced' && 'Advanced Settings'}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                {/* General Settings */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Model Preferences</h4>
                      
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Default AI Model
                        </label>
                        <select
                          value={settings.general.defaultModel}
                          onChange={(e) => setSettings({
                            ...settings,
                            general: {
                              ...settings.general,
                              defaultModel: e.target.value
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="auto">Auto-Select (Recommended)</option>
                          <option value="gpt-4">GPT-4 (Advanced reasoning)</option>
                          <option value="claude-3-opus">Claude 3 Opus (Nuanced understanding)</option>
                          <option value="gemini-pro">Gemini Pro (Fast responses)</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          The AI model that will be used by default for your conversations
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Conversation Settings</h4>
                      
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={settings.general.streamResponses}
                            onChange={(e) => setSettings({
                              ...settings,
                              general: {
                                ...settings.general,
                                streamResponses: e.target.checked
                              }
                            })}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">Stream responses in real-time</span>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={settings.general.saveConversations}
                            onChange={(e) => setSettings({
                              ...settings,
                              general: {
                                ...settings.general,
                                saveConversations: e.target.checked
                              }
                            })}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">Save conversation history</span>
                        </label>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={settings.general.enableFeedback}
                            onChange={(e) => setSettings({
                              ...settings,
                              general: {
                                ...settings.general,
                                enableFeedback: e.target.checked
                              }
                            })}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">Enable response feedback</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Memory & Context Settings */}
                {activeTab === 'memory' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Context Settings</h4>
                      
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={settings.memory.includeUserContext}
                            onChange={(e) => setSettings({
                              ...settings,
                              memory: {
                                ...settings.memory,
                                includeUserContext: e.target.checked
                              }
                            })}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">Include user profile context</span>
                        </label>
                        <Brain className="w-4 h-4 text-blue-500" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={settings.memory.includeConversationHistory}
                            onChange={(e) => setSettings({
                              ...settings,
                              memory: {
                                ...settings.memory,
                                includeConversationHistory: e.target.checked
                              }
                            })}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">Include conversation history</span>
                        </label>
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={settings.memory.includeCustomInstructions}
                            onChange={(e) => setSettings({
                              ...settings,
                              memory: {
                                ...settings.memory,
                                includeCustomInstructions: e.target.checked
                              }
                            })}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">Include custom instructions</span>
                        </label>
                        <Settings className="w-4 h-4 text-blue-500" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={settings.memory.includeSemanticSearch}
                            onChange={(e) => setSettings({
                              ...settings,
                              memory: {
                                ...settings.memory,
                                includeSemanticSearch: e.target.checked
                              }
                            })}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">Include semantic search results</span>
                        </label>
                        <Search className="w-4 h-4 text-blue-500" />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Memory Settings</h4>
                      
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Max conversation length
                        </label>
                        <select
                          value={settings.memory.maxConversationLength}
                          onChange={(e) => setSettings({
                            ...settings,
                            memory: {
                              ...settings.memory,
                              maxConversationLength: parseInt(e.target.value)
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="5">5 messages</option>
                          <option value="10">10 messages</option>
                          <option value="20">20 messages</option>
                          <option value="50">50 messages</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Maximum number of previous messages to include in context
                        </p>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Semantic search threshold
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="0.9"
                          step="0.05"
                          value={settings.memory.semanticSearchThreshold}
                          onChange={(e) => setSettings({
                            ...settings,
                            memory: {
                              ...settings.memory,
                              semanticSearchThreshold: parseFloat(e.target.value)
                            }
                          })}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>More results</span>
                          <span>{settings.memory.semanticSearchThreshold}</span>
                          <span>Higher quality</span>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Number of search results
                        </label>
                        <select
                          value={settings.memory.semanticSearchCount}
                          onChange={(e) => setSettings({
                            ...settings,
                            memory: {
                              ...settings.memory,
                              semanticSearchCount: parseInt(e.target.value)
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="3">3 results</option>
                          <option value="5">5 results</option>
                          <option value="10">10 results</option>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          Number of semantic search results to include in context
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* AI Provider Settings */}
                {activeTab === 'providers' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">AI Provider Status</h4>
                      
                      <div className="space-y-3">
                        {Array.from(providerStatus.entries()).map(([id, provider]) => (
                          <div key={id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Zap className="w-5 h-5 text-blue-500" />
                              <div>
                                <h5 className="font-medium text-gray-900">{provider.name}</h5>
                                <p className="text-xs text-gray-500">
                                  {provider.capabilities.join(', ')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                                provider.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {provider.isActive ? (
                                  <CheckCircle className="w-3 h-3" />
                                ) : (
                                  <X className="w-3 h-3" />
                                )}
                                <span>{provider.isActive ? 'Active' : 'Inactive'}</span>
                              </div>
                              <button
                                onClick={() => toggleProvider(id)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium ${
                                  provider.isActive
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {provider.isActive ? 'Disable' : 'Enable'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">API Keys (Admin Only)</h4>
                      <p className="text-sm text-gray-500">
                        These settings are only available to administrators. API keys are stored securely and used to connect to AI providers.
                      </p>
                      
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                          OpenAI API Key
                        </label>
                        <input
                          type="password"
                          value={settings.providers.openaiApiKey}
                          onChange={(e) => setSettings({
                            ...settings,
                            providers: {
                              ...settings.providers,
                              openaiApiKey: e.target.value
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="sk-..."
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Anthropic API Key
                        </label>
                        <input
                          type="password"
                          value={settings.providers.anthropicApiKey}
                          onChange={(e) => setSettings({
                            ...settings,
                            providers: {
                              ...settings.providers,
                              anthropicApiKey: e.target.value
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="sk-ant-..."
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700">
                          Google AI API Key
                        </label>
                        <input
                          type="password"
                          value={settings.providers.googleApiKey}
                          onChange={(e) => setSettings({
                            ...settings,
                            providers: {
                              ...settings.providers,
                              googleApiKey: e.target.value
                            }
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="AIza..."
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Custom Instructions */}
                {activeTab === 'instructions' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Custom Instructions</h4>
                      <p className="text-sm text-gray-500">
                        These instructions will be included with every request to the AI assistant. Use them to provide context about yourself, your preferences, or specific requirements.
                      </p>
                      
                      <div className="space-y-1">
                        <textarea
                          value={customInstructions}
                          onChange={(e) => setCustomInstructions(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows={8}
                          placeholder="Example: I'm a software developer working on a web application. I prefer concise answers with code examples in JavaScript. Please format code with syntax highlighting and explain any complex concepts."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Custom instructions help the AI provide more personalized and relevant responses
                        </p>
                      </div>
                      
                      <button
                        onClick={() => setShowCustomInstructionsEditor(true)}
                        className="w-full mt-3 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit Custom Instructions</span>
                      </button>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <div className="flex items-start">
                        <Brain className="w-5 h-5 text-blue-500 mt-0.5 mr-2" />
                        <div>
                          <h4 className="font-medium text-blue-900">Instruction Tips</h4>
                          <ul className="mt-2 space-y-1 text-sm text-blue-700">
                            <li>• Include your role, industry, or background</li>
                            <li>• Specify your preferred response format</li>
                            <li>• Mention topics you're interested in</li>
                            <li>• Note any specific terminology or jargon you use</li>
                            <li>• Include any accessibility needs</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Advanced Settings */}
                {activeTab === 'advanced' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-900">Advanced Settings</h4>
                      <p className="text-sm text-gray-500">
                        These settings are for advanced users and may affect system performance.
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={settings.advanced.enableDebugMode}
                            onChange={(e) => setSettings({
                              ...settings,
                              advanced: {
                                ...settings.advanced,
                                enableDebugMode: e.target.checked
                              }
                            })}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">Enable debug mode</span>
                        </label>
                        <Database className="w-4 h-4 text-blue-500" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={settings.advanced.logTokenUsage}
                            onChange={(e) => setSettings({
                              ...settings,
                              advanced: {
                                ...settings.advanced,
                                logTokenUsage: e.target.checked
                              }
                            })}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">Log token usage</span>
                        </label>
                        <Database className="w-4 h-4 text-blue-500" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={settings.advanced.enableCircuitBreaker}
                            onChange={(e) => setSettings({
                              ...settings,
                              advanced: {
                                ...settings.advanced,
                                enableCircuitBreaker: e.target.checked
                              }
                            })}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">Enable circuit breaker</span>
                        </label>
                        <Shield className="w-4 h-4 text-blue-500" />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={settings.advanced.enableErrorRecovery}
                            onChange={(e) => setSettings({
                              ...settings,
                              advanced: {
                                ...settings.advanced,
                                enableErrorRecovery: e.target.checked
                              }
                            })}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-gray-700">Enable error recovery</span>
                        </label>
                        <Shield className="w-4 h-4 text-blue-500" />
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                      <div className="flex items-start">
                        <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 mr-2" />
                        <div>
                          <h4 className="font-medium text-yellow-900">Advanced Settings Warning</h4>
                          <p className="mt-1 text-sm text-yellow-700">
                            These settings are intended for advanced users. Changing them may affect system performance and stability. Please proceed with caution.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
      {showCustomInstructionsEditor && (
        <AICustomInstructionsEditor
          isOpen={showCustomInstructionsEditor}
          onClose={() => setShowCustomInstructionsEditor(false)}
        />
      )}
    </div>
  );
};