import React, { useEffect } from 'react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const validateSetup = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Supabase initialization error:', error);
          toast.error('Failed to initialize authentication');
        }
        
        if (session) {
          // Validate session token
          const { error: validateError } = await supabase.auth.getUser(session.access_token);
          if (validateError) {
            console.error('Session validation error:', validateError);
            await supabase.auth.refreshSession();
          }
        }
      } catch (error) {
        console.error('Supabase setup error:', error);
        toast.error('Authentication setup failed');
      }
    };

    validateSetup();
  }, []);

  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  );
};