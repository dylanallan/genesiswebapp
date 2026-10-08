import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '../lib/session-context';
import { openBillingPortal, startCheckout } from '../lib/billing';

const FREE_DAILY = Number(import.meta.env.VITE_FREE_DAILY_MESSAGES ?? 10);
const MONTHLY_PRICE = import.meta.env.VITE_PRICE_MONTHLY_LABEL ?? '$19 / month';
const YEARLY_PRICE = import.meta.env.VITE_PRICE_YEARLY_LABEL ?? '$190 / year';

const FREE_FEATURES = [`${FREE_DAILY} AI messages per day`, 'Family tree & traditions library', 'Cultural recipe & story library'];
const PRO_FEATURES = [
  'Generous daily AI chat limits',
  'Voice narration of family stories',
  'Voice-story generation',
  'Workflow & automation tools',
  'Priority support',
];

export default function PricingPage() {
  const { subscription, subscriptionLoading } = useSession();
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(null);
    }
  };

  if (subscriptionLoading) {
    return <div className="p-12 flex justify-center"><Loader2 className="animate-spin" aria-label="Loading plan" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-2">Choose your plan</h1>
      <p className="text-center text-gray-600 mb-8">Cancel anytime from the billing portal.</p>

      {subscription.active && (
        <div className="mb-8 rounded-lg border border-green-200 bg-green-50 p-4 text-green-900 flex flex-wrap items-center justify-between gap-3">
          <span>
            You're on <strong>Pro</strong>
            {subscription.currentPeriodEnd && (
              <> — {subscription.cancelAtPeriodEnd ? 'ends' : 'renews'} {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</>
            )}
          </span>
          <button onClick={() => run('portal', openBillingPortal)} disabled={busy === 'portal'} className="rounded bg-green-700 px-4 py-2 text-white disabled:opacity-50">
            {busy === 'portal' ? 'Opening…' : 'Manage billing'}
          </button>
        </div>
      )}
      {subscription.status === 'past_due' && (
        <div className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
          Your last payment failed. Please update your card to keep Pro access.{' '}
          <button className="underline" onClick={() => run('portal', openBillingPortal)}>Update payment method</button>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <section className="rounded-xl border bg-white p-6">
          <h2 className="text-xl font-semibold">Free</h2>
          <p className="my-3 text-2xl font-bold">$0</p>
          <ul className="space-y-2 text-sm">{FREE_FEATURES.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" />{f}</li>)}</ul>
        </section>

        {(['monthly', 'yearly'] as const).map((plan) => (
          <section key={plan} className="rounded-xl border-2 border-blue-600 bg-white p-6">
            <h2 className="text-xl font-semibold">Pro {plan === 'yearly' && <span className="ml-1 rounded bg-blue-100 px-2 text-xs text-blue-800">Best value</span>}</h2>
            <p className="my-3 text-2xl font-bold">{plan === 'monthly' ? MONTHLY_PRICE : YEARLY_PRICE}</p>
            <ul className="mb-5 space-y-2 text-sm">{PRO_FEATURES.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" />{f}</li>)}</ul>
            <button
              onClick={() => run(plan, () => startCheckout(plan))}
              disabled={subscription.active || busy !== null}
              className="w-full rounded bg-blue-600 py-2 text-white disabled:opacity-50"
            >
              {subscription.active ? 'Current plan' : busy === plan ? 'Redirecting to checkout…' : 'Upgrade'}
            </button>
          </section>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-gray-500">Payments are processed securely by Stripe. We never see or store your card number.</p>
    </div>
  );
}
