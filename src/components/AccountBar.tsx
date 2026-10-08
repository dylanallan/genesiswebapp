import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useSession } from '../lib/session-context';
import { signOut } from '../lib/supabase';

// Slim top bar on every screen: navigation, plan badge, upgrade / sign out.
export default function AccountBar() {
  const { user, subscription, refreshSubscription } = useSession();
  const [params, setParams] = useSearchParams();

  // Stripe sends people back with ?checkout=success|cancelled
  useEffect(() => {
    const result = params.get('checkout');
    if (!result) return;
    if (result === 'success') {
      toast.success('Payment received — welcome to Pro!');
      void refreshSubscription();
      // The webhook can land a moment after the redirect; check again shortly.
      const t = setTimeout(() => void refreshSubscription(), 3000);
      params.delete('checkout');
      setParams(params, { replace: true });
      return () => clearTimeout(t);
    }
    toast.info('Checkout cancelled — you have not been charged.');
    params.delete('checkout');
    setParams(params, { replace: true });
  }, [params, setParams, refreshSubscription]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      toast.error('Could not sign out. Please try again.');
    }
  };

  return (
    <nav className="flex items-center justify-between gap-3 border-b bg-white px-4 py-2 text-sm" aria-label="Account">
      <div className="flex items-center gap-4">
        <Link to="/" className="font-semibold text-blue-700">Genesis Heritage Pro</Link>
        <Link to="/dashboard" className="text-gray-700 hover:text-blue-700">Dashboard</Link>
        <Link to="/pricing" className="text-gray-700 hover:text-blue-700">Plans</Link>
      </div>
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-2 py-0.5 text-xs ${subscription.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
          {subscription.active ? 'Pro' : 'Free'}
        </span>
        {!subscription.active && <Link to="/pricing" className="rounded bg-blue-600 px-3 py-1 text-white">Upgrade</Link>}
        <span className="hidden text-gray-500 sm:inline">{user?.email}</span>
        <button onClick={handleSignOut} className="text-gray-600 hover:text-red-600">Sign out</button>
      </div>
    </nav>
  );
}
