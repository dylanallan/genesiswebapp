import React, { useEffect } from 'react';
import { useSession, SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '../lib/supabase';
import { Auth } from './Auth';
import { toast } from 'sonner';

const AuthContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const session = useSession();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Session check error:', error);
        toast.error('Authentication error. Please sign in again.');
      }
    };

    checkSession();
  }, []);

  if (!session) {
    return <Auth />;
  }

  return <>{children}</>;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <AuthContent>{children}</AuthContent>
    </SessionContextProvider>
  );
};