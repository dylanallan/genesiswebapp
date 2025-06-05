import React from 'react';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { useUser } from '@supabase/auth-helpers-react';

function App() {
  const user = useUser();

  if (!user) {
    return <Auth />;
  }

  return <Dashboard />;
}

export default App;