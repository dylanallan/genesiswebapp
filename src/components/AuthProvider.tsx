import React from 'react';
import { useSession, SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '../lib/supabase';
import { Auth } from './Auth';

const AuthContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const session = useSession();

  // If there's no session, show the Auth component
  if (!session) {
    return <Auth />;
  }

  // If there is a session, render the protected content
  return <>{children}</>;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SessionContextProvider supabaseClient={supabase}>
      <AuthContent>{children}</AuthContent>
    </SessionContextProvider>
  );
};