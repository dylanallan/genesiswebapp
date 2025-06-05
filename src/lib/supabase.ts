import { createClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

const supabaseUrl = 'https://yomgwdeqsvbapvqpuspq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbWd3ZGVxc3ZiYXB2cXB1c3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDk2NTk3NzAsImV4cCI6MjAyNTIzNTc3MH0.GG5UMtX_cX5YaJpOh5IeZhXBYEZBc-pF8MVHKvYqvL0';

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