import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is not defined');
}

if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is not defined');
}

// Ensure URL is properly formatted
const formattedUrl = supabaseUrl.trim();

// Create and export the Supabase client
export const supabase = createClient(formattedUrl, supabaseAnonKey);

// Add error handling for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('Successfully signed in!');
  } else if (event === 'SIGNED_OUT') {
    console.log('Signed out');
  }
});