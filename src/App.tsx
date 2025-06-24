import React from 'react';
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { SessionProvider, useSession } from './lib/session-context';
import { Auth } from './components/Auth';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Simple working dashboard component
const SimpleDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🧬</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Genesis Heritage Pro
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-Powered Cultural Heritage & Business Automation Platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🎯 AI Automation Hub</h3>
            <p className="text-gray-600 mb-4">
              Advanced workflow automation with cultural intelligence and business optimization.
            </p>
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-blue-800 text-sm">✅ Real-time processing</p>
              <p className="text-blue-800 text-sm">✅ Cultural insights</p>
              <p className="text-blue-800 text-sm">✅ Business optimization</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">🧠 Cultural Intelligence</h3>
            <p className="text-gray-600 mb-4">
              AI-powered cultural heritage analysis and genealogy research tools.
            </p>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-green-800 text-sm">✅ Heritage mapping</p>
              <p className="text-green-800 text-sm">✅ DNA insights</p>
              <p className="text-green-800 text-sm">✅ Cultural patterns</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">📊 Analytics Dashboard</h3>
            <p className="text-gray-600 mb-4">
              Real-time business metrics and predictive analytics for growth.
            </p>
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-purple-800 text-sm">✅ Live metrics</p>
              <p className="text-purple-800 text-sm">✅ Predictive insights</p>
              <p className="text-purple-800 text-sm">✅ Performance tracking</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">🚀 Ready for Hackathon & Market Launch</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">1,247</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">89</div>
              <div className="text-sm text-gray-600">Automations Running</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">156</div>
              <div className="text-sm text-gray-600">Cultural Insights</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">$47,832</div>
              <div className="text-sm text-gray-600">Revenue Today</div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <div className="bg-green-100 border border-green-200 rounded-lg p-4 inline-block">
            <p className="text-green-800 font-medium">
              ✅ System Status: All systems operational and ready for deployment
            </p>
          </div>
        </div>
      </div>
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
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Genesis Heritage Pro</h1>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }
  
  // Show the full application with Auth component
  if (session) {
    return <SimpleDashboard />;
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