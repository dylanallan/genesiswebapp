import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface SubscriptionInfo {
  status: string; // active | pending | past_due | canceled | none ...
  active: boolean; // true when the user has Pro access (server rule: has_pro_access)
  provider: string | null; // paypal | etransfer | paypal_link
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

interface SessionContextType {
  session: Session | null;
  user: User | null;
  loading: boolean; // true until we know whether someone is signed in
  subscription: SubscriptionInfo;
  subscriptionLoading: boolean;
  refreshSubscription: () => Promise<void>;
}

const NO_SUBSCRIPTION: SubscriptionInfo = { status: 'none', active: false, provider: null, currentPeriodEnd: null, cancelAtPeriodEnd: false };

const SessionContext = createContext<SessionContextType | null>(null);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within a SessionProvider');
  return context;
};

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo>(NO_SUBSCRIPTION);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // Track sign-in state. onAuthStateChange fires INITIAL_SESSION on mount, then every sign-in,
  // sign-out, token refresh and OAuth redirect (so Google sign-in lands correctly).
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (!cancelled) {
        setSession(data.session);
        setLoading(false);
      }
    }).catch(() => !cancelled && setLoading(false));

    const { data } = supabase.auth.onAuthStateChange((_event: string, next: Session | null) => {
      setSession(next);
      setLoading(false);
    });
    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id;

  const refreshSubscription = useCallback(async () => {
    if (!userId) {
      setSubscription(NO_SUBSCRIPTION);
      return;
    }
    setSubscriptionLoading(true);
    try {
      const [{ data, error }, { data: hasPro, error: accessError }] = await Promise.all([
        supabase.from('subscriptions').select('status,provider,current_period_end,cancel_at_period_end').eq('user_id', userId).maybeSingle(),
        supabase.rpc('has_pro_access', { p_user: userId }),
      ]);
      if (error) throw error;
      if (accessError) throw accessError;
      setSubscription(
        data
          ? {
              status: data.status,
              active: hasPro === true,
              provider: data.provider ?? null,
              currentPeriodEnd: data.current_period_end,
              cancelAtPeriodEnd: data.cancel_at_period_end,
            }
          : NO_SUBSCRIPTION,
      );
    } catch (e) {
      console.error('Could not load subscription', e);
      setSubscription(NO_SUBSCRIPTION);
    } finally {
      setSubscriptionLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refreshSubscription();
  }, [refreshSubscription]);

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, loading, subscription, subscriptionLoading, refreshSubscription }),
    [session, loading, subscription, subscriptionLoading, refreshSubscription],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};
