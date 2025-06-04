import React from 'react';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { AuthProvider } from './components/AuthProvider';
import { useSession } from '@supabase/auth-helpers-react';

function AppContent() {
  const session = useSession();
  return session ? <Dashboard /> : <Auth />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;