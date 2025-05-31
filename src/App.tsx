import React from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Loader2 } from 'lucide-react';

function App() {
  // Temporarily bypass authentication
  return <Dashboard />;
}

export default App;