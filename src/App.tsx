import React from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';

function App() {
  const session = useSession();

  if (!session) {
    return <Auth />;
  }

  return <Dashboard />;
}

export default App;