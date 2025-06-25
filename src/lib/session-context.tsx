import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabase';

interface Session {
  user: any;
  access_token: string;
  refresh_token: string;
}

interface SessionContextType {
  session: Session | null;
  loading: boolean;
}

const SessionContext = createContext<SessionContextType>({
  session: null,
  loading: true,
});

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let didTimeout = false;
    // Reduce timeout to 3 seconds for Bolt.new environment
    const timeout = setTimeout(() => {
      didTimeout = true;
      setLoading(false);
      if (!session) {
        console.warn('[GENESIS]: Session check timed out after 3s. Forcing loading=false.');
      }
    }, 3000);

    // Add immediate fallback for Bolt.new environment
    const immediateFallback = setTimeout(() => {
      if (loading) {
        console.log('[GENESIS]: Bolt.new environment detected, allowing fallback to auth');
        setLoading(false);
      }
    }, 1000);

    supabase.auth.getSession()
      .then(({ data: { session, error } }: { data: { session: any; error: any } }) => {
        if (!didTimeout) {
          setSession(session);
          setLoading(false);
          if (error) {
            console.warn('[GENESIS]: Supabase session error:', error.message);
          }
        }
      })
      .catch((error: any) => {
        if (!didTimeout) {
          setSession(null);
          setLoading(false);
          console.warn('[GENESIS]: Supabase session fetch failed:', error.message);
        }
      });

    return () => {
      clearTimeout(timeout);
      clearTimeout(immediateFallback);
    };
  }, []);

  return (
    <SessionContext.Provider value={{ session, loading }}>
      {children}
    </SessionContext.Provider>
  );
}; 