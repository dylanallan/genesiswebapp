import React from 'react';
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { SessionProvider, useSession } from './lib/session-context';
import { Auth } from './components/Auth';
import { Chat } from './components/Chat';
import { FamilyTreeVoiceAgent } from './components/FamilyTreeVoiceAgent';
import { AutomationHub } from './components/AutomationHub';
import { DNAInsights } from './components/DNAInsights';
import { AdvancedAnalyticsDashboard } from './components/AdvancedAnalyticsDashboard';
import { SystemDashboard } from './components/SystemDashboard';
import { VoiceCloning } from './components/VoiceCloning';
import { ARHeritageViewer } from './components/ARHeritageViewer';
import { TimelineBuilder } from './components/TimelineBuilder';
import { CulturalRecipeBook } from './components/CulturalRecipeBook';
import { MarketingAutomation } from './components/MarketingAutomation';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Comprehensive Dashboard - Instagram Video Version
const ComprehensiveDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('automation');
  const [userProfile, setUserProfile] = React.useState({
    name: 'User',
    ancestry: 'European and Asian heritage',
    businessGoals: 'Automate marketing and preserve cultural knowledge',
    preferences: {
      theme: 'light',
      notifications: true,
      voiceEnabled: true,
      culturalFocus: 'global'
    }
  });

  const tabs = [
    {
      id: 'automation',
      name: 'Automation Assistant',
      icon: '⚡',
      component: () => (
        <div className="h-full">
          <AutomationHub />
        </div>
      ),
      description: 'AI-powered business automation and workflow management'
    },
    {
      id: 'ancestral-healing',
      name: 'Ancestral Healing Assistant Pro',
      icon: '🌿',
      component: () => (
        <div className="h-full">
          <FamilyTreeVoiceAgent 
            userName={userProfile.name}
            ancestry={userProfile.ancestry}
          />
        </div>
      ),
      description: 'Voice-powered family history and ancestral healing'
    },
    {
      id: 'ai-chat',
      name: 'AI Chat Assistant',
      icon: '🤖',
      component: () => (
        <div className="h-full">
          <Chat 
            userName={userProfile.name}
            ancestry={userProfile.ancestry}
            businessGoals={userProfile.businessGoals}
          />
        </div>
      ),
      description: 'Advanced conversational AI for genealogy research'
    },
    {
      id: 'dna-insights',
      name: 'DNA Analysis',
      icon: '🧬',
      component: () => (
        <div className="h-full">
          <DNAInsights />
        </div>
      ),
      description: 'Comprehensive genetic heritage insights'
    },
    {
      id: 'voice-cloning',
      name: 'Voice Preservation',
      icon: '🎤',
      component: () => (
        <div className="h-full">
          <VoiceCloning />
        </div>
      ),
      description: 'Clone and preserve ancestral voices'
    },
    {
      id: 'ar-heritage',
      name: 'AR Heritage',
      icon: '📱',
      component: () => (
        <div className="h-full">
          <ARHeritageViewer />
        </div>
      ),
      description: 'Augmented reality heritage exploration'
    },
    {
      id: 'timeline',
      name: 'Family Timeline',
      icon: '📅',
      component: () => (
        <div className="h-full">
          <TimelineBuilder />
        </div>
      ),
      description: 'Interactive family history timeline'
    },
    {
      id: 'cultural-recipes',
      name: 'Cultural Recipes',
      icon: '👨‍🍳',
      component: () => (
        <div className="h-full">
          <CulturalRecipeBook />
        </div>
      ),
      description: 'Traditional family recipes and stories'
    },
    {
      id: 'marketing',
      name: 'Marketing Automation',
      icon: '📈',
      component: () => (
        <div className="h-full">
          <MarketingAutomation />
        </div>
      ),
      description: 'Automated marketing funnels and campaigns'
    },
    {
      id: 'analytics',
      name: 'Advanced Analytics',
      icon: '📊',
      component: () => (
        <div className="h-full">
          <AdvancedAnalyticsDashboard />
        </div>
      ),
      description: 'AI-powered insights and predictive analytics'
    },
    {
      id: 'system',
      name: 'System Monitor',
      icon: '⚙️',
      component: () => (
        <div className="h-full">
          <SystemDashboard />
        </div>
      ),
      description: 'Real-time system optimization and monitoring'
    },
    {
      id: 'profile',
      name: 'User Profile',
      icon: '👤',
      component: () => (
        <div className="h-full p-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">User Profile Settings</h2>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={userProfile.name}
                      onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ancestry</label>
                    <input
                      type="text"
                      value={userProfile.ancestry}
                      onChange={(e) => setUserProfile({...userProfile, ancestry: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Goals</label>
                  <textarea
                    value={userProfile.businessGoals}
                    onChange={(e) => setUserProfile({...userProfile, businessGoals: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Theme</h4>
                      <p className="text-sm text-gray-600">Choose your preferred interface theme</p>
                    </div>
                    <select
                      value={userProfile.preferences.theme}
                      onChange={(e) => setUserProfile({
                        ...userProfile, 
                        preferences: {...userProfile.preferences, theme: e.target.value}
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Notifications</h4>
                      <p className="text-sm text-gray-600">Receive notifications for important updates</p>
                    </div>
                    <button
                      onClick={() => setUserProfile({
                        ...userProfile, 
                        preferences: {...userProfile.preferences, notifications: !userProfile.preferences.notifications}
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        userProfile.preferences.notifications ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        userProfile.preferences.notifications ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Voice Enabled</h4>
                      <p className="text-sm text-gray-600">Enable voice interaction features</p>
                    </div>
                    <button
                      onClick={() => setUserProfile({
                        ...userProfile, 
                        preferences: {...userProfile.preferences, voiceEnabled: !userProfile.preferences.voiceEnabled}
                      })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        userProfile.preferences.voiceEnabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        userProfile.preferences.voiceEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Cultural Focus</h4>
                      <p className="text-sm text-gray-600">Primary cultural heritage focus</p>
                    </div>
                    <select
                      value={userProfile.preferences.culturalFocus}
                      onChange={(e) => setUserProfile({
                        ...userProfile, 
                        preferences: {...userProfile.preferences, culturalFocus: e.target.value}
                      })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="global">Global</option>
                      <option value="european">European</option>
                      <option value="asian">Asian</option>
                      <option value="african">African</option>
                      <option value="indigenous">Indigenous</option>
                      <option value="middle-eastern">Middle Eastern</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Discover & Understanding</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">AI Learning Progress</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-700">Cultural Patterns</span>
                        <span className="text-blue-900 font-medium">87%</span>
                      </div>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: '87%'}}></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">Family Tree Insights</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-green-700">Connections Discovered</span>
                        <span className="text-green-900 font-medium">23</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-green-700">Generations Mapped</span>
                        <span className="text-green-900 font-medium">5</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">Business Automation</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-700">Workflows Active</span>
                        <span className="text-purple-900 font-medium">12</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-700">Time Saved</span>
                        <span className="text-purple-900 font-medium">47 hours</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      description: 'Personalize your experience and discover insights'
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabData?.component || (() => <div>Component not found</div>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Genesis Heritage Pro
                </h1>
                <p className="text-xs text-gray-500">AI-Powered Heritage & Automation Platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>All Systems Optimal</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Description */}
      {activeTabData && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{activeTabData.icon}</span>
              <div>
                <h2 className="font-semibold">{activeTabData.name}</h2>
                <p className="text-sm opacity-90">{activeTabData.description}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <ActiveComponent />
        </div>
      </main>
    </div>
  );
};

function AppContent() {
  const { session, loading } = useSession();
  console.log('🔍 AppContent rendering...', { session: !!session, loading });
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Genesis Heritage Pro</h1>
          <p className="text-gray-600">Loading your personalized experience...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return <ComprehensiveDashboard />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <Router>
          <AppContent />
          <Toaster position="top-right" />
        </Router>
      </SessionProvider>
    </QueryClientProvider>
  );
}

export default App; 