import React from 'react';
import { AuthProvider } from './components/AuthProvider';
import { SuperchargedDashboard } from './components/SuperchargedDashboard';
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <AuthProvider>
        <SuperchargedDashboard />
      </AuthProvider>
      <Toaster position="top-right" />
    </>
  );
}

export default App;