import React from 'react';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { useSession } from '@supabase/auth-helpers-react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from './lib/supabase';

function App() {
  const session = useSession();

  return (
    <SessionContextProvider supabaseClient={supabase}>
      {!session ? <Auth /> : <Dashboard />}
    </SessionContextProvider>
  );
}

export default App;