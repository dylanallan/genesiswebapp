import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Get environment variables ONLY (no hardcoded fallback)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = 'Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.';
  console.error(errorMsg);
  toast.error(errorMsg);
  throw new Error(errorMsg);
}

// Create and export the Supabase client with error handling
let supabase: any = null;

try {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: localStorage,
      storageKey: 'genesis.auth.token'
    }
  });
  
  // Test the connection
  console.log('Supabase client created successfully');
} catch (error) {
  console.error('Error creating Supabase client:', error);
  toast.error('Failed to initialize Supabase client');
  throw error;
}

export { supabase };

// Export helper functions with error handling
export const getCurrentUser = async () => {
  try {
    if (!supabase?.auth) {
      console.error('Supabase auth not available');
      return null;
    }
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
    if (!supabase?.auth) {
      console.error('Supabase auth not available');
      return null;
    }
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
    if (!supabase?.auth) {
      console.error('Supabase auth not available');
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};