import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Add error handling for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    toast.success('Successfully signed in!');
  } else if (event === 'SIGNED_OUT') {
    toast.info('Signed out');
  } else if (event === 'USER_UPDATED') {
    toast.success('User profile updated');
  } else if (event === 'USER_DELETED') {
    toast.info('User account deleted');
  } else if (event === 'PASSWORD_RECOVERY') {
    toast.info('Password recovery email sent');
  }
});