import React from 'react';
import { AuthProvider } from './components/AuthProvider';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './lib/error-boundary';
import { MainApp } from './components/MainApp';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
      <Toaster position="top-right" />
    </ErrorBoundary>
  );
}

export default App;