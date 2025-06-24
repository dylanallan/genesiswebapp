import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mic, Brain, File as FileTree, Settings, Volume2, VolumeX, X, Maximize2, Minimize2, Users, MessageSquare, Zap } from 'lucide-react';
import { FamilyTreeVoiceAgent } from './FamilyTreeVoiceAgent';
import { Chat } from './Chat';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface GenesisVoiceAssistantProps {
  userName?: string;
  ancestry?: string;
  businessGoals?: string;
}

export const GenesisVoiceAssistant: React.FC<GenesisVoiceAssistantProps> = ({
  userName = 'User',
  ancestry = 'European and Asian heritage',
  businessGoals = 'Automate marketing and preserve cultural knowledge'
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'family-tree' | 'automation'>('chat');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('user_data')
          .select('preferences')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!error && data) {
          setUserProfile(data.preferences);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    toast.success(isMuted ? 'Voice enabled' : 'Voice muted');
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 ${
      isExpanded ? 'fixed inset-4 z-50' : ''
    }`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Brain className="w-6 h-6 text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-900">Genesis Voice Assistant</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleMute}
            className={`p-2 rounded-lg transition-colors ${
              isMuted 
                ? 'bg-red-100 text-red-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={toggleExpand}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title={isExpanded ? 'Minimize' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          {isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 transition-colors ${
            activeTab === 'chat'
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span>Chat</span>
        </button>
        <button
          onClick={() => setActiveTab('family-tree')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 transition-colors ${
            activeTab === 'family-tree'
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Family Tree</span>
        </button>
        <button
          onClick={() => setActiveTab('automation')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 transition-colors ${
            activeTab === 'automation'
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Zap className="w-5 h-5" />
          <span>Automation</span>
        </button>
      </div>

      <div className={`${isExpanded ? 'h-[calc(100%-8rem)]' : 'h-[600px]'}`}>
        {activeTab === 'chat' && (
          <Chat 
            userName={userProfile?.name || userName}
            ancestry={userProfile?.ancestry || ancestry}
            businessGoals={userProfile?.businessGoals || businessGoals}
          />
        )}
        
        {activeTab === 'family-tree' && (
          <FamilyTreeVoiceAgent 
            userName={userProfile?.name || userName}
            ancestry={userProfile?.ancestry || ancestry}
          />
        )}
        
        {activeTab === 'automation' && (
          <div className="p-6 h-full flex items-center justify-center">
            <div className="text-center">
              <Zap className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Automation Voice Assistant</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Use voice commands to create and manage your business automation workflows
              </p>
              <button
                onClick={() => toast.info('Automation voice assistant coming soon!')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Coming Soon
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Voice Assistant Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Volume2 className="w-5 h-5 text-gray-700" />
                    <span className="font-medium text-gray-900">Voice Feedback</span>
                  </div>
                  <div className="relative inline-block w-12 h-6">
                    <input 
                      type="checkbox" 
                      className="opacity-0 w-0 h-0" 
                      id="voice-toggle"
                      checked={!isMuted}
                      onChange={toggleMute}
                    />
                    <label 
                      htmlFor="voice-toggle"
                      className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full transition-all duration-300 before:absolute before:content-[''] before:h-4 before:w-4 before:left-1 before:bottom-1 before:bg-white before:rounded-full before:transition-all before:duration-300 peer-checked:bg-blue-500 peer-checked:before:translate-x-6"
                    ></label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Voice Recognition Settings</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="continuous" name="recognition-mode" defaultChecked />
                      <label htmlFor="continuous" className="text-gray-700">Continuous listening</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="radio" id="manual" name="recognition-mode" />
                      <label htmlFor="manual" className="text-gray-700">Manual activation only</label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Family Tree Integration</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-gray-700">Auto-detect family members</label>
                      <div className="relative inline-block w-12 h-6">
                        <input 
                          type="checkbox" 
                          className="opacity-0 w-0 h-0" 
                          id="detect-toggle"
                          defaultChecked
                        />
                        <label 
                          htmlFor="detect-toggle"
                          className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full transition-all duration-300 before:absolute before:content-[''] before:h-4 before:w-4 before:left-1 before:bottom-1 before:bg-white before:rounded-full before:transition-all before:duration-300 peer-checked:bg-blue-500 peer-checked:before:translate-x-6"
                        ></label>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-gray-700">Require validation for AI detections</label>
                      <div className="relative inline-block w-12 h-6">
                        <input 
                          type="checkbox" 
                          className="opacity-0 w-0 h-0" 
                          id="validation-toggle"
                          defaultChecked
                        />
                        <label 
                          htmlFor="validation-toggle"
                          className="absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full transition-all duration-300 before:absolute before:content-[''] before:h-4 before:w-4 before:left-1 before:bottom-1 before:bg-white before:rounded-full before:transition-all before:duration-300 peer-checked:bg-blue-500 peer-checked:before:translate-x-6"
                        ></label>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      toast.success('Settings saved');
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};