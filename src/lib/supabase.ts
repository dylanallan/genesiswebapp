import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Ensure URL is properly formatted
const formattedUrl = supabaseUrl.trim().replace(/\/+$/, '');
if (!formattedUrl.startsWith('https://')) {
  throw new Error('Supabase URL must start with https://');
}

// Create and export the Supabase client
export const supabase = createClient(formattedUrl, supabaseAnonKey.trim(), {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Add error handling for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  switch (event) {
    case 'SIGNED_IN':
      toast.success('Successfully signed in!');
      break;
    case 'SIGNED_OUT':
      toast.info('Signed out');
      break;
    case 'USER_UPDATED':
      toast.success('Profile updated');
      break;
  }
});