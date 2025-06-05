import React, { useEffect } from 'react';
import { SessionContextProvider, useSession } from '@supabase/auth-helpers-react';
import { supabase } from '../lib/supabase';
import { Auth } from './Auth';
import { useAtom } from 'jotai';
import { userPreferencesAtom } from '../lib/store';

const AuthContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const session = useSession();
  const [, setPreferences] = useAtom(userPreferencesAtom);

  useEffect(() => {
    if (session?.user) {
      loadUserPreferences(session.user.id);
    }
  }, [session]);

  const loadUserPreferences = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGNF') {
        throw error;
      }

      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

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