import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage,
    storageKey: 'genesis.auth.token',
    flowType: 'pkce'
  }
});

// Add error handling for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  switch (event) {
    case 'SIGNED_IN':
      toast.success(`Welcome${session?.user?.email ? ` ${session.user.email}` : ''}!`);
      break;
    case 'SIGNED_OUT':
      toast.info('Signed out successfully');
      break;
    case 'USER_UPDATED':
      toast.success('Profile updated successfully');
      break;
    case 'PASSWORD_RECOVERY':
      toast.info('Password reset email sent');
      break;
    case 'USER_DELETED':
      toast.info('Account deleted successfully');
      break;
  }
});