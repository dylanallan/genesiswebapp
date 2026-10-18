import { TAGLINE } from '../lib/brand';
import { t, useLang } from '../lib/i18n';
import { useEffect, useState } from 'react';
import { Check, Gift, Loader2 } from 'lucide-react';
import PaymentInstructions from './PaymentInstructions';
import { toast } from 'sonner';
import { useSession } from '../lib/session-context';
import {
  cancelPayPalSubscription, createManualPaymentRequest, formatCad, getManualPaymentSettings, isPayPalLink,
  paypalSubscriptionsEnabled, startCheckout, PAYPAL_MANAGE_URL, type ManualPaymentSettings, type ManualPayment,
} from '../lib/billing';

const FREE_DAILY = Number(import.meta.env.VITE_FREE_DAILY_MESSAGES ?? 10);
const MONTHLY_PRICE = import.meta.env.VITE_PRICE_MONTHLY_LABEL ?? '$19 / month';
const YEARLY_PRICE = import.meta.env.VITE_PRICE_YEARLY_LABEL ?? '$190 / year';

const FREE_FEATURES = [
  'Unlimited family tree, with Ancestry / GEDCOM import and export', 'Free historical records search, no paywall',
  'Interview recordings, stories, recipes and photos', 'Share with family members for free', '{n} AI messages per day',
];
// Plain promises about money and data. Each one is true of how the app works today; keep it that way.
const PROMISES = [
  'Cancel in one tap on this page. No phone calls, no forms, no questions.',
  'If you cancel, you keep Pro until the end of the time you paid for.',
  'e-Transfer and one-time PayPal payments never renew. We never charge you without asking.',
  'Stop paying and your tree, photos, stories and recordings stay yours on the free plan. Download everything any time.',
  'One clear price in Canadian dollars. No teaser rates and no add-on packs.',
  'We never sell your data or your family\'s data.',
];

const PRO_FEATURES = [
  'Everything in Free', 'Generous daily AI limits: write storybooks as often as you like', 'Restore and colourise old photos (10 a day)', 'Priority support',
];

