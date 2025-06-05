import React from 'react';
import { Auth } from './Auth';
import { useSession, SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '../lib/supabase';

const AuthContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const session = useSession();

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