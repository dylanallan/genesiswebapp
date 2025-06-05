import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

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
  }
});