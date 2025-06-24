import React from 'react';
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { SessionProvider } from './lib/session-context';

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
  console.log('🔍 AppContent rendering...');
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Genesis Heritage Pro</h1>
        <p className="text-gray-600">SessionProvider added - testing...</p>
        <div className="mt-4 p-4 bg-blue-100 rounded-lg">
          <p className="text-blue-800">✅ React is working</p>
          <p className="text-blue-800">✅ SessionProvider loaded</p>
          <p className="text-blue-800">✅ Testing session context...</p>
        </div>
      </div>
    </div>
  );
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