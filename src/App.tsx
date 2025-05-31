import React from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function App() {
  const supabase = useSupabaseClient();
  const user = useUser();

  React.useEffect(() => {
    const handleAuthError = (error: Error) => {
      console.error('Authentication error:', error);
      toast.error('Authentication error. Please try again.');
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        toast.success('Successfully signed out');
      } else if (event === 'SIGNED_IN') {
        toast.success('Successfully signed in');
      } else if (event === 'USER_DELETED') {
        toast.info('Account deleted');
      } else if (event === 'USER_UPDATED') {
        toast.success('Account updated');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

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