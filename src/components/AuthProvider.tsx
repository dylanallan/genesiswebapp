import React, { useEffect, useState, ReactNode } from 'react';
import { SessionProvider, useSession } from '../lib/session-context';
import { supabase } from '../lib/supabase';
import { Auth } from './Auth';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { initializeBackend } from '../lib/initialize-backend';

const AuthContent: React.FC<{ children: ReactNode }> = ({ children }) => {
  const session = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session check error:', error);
        }
      } catch (error) {
        console.error('Unexpected session error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: string, session: any) => {
      if (event === 'SIGNED_IN') {
        setIsLoading(false);
        toast.success('Signed in successfully');
        await initializeBackend();
      } else if (event === 'SIGNED_OUT') {
        setIsLoading(false);
        toast.info('Signed out successfully');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      initializeBackend();
    }
  }, [session]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-genesis-50 via-white to-spiritual-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-genesis-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return <>{children}</>;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <SessionProvider 
      supabaseClient={supabase}
      initialSession={null}
    >
      <AuthContent>{children}</AuthContent>
    </SessionProvider>
  );
};