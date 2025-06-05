import React from 'react';
import { AuthProvider } from './components/AuthProvider';
import { Dashboard } from './components/Dashboard';
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <AuthProvider>
        <Dashboard />
      </AuthProvider>
      <Toaster position="top-right" />
    </>
  );
}

export default App;