import React, { useState } from 'react';
import { AuthProvider } from './components/AuthProvider';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './lib/error-boundary';
import { MainApp } from './components/MainApp';
import { useSession } from '@supabase/auth-helpers-react';
import { LoadingSpinner } from './components/LoadingSpinner';
import { BackendStatusIndicator } from './components/BackendStatusIndicator';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
      <Toaster position="top-right" />
      <BackendStatusIndicator />
    </ErrorBoundary>
  );
}

function AppContent() {
  const session = useSession();
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    // Simulate loading resources
    const timer = setTimeout(() => {
      setIsLoading(false);
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

  return <MainApp />;
}

export default App;