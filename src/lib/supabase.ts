import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration');
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
      if (session?.user?.email) {
        toast.success(`Welcome back, ${session.user.email}!`);
      }
      break;
    case 'SIGNED_OUT':
      toast.info('Signed out successfully');
      break;
    case 'TOKEN_REFRESHED':
      console.log('Auth token refreshed');
      break;
    case 'USER_UPDATED':
      toast.success('Profile updated successfully');
      break;
    case 'USER_DELETED':
      toast.info('Account deleted successfully');
      break;
    case 'PASSWORD_RECOVERY':
      toast.info('Password reset email sent');
      break;
  }
});

// Export helper functions
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

export const refreshSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error('Error refreshing session:', error);
    return null;
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};