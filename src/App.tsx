import React, { useState, useEffect } from 'react';
import { AuthProvider } from './components/AuthProvider';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './lib/error-boundary';
import { MainApp } from './components/MainApp';
import { LoadingSpinner } from './components/LoadingSpinner';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
      <Toaster position="top-right" />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Simplified loading logic to prevent crashes
    const timer = setTimeout(() => {
      try {
        // Check if Supabase is available
        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          throw new Error('Supabase configuration is missing. Please check your environment variables.');
        }
        setIsLoading(false);
      } catch (err) {
        console.error('App initialization error:', err);
        setError(err instanceof Error ? err : new Error('Unknown error during initialization'));
        setIsLoading(false);
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-genesis-50 via-white to-spiritual-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading Genesis Heritage..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-genesis-50 via-white to-spiritual-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex items-center space-x-2 text-red-600 mb-4">
            <AlertCircle className="w-6 h-6" />
            <h2 className="text-lg font-semibold">Application Error</h2>
          </div>
          <p className="text-gray-600 mb-4">
            We encountered an error while initializing the application:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-4 overflow-auto max-h-32">
            <code className="text-sm text-red-600">{error.message}</code>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return <MainApp />;
}

// Add missing AlertCircle component
function AlertCircle(props) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export default App;