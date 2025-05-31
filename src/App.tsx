import React from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Loader2 } from 'lucide-react';

function App() {
  const supabase = useSupabaseClient();
  const user = useUser();

  // Show loading state while checking auth
  if (user === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-genesis-600 animate-spin" />
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!user) {
    return <Auth />;
  }

  return <Dashboard />;
}

export default App;