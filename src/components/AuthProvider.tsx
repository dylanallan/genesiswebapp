import React from 'react';
import { useSession, SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '../lib/supabase';

const AuthContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const session = useSession();

  React.useEffect(() => {
    const signInAutomatically = async () => {
      if (!session) {
        const { error } = await supabase.auth.signInWithPassword({
          email: 'dylltoamill@gmail.com',
          password: 'Latino@1992'
        });
        
        if (error) {
          console.error('Auto-login error:', error);
        }
      }
    };

    signInAutomatically();
  }, [session]);

  // Show loading state while signing in
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-600">Loading...</div>
      </div>
    );
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