import React from 'react';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { useSession } from '@supabase/auth-helpers-react';
import { AuthProvider } from './components/AuthProvider';

function App() {
  const session = useSession();

  return (
    <AuthProvider>
      {!session ? <Auth /> : <Dashboard />}
    </AuthProvider>
  );
}

export default App;