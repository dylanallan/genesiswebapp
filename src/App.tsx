import React from 'react';
import { AuthProvider } from './components/AuthProvider';
import { ProductionDashboard } from './components/ProductionDashboard';
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <AuthProvider>
        <ProductionDashboard />
      </AuthProvider>
      <Toaster position="top-right" />
    </>
  );
}

export default App;