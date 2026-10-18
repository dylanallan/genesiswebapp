import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useSession } from '../lib/session-context';
import { signOut } from '../lib/supabase';
import { SetNewPassword } from './SetNewPassword';
import { syncPayPalSubscription } from '../lib/billing';
import { t, useLang } from '../lib/i18n';
import LanguageSwitch from './LanguageSwitch';

// Slim top bar on every screen: navigation, plan badge, upgrade / sign out.
export default function AccountBar() {
  useLang();
  const [changingPassword, setChangingPassword] = useState(false);
  const { user, subscription, refreshSubscription } = useSession();
  const [params, setParams] = useSearchParams();

  // PayPal sends people back with ?checkout=success|cancelled
  useEffect(() => {
    const result = params.get('checkout');
    if (!result) return;
    if (result === 'success') {
      params.delete('checkout');
      setParams(params, { replace: true });
      // Confirm with PayPal right away instead of waiting for the webhook.
      syncPayPalSubscription()
        .then(({ status }) => {
          if (status === 'active' || status === 'unchanged') toast.success(t('Payment confirmed — welcome to Pro!'));
          else toast.info(t('PayPal is still confirming your payment. Your plan will update shortly.'));
        })
        .catch(() => toast.info(t('PayPal is still confirming your payment. Your plan will update shortly.')))
        .finally(() => void refreshSubscription());
      return;
    }
    toast.info(t('Checkout cancelled — you have not been charged.'));
    params.delete('checkout');
    setParams(params, { replace: true });
  }, [params, setParams, refreshSubscription]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      toast.error(t('Could not sign out. Please try again.'));
    }
  };

  if (changingPassword) {
    return <SetNewPassword title={t('Change your password')} onDone={() => setChangingPassword(false)} onCancel={() => setChangingPassword(false)} />;
  }

  return (
    <nav className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b bg-white px-4 py-2 text-sm" aria-label={t('Account')}>
      <div className="flex items-center gap-4">
        <Link to="/" className="font-semibold text-genesis-700 whitespace-nowrap">Genesis Heritage</Link>
        <Link to="/dashboard" className="text-gray-700 hover:text-genesis-700">{t('Dashboard')}</Link>
        <Link to="/pricing" className="text-gray-700 hover:text-genesis-700">{t('Plans')}</Link>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className={`rounded-full px-2 py-0.5 text-xs ${subscription.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
          {subscription.active ? 'Pro' : t('Free')}
        </span>
        {!subscription.active && <Link to="/pricing" className="rounded bg-genesis-600 px-3 py-1 text-white">{t('Upgrade')}</Link>}
        <span className="hidden text-gray-500 sm:inline">{user?.email}</span>
        <LanguageSwitch className="whitespace-nowrap text-gray-600" />
        {/* On phones this lives in My account, to keep the top bar to one short row. */}
        <button onClick={() => setChangingPassword(true)} className="hidden sm:inline whitespace-nowrap text-gray-600 hover:text-genesis-700">{t('Change password')}</button>
        <button onClick={handleSignOut} className="whitespace-nowrap text-gray-600 hover:text-red-600">{t('Sign out')}</button>
      </div>
    </nav>
  );
}
