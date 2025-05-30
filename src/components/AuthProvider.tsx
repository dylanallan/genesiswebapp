import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';
import { useAtom } from 'jotai';
import { userSessionAtom } from '../lib/store';
import { initializeSession } from '../lib/session';
import { toast } from 'sonner';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useAtom(userSessionAtom);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        initializeSession(session.user.id)
          .then(userSession => setSession(userSession))
          .catch(error => {
            console.error('Error initializing session:', error);
            toast.error('Error initializing your session');
          });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        initializeSession(session.user.id)
          .then(userSession => setSession(userSession))
          .catch(error => {
            console.error('Error initializing session:', error);
            toast.error('Error initializing your session');
          });
      } else {
        setSession(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={['google']}
            redirectTo={window.location.origin}
            theme="light"
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};