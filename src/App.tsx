import React from 'react';
import { Dashboard } from './components/Dashboard';
import { Toaster } from 'sonner';

function App() {
  return (
    <>
      <Dashboard />
      <Toaster position="top-right" />
    </>
  );
}

export default App;