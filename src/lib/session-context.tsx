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
    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        if (supabase?.auth?.getSession) {
          const { data: { session: initialSession } } = await supabase.auth.getSession();
          setSession(initialSession);
        } else {
          console.warn('Supabase auth not available, using fallback session');
          setSession(null);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        setSession(null);
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Session timeout reached, setting loading to false');
      setLoading(false);
    }, 3000); // 3 second timeout

    getInitialSession();

    // Listen for auth changes
    let subscription: any = null;
    try {
      if (supabase?.auth?.onAuthStateChange) {
        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
          async (event: string, session: Session | null) => {
            console.log('Auth state changed:', event, session);
            setSession(session);
          }
        );
        subscription = authSubscription;
      } else {
        console.warn('Supabase auth onAuthStateChange not available');
      }
    } catch (error) {
      console.error('Error setting up auth state listener:', error);
    }

    return () => {
      clearTimeout(timeoutId);
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <SessionContext.Provider value={{ session, loading }}>
      {children}
    </SessionContext.Provider>
  );
}; 