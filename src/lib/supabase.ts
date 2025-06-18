import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Get environment variables with fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yomgwdeqsvbapvqpuspq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbWd3ZGVxc3ZiYXB2cXB1c3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MDIzNjUsImV4cCI6MjA2NDE3ODM2NX0.HBjnzvpUBuPdTkFkJDwu673d0BqsJanaoMFkhTwEdvk';

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration');
  toast.error('Missing Supabase configuration. Please check your environment variables.');
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
  
  // Create a fallback client
  supabase = {
    auth: {
      signInWithPassword: async () => ({ error: { message: 'Supabase not initialized' } }),
      signUp: async () => ({ error: { message: 'Supabase not initialized' } }),
      signOut: async () => ({ error: { message: 'Supabase not initialized' } }),
      getUser: async () => ({ data: { user: null }, error: null }),
      refreshSession: async () => ({ data: { session: null }, error: null })
    }
  };
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