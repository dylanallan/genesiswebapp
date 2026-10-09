import { useEffect, useState } from 'react';
import { Check, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '../lib/session-context';
import {
  cancelPayPalSubscription, createManualPaymentRequest, formatCad, getManualPaymentSettings, isPayPalLink,
  paypalSubscriptionsEnabled, startCheckout, PAYPAL_MANAGE_URL, type ManualPaymentSettings, type ManualPayment,
} from '../lib/billing';

const FREE_DAILY = Number(import.meta.env.VITE_FREE_DAILY_MESSAGES ?? 10);
const MONTHLY_PRICE = import.meta.env.VITE_PRICE_MONTHLY_LABEL ?? '$19 / month';
const YEARLY_PRICE = import.meta.env.VITE_PRICE_YEARLY_LABEL ?? '$190 / year';

const FREE_FEATURES = [`${FREE_DAILY} AI messages per day`, 'Family tree & traditions library', 'Historical records search'];
const PRO_FEATURES = ['Generous daily AI chat limits', 'Voice narration of family stories', 'Voice-story generation', 'Workflow & automation tools', 'Priority support'];

export default function PricingPage() {
  const { subscription, subscriptionLoading, refreshSubscription } = useSession();
  const [busy, setBusy] = useState<string | null>(null);
  const [manual, setManual] = useState<ManualPaymentSettings | null>(null);
  const [autoPayPal, setAutoPayPal] = useState(true);
  const [request, setRequest] = useState<ManualPayment | null>(null);

  useEffect(() => {
    getManualPaymentSettings().then(setManual).catch(() => setManual(null));
    paypalSubscriptionsEnabled().then(setAutoPayPal);
  }, []);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    try {
      await fn();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const cancel = () => run('cancel', async () => {
    if (!window.confirm('Cancel your Pro subscription? You keep Pro until the end of the period you have paid for.')) return;
    await cancelPayPalSubscription();
    await refreshSubscription();
    toast.success('Subscription cancelled. It will not renew.');
  });

  if (subscriptionLoading) {
    return <div className="p-12 flex justify-center"><Loader2 className="animate-spin" aria-label="Loading plan" /></div>;
  }

  const endDate = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : null;
  const isPayPal = subscription.provider === 'paypal';
  const renewing = subscription.active && isPayPal && subscription.status === 'active';

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-2">Choose your plan</h1>
      <p className="text-center text-gray-600 mb-8">Pay with PayPal (cards accepted) or by Interac e-Transfer.</p>

      {subscription.active && (
        <div className="mb-8 rounded-lg border border-green-200 bg-green-50 p-4 text-green-900 flex flex-wrap items-center justify-between gap-3">
          <span>
            You're on <strong>Pro</strong>
            {endDate && <> — {renewing ? `renews ${endDate}` : `paid through ${endDate}`}</>}
            {subscription.provider === 'etransfer' && ' (e-Transfer, does not renew automatically)'}
            {subscription.provider === 'paypal_link' && ' (PayPal one-time payment, does not renew automatically)'}
          </span>
          {renewing && (
            <span className="flex gap-2">
              <a href={PAYPAL_MANAGE_URL} target="_blank" rel="noopener noreferrer" className="rounded border border-green-700 px-3 py-2 text-green-800">Change payment method</a>
              <button onClick={cancel} disabled={busy === 'cancel'} className="rounded bg-green-700 px-3 py-2 text-white disabled:opacity-50">
                {busy === 'cancel' ? 'Cancelling…' : 'Cancel subscription'}
              </button>
            </span>
          )}
        </div>
      )}
      {subscription.status === 'past_due' && (
        <div className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
          PayPal could not collect your last payment. Please{' '}
          <a className="underline" href={PAYPAL_MANAGE_URL} target="_blank" rel="noopener noreferrer">update your payment method in PayPal</a>.
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
            {autoPayPal && (
              <button
                onClick={() => run(plan, () => startCheckout(plan))}
                disabled={renewing || busy !== null}
                className="w-full rounded bg-[#ffc439] py-2 font-semibold text-gray-900 disabled:opacity-50"
              >
                {renewing ? 'Current plan' : busy === plan ? 'Opening PayPal…' : 'Subscribe with PayPal'}
              </button>
            )}
            {manual && isPayPalLink(manual.paypalLinks[plan]) && (
              <button
                onClick={() => run(`pl-${plan}`, async () => setRequest(await createManualPaymentRequest(plan, 'paypal_link')))}
                disabled={renewing || busy !== null}
                className={`${autoPayPal ? 'mt-2 border border-gray-300 text-sm text-gray-800' : 'bg-[#ffc439] font-semibold text-gray-900'} w-full rounded py-2 disabled:opacity-50`}
              >
                {busy === `pl-${plan}` ? 'Preparing…' : `Pay with PayPal or card (${formatCad(plan === 'monthly' ? manual.monthlyCents : manual.yearlyCents)})`}
              </button>
            )}
            {manual?.etransferEmail && (
              <button
                onClick={() => run(`et-${plan}`, async () => setRequest(await createManualPaymentRequest(plan, 'etransfer')))}
                disabled={busy !== null}
                className="mt-2 w-full rounded border border-gray-300 py-2 text-sm text-gray-800 disabled:opacity-50"
              >
                {busy === `et-${plan}` ? 'Preparing…' : `Pay by Interac e-Transfer (${formatCad(plan === 'monthly' ? manual.monthlyCents : manual.yearlyCents)})`}
              </button>
            )}
          </section>
        ))}
      </div>

      {request && manual && (
        <section className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-6 text-blue-950" aria-live="polite">
          <h2 className="text-lg font-semibold mb-2">{request.method === 'paypal_link' ? 'Pay with PayPal' : 'Send your Interac e-Transfer'}</h2>
          <ol className="list-decimal pl-5 space-y-1 text-sm">
            <li>
              Your reference code:{' '}
              <code className="rounded bg-white px-2 py-0.5 font-mono">{request.reference_code}</code>{' '}
              <button className="inline-flex items-center gap-1 underline" onClick={() => navigator.clipboard.writeText(request.reference_code).then(() => toast.success('Copied'))}>
                <Copy className="h-3 w-3" />copy
              </button>
            </li>
            {request.method === 'paypal_link' ? (
              <li>
                <a className="font-semibold underline" href={manual.paypalLinks[request.plan]} target="_blank" rel="noopener noreferrer">Open PayPal checkout</a>{' '}
                and pay <strong>{formatCad(request.amount_cents)}</strong> with your PayPal account or a card. Paste the reference code into the note box at checkout.
              </li>
            ) : (
              <li>Send <strong>{formatCad(request.amount_cents)}</strong> to <strong>{manual.etransferEmail}</strong> and put the reference code in the message.</li>
            )}
            <li>We'll switch on Pro as soon as the payment arrives (usually within one business day). This page will show it.</li>
          </ol>
          <p className="mt-3 text-xs text-blue-800">One-time payments do not renew automatically. Pay again any time to extend; days are never lost.</p>
        </section>
      )}

      <p className="mt-6 text-center text-xs text-gray-500">Card and PayPal payments are processed securely by PayPal. We never see or store your card or bank details.</p>
    </div>
  );
}
