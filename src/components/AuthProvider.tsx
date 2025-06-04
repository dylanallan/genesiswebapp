import React, { useEffect } from 'react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const validateSetup = async () => {
      try {
        const { error } = await supabase.auth.getSession();
        if (error) {
          console.error('Supabase initialization error:', error);
          toast.error('Failed to initialize authentication. Please check your configuration.');
        }
      } catch (error) {
        console.error('Supabase setup error:', error);
        toast.error('Authentication setup failed. Please verify your environment variables.');
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