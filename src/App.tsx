import React from 'react';
import { AuthProvider } from './components/AuthProvider';
import { Toaster } from 'sonner';
import EliteHackathonApp from './components/EliteHackathonApp';
import { ErrorBoundary } from './lib/error-boundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <EliteHackathonApp />
      </AuthProvider>
      <Toaster position="top-right" />
    </ErrorBoundary>
  );
}

export default App;