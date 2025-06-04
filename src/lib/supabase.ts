import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  toast.error('Missing Supabase configuration');
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage
  }
});

supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    toast.success('Successfully signed in!');
  } else if (event === 'SIGNED_OUT') {
    toast.info('Signed out');
  }
});