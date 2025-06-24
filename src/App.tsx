import React from 'react';
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { SessionProvider } from './lib/session-context';
import { Dashboard } from './components/Dashboard';
import { AuthProvider } from './components/AuthProvider';
import { useSession } from './lib/session-context';
import { ErrorBoundary } from './lib/error-boundary';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { session, loading } = useSession();

  console.log('🔍 AppContent render:', { session: !!session, loading });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Genesis Heritage Pro</h1>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  console.log('🎯 Rendering main app content:', { hasSession: !!session });

  return (
    <div className="App">
      {session ? (
        <ErrorBoundary>
          <Dashboard onViewModeChange={() => {}} />
        </ErrorBoundary>
      ) : (
        <ErrorBoundary>
          <AuthProvider />
        </ErrorBoundary>
      )}
    </div>
  );
}

function App() {
  console.log('🚀 App component rendering');
  
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App; 