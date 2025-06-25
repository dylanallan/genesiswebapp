import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { config } from './config';

// Create and export the Supabase client with error handling
let supabase: any = null;

// Patch for Bolt.new/Bolt environments: use in-memory storage if localStorage is not available
const memoryStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

try {
  supabase = createClient(config.supabase.url, config.supabase.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' && window.localStorage ? window.localStorage : memoryStorage,
      storageKey: 'genesis.auth.token'
    }
  });
  
  // Test the connection
  console.log('✅ Supabase client created successfully');
  console.log('🔗 Supabase URL:', config.supabase.url);
} catch (error) {
  console.warn('⚠️ Using fallback Supabase client');
  
  // Create a fallback client that won't break the app
  supabase = {
    auth: {
      signInWithPassword: async () => ({ error: { message: 'Supabase not initialized' } }),
      signUp: async () => ({ error: { message: 'Supabase not initialized' } }),
      signOut: async () => ({ error: { message: 'Supabase not initialized' } }),
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      refreshSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: (callback: any) => ({
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      })
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: { message: 'Supabase not initialized' } }),
      update: () => ({ data: null, error: { message: 'Supabase not initialized' } }),
      delete: () => ({ data: null, error: { message: 'Supabase not initialized' } })
    }),
    rpc: () => ({ data: null, error: { message: 'Supabase not initialized' } })
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