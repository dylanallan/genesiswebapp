import React from 'react';
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { SessionProvider, useSession } from './lib/session-context';
import { Auth } from './components/Auth';
import { GenesisVoiceAssistant } from './components/GenesisVoiceAssistant';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Dual Chatbot X2 Dashboard - Ancestry Competitive Version
const DualChatbotDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl">
                <span className="text-white text-2xl">🧬</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Genesis Heritage Pro X2
                </h1>
                <p className="text-sm text-gray-600">Dual AI Agents • Ancestry Competitive</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-800 text-sm font-medium">Dual AI Active</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Dual Agentic AI System
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Experience the future of genealogy with our dual AI system - combining advanced chat intelligence with voice-powered family tree building to beat Ancestry.
          </p>
        </div>

        {/* Dual Chatbot Interface */}
        <div className="max-w-6xl mx-auto">
          <GenesisVoiceAssistant 
            userName="User"
            ancestry="European and Asian heritage"
            businessGoals="Automate marketing and preserve cultural knowledge"
          />
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Chat Assistant</h3>
            <p className="text-gray-600 mb-4">
              Advanced conversational AI for genealogy research, document analysis, and cultural heritage exploration.
            </p>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-blue-800 text-sm">✅ Multi-model AI routing</p>
              <p className="text-blue-800 text-sm">✅ Context-aware responses</p>
              <p className="text-blue-800 text-sm">✅ Cultural intelligence</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🎤</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Voice Family Tree Agent</h3>
            <p className="text-gray-600 mb-4">
              Voice-powered family history assistant that builds your family tree through natural conversation.
            </p>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-green-800 text-sm">✅ Voice-to-text processing</p>
              <p className="text-green-800 text-sm">✅ Automatic family member extraction</p>
              <p className="text-green-800 text-sm">✅ Confidence scoring</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Business Automation</h3>
            <p className="text-gray-600 mb-4">
              AI-powered workflow automation with cultural context awareness for modern businesses.
            </p>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-purple-800 text-sm">✅ Workflow creation</p>
              <p className="text-purple-800 text-sm">✅ Cultural integration</p>
              <p className="text-purple-800 text-sm">✅ Performance analytics</p>
            </div>
          </div>
        </div>

        {/* Competitive Advantages */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Why We Beat Ancestry</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Dual AI System</h3>
              <p className="text-gray-600 text-sm">Two specialized AI agents working together</p>
            </div>
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎤</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Voice-First Design</h3>
              <p className="text-gray-600 text-sm">Natural voice interaction for family history</p>
            </div>
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Cultural Intelligence</h3>
              <p className="text-gray-600 text-sm">Respects and integrates cultural context</p>
            </div>
            <div className="text-center p-4">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Business Integration</h3>
              <p className="text-gray-600 text-sm">Combines heritage with modern automation</p>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="bg-green-100 border border-green-200 rounded-lg p-4 inline-block">
            <p className="text-green-800 font-medium">
              ✅ Dual AI System Active • Ready for Hackathon & Market Launch
            </p>
          </div>
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
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Genesis Heritage Pro X2</h1>
          <p className="text-gray-600">Loading dual AI system...</p>
        </div>
      </div>
    );
  }
  
  // Show the dual chatbot X2 system
  if (session) {
    return <DualChatbotDashboard />;
  } else {
    return <Auth />;
  }
}

function App() {
  console.log('🚀 App component rendering');
  
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <Router>
          <AppContent />
        </Router>
      </SessionProvider>
      <Toaster 
        position="top-right"
        richColors
        closeButton
        duration={4000}
      />
    </QueryClientProvider>
  );
}

export default App; 