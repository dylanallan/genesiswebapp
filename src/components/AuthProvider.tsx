import React, { useEffect } from 'react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '../lib/supabase';
import { Auth } from './Auth';
import { useAtom } from 'jotai';
import { userPreferencesAtom } from '../lib/store';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [, setPreferences] = useAtom(userPreferencesAtom);

  useEffect(() => {
    // Load user preferences when session changes
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserPreferences(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserPreferences(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [setPreferences]);

  const loadUserPreferences = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  );
};