/** Plans and payment. `signedOut`: a visitor comparing prices; each plan offers a free account first. */
export default function PricingPage({ signedOut = false }: { signedOut?: boolean } = {}) {
  useLang();
  const { subscription, subscriptionLoading, refreshSubscription } = useSession();
  const [busy, setBusy] = useState<string | null>(null);
  const [manual, setManual] = useState<ManualPaymentSettings | null>(null);
  const [autoPayPal, setAutoPayPal] = useState(true);
  const [request, setRequest] = useState<ManualPayment | null>(null);

  useEffect(() => {
    if (signedOut) return; // payment options are shown once they have an account
    getManualPaymentSettings().then(setManual).catch(() => setManual(null));
    paypalSubscriptionsEnabled().then(setAutoPayPal);
  }, [signedOut]);

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

  if (subscriptionLoading && !signedOut) {
    return <div className="p-12 flex justify-center"><Loader2 className="animate-spin" aria-label="Loading plan" /></div>;
  }

  const endDate = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : null;
  const isPayPal = subscription.provider === 'paypal';
  const renewing = subscription.active && isPayPal && subscription.status === 'active';

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-2">{t('Choose your plan')}</h1>
      <p className="text-center text-genesis-700 italic mb-2">{t(TAGLINE)}</p>
      <p className="text-center text-gray-600 mb-8">{t('Pay with PayPal (cards accepted) or by Interac e-Transfer.')}</p>

      {subscription.active && (
        <div className="mb-8 rounded-lg border border-green-200 bg-green-50 p-4 text-green-900 flex flex-wrap items-center justify-between gap-3">
          <span>
            You're on <strong>Pro</strong>
            {endDate && <> — {renewing ? `renews ${endDate}` : `paid through ${endDate}`}</>}
            {subscription.provider === 'etransfer' && ' (e-Transfer, does not renew automatically)'}
            {subscription.provider === 'paypal_link' && ' (PayPal one-time payment, does not renew automatically)'}
            {subscription.provider === 'gift' && ` (${t('a gift, does not renew automatically')})`}
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
          <h2 className="text-xl font-semibold">{t('Free')}</h2>
          <p className="my-3 text-2xl font-bold">{t('$0')}</p>
          <ul className="space-y-2 text-sm">{FREE_FEATURES.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" />{t(f, { n: FREE_DAILY })}</li>)}</ul>
        </section>

        {(['monthly', 'yearly'] as const).map((plan) => (
          <section key={plan} className="rounded-xl border-2 border-genesis-600 bg-white p-6">
            <h2 className="text-xl font-semibold">Pro {plan === 'yearly' && <span className="ml-1 rounded bg-genesis-100 px-2 text-xs text-genesis-800">{t('Best value')}</span>}</h2>
            <p className="my-3 text-2xl font-bold">{t(plan === 'monthly' ? MONTHLY_PRICE : YEARLY_PRICE)}</p>
            <ul className="mb-5 space-y-2 text-sm">{PRO_FEATURES.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-green-600 mt-0.5" />{t(f)}</li>)}</ul>
            {signedOut && (
              <a href="/?start=signup&next=pricing" className="block w-full rounded bg-genesis-600 py-2 text-center font-semibold text-white">
                {t('Create a free account to choose this plan')}
              </a>
            )}
            {!signedOut && autoPayPal && (
              <button
                onClick={() => run(plan, () => startCheckout(plan))}
                disabled={renewing || busy !== null}
                className="w-full rounded bg-[#ffc439] py-2 font-semibold text-gray-900 disabled:opacity-50"
              >
                {t(renewing ? 'Current plan' : busy === plan ? 'Opening PayPal…' : 'Subscribe with PayPal')}
              </button>
            )}
            {!signedOut && manual && isPayPalLink(manual.paypalLinks[plan]) && (
              <button
                onClick={() => run(`pl-${plan}`, async () => setRequest(await createManualPaymentRequest(plan, 'paypal_link')))}
                disabled={renewing || busy !== null}
                className={`${autoPayPal ? 'mt-2 border border-gray-300 text-sm text-gray-800' : 'bg-[#ffc439] font-semibold text-gray-900'} w-full rounded py-2 disabled:opacity-50`}
              >
                {busy === `pl-${plan}` ? t('Preparing…') : t('Pay with PayPal or card ({price})', { price: formatCad(plan === 'monthly' ? manual.monthlyCents : manual.yearlyCents) })}
              </button>
            )}
            {!signedOut && manual?.etransferEmail && (
              <button
                onClick={() => run(`et-${plan}`, async () => setRequest(await createManualPaymentRequest(plan, 'etransfer')))}
                disabled={busy !== null}
                className="mt-2 w-full rounded border border-gray-300 py-2 text-sm text-gray-800 disabled:opacity-50"
              >
                {busy === `et-${plan}` ? t('Preparing…') : t('Pay by Interac e-Transfer ({price})', { price: formatCad(plan === 'monthly' ? manual.monthlyCents : manual.yearlyCents) })}
              </button>
            )}
          </section>
        ))}
      </div>

      {request && manual && <PaymentInstructions request={request} manual={manual} />}

      <p className="mt-6 text-center">
        <a href="/gift" className="inline-flex items-center gap-2 rounded-full border border-genesis-600 px-4 py-2 text-genesis-700 hover:bg-genesis-50">
          <Gift className="h-4 w-4" aria-hidden /> {t('Give Pro as a gift')}
        </a>{' '}
        <a href="/redeem" className="ml-2 text-sm text-gray-600 underline">{t('Have a gift code?')}</a>
      </p>

      <section aria-labelledby="promises" className="mt-8 rounded-xl border border-gray-200 bg-white p-5" data-testid="billing-promises">
        <h2 id="promises" className="text-lg font-semibold mb-3">{t('Our promises')}</h2>
        <ul className="space-y-2">
          {PROMISES.map((p) => (
            <li key={p} className="flex gap-2 text-gray-700"><Check className="w-5 h-5 text-green-600 shrink-0 mt-0.5" /><span>{t(p)}</span></li>
          ))}
        </ul>
      </section>

      <p className="mt-6 text-center text-xs text-gray-500">Card and PayPal payments are processed securely by PayPal. We never see or store your card or bank details.</p>
    </div>
  );
}
