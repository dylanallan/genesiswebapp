import React, { useCallback, useEffect, useState } from 'react';
import { Check, Gift as GiftIcon, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '../lib/session-context';
import { formatCad, getManualPaymentSettings, isPayPalLink, type ManualMethod, type ManualPayment, type ManualPaymentSettings } from '../lib/billing';
import { createGiftRequest, myGifts, type Gift, type GiftPlan } from '../lib/gifts';
import { locale, t, useLang } from '../lib/i18n';
import { useSaveGuard } from '../lib/use-save-guard';
import LanguageSwitch from './LanguageSwitch';
import PaymentInstructions from './PaymentInstructions';
import GiftCard from './GiftCard';

// Every line here is true of how gifts work (see supabase/migrations/20250701003700_gifts.sql).
const FACTS = [
  'Give one month or one year of Genesis Heritage Pro.',
  'They get a 12-character code to enter on the Genesis website. It works once.',
  'The code can be used for two years after your payment is confirmed.',
  'If they already have Pro, the gift adds time on top. Nothing is lost.',
  'It’s a one-time payment. Nothing renews, and they are never charged.',
];

const STATUS: Record<Gift['status'], string> = {
  pending: 'Waiting for your payment',
  paid: 'Ready to give',
  redeemed: 'Used',
  cancelled: 'Cancelled',
};

/** The gifts this person has bought, with the printable card once a payment is confirmed. */
export const GiftsGiven: React.FC<{ gifts: Gift[] }> = ({ gifts }) => {
  useLang();
  if (!gifts.length) return null;
  return (
    <ul className="space-y-4" data-testid="gifts-given">
      {gifts.map((g) => (
        <li key={g.id} className="rounded-xl border bg-white p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">
              {g.months === 12 ? t('One year of Pro') : t('One month of Pro')}
              {g.recipient_name ? ` · ${t('for {name}', { name: g.recipient_name })}` : ''}
            </p>
            <span className={`rounded-full px-3 py-1 text-sm ${g.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{t(STATUS[g.status])}</span>
          </div>
          {g.status === 'pending' && <p className="text-sm text-gray-600">{t('Reference code {code}, {amount}. The gift code appears here once we receive the payment.', { code: g.reference_code, amount: formatCad(g.amount_cents) })}</p>}
          {g.status === 'redeemed' && g.redeemed_at && <p className="text-sm text-gray-600">{t('Used on {date}.', { date: new Date(g.redeemed_at).toLocaleDateString(locale()) })}</p>}
          {g.status === 'paid' && <GiftCard gift={g} />}
        </li>
      ))}
    </ul>
  );
};

export default function GiftPage() {
  useLang();
  const { session } = useSession();
  const [manual, setManual] = useState<ManualPaymentSettings | null | undefined>(undefined);
  const [plan, setPlan] = useState<GiftPlan>('yearly');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState<ManualMethod | null>(null);
  const [request, setRequest] = useState<ManualPayment | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const guard = useSaveGuard();

  const loadGifts = useCallback(async () => {
    try { setGifts(await myGifts()); } catch (e) { toast.error(t((e as Error).message)); }
  }, []);

  useEffect(() => {
    if (!session) return;
    getManualPaymentSettings().then(setManual).catch(() => setManual(null));
    void loadGifts();
  }, [session, loadGifts]);

  const buy = (method: ManualMethod) => guard(async () => {
    setBusy(method);
    try {
      setRequest(await createGiftRequest(plan, method, { recipientName: name, recipientEmail: email, message }));
      void loadGifts();
    } catch (e) {
      toast.error(t((e as Error).message));
    } finally {
      setBusy(null);
    }
  })();

  const price = (p: GiftPlan) => (manual ? formatCad(p === 'monthly' ? manual.monthlyCents : manual.yearlyCents) : '');

  return (
    <main className="min-h-screen bg-[#faf7f0] text-[#1f3a2e]">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between gap-3">
          <a href={session ? '/dashboard' : '/'} className="text-sm text-[#2E5A44] underline">← Genesis Heritage</a>
          <LanguageSwitch className="text-sm text-[#3d4a43]" />
        </div>

        <section className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold flex items-center gap-3"><GiftIcon className="w-9 h-9 text-[#2E5A44]" aria-hidden /> {t('Give the gift of family history')}</h1>
          <p className="text-lg text-[#3d4a43]">{t('A thoughtful present for a parent, grandparent or anyone who loves family stories.')}</p>
          <ul className="space-y-2">
            {FACTS.map((f) => <li key={f} className="flex gap-2"><Check className="w-5 h-5 text-green-700 shrink-0 mt-0.5" aria-hidden /><span>{t(f)}</span></li>)}
          </ul>
          <p className="text-sm"><a href="/redeem" className="underline">{t('Have a gift code? Use it here.')}</a></p>
        </section>

        {!session ? (
          <section className="rounded-2xl bg-white border border-black/10 p-6 space-y-3">
            <p>{t('To buy a gift, sign in or create a free account. It takes a minute, and it’s where your gift code will appear.')}</p>
            <a href="/?start=signup&next=gift" className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-full bg-[#2E5A44] text-white font-semibold">{t('Sign in or create a free account')}</a>
          </section>
        ) : manual === undefined ? (
          <Loader2 className="animate-spin" aria-label={t('Loading…')} />
        ) : manual === null ? (
          <p className="rounded-2xl bg-white border border-black/10 p-6">{t('Gifts can be bought as soon as payments are switched on. Please check back soon.')}</p>
        ) : (
          <section className="rounded-2xl bg-white border border-black/10 p-6 space-y-4" data-testid="gift-form">
            <fieldset className="space-y-2">
              <legend className="font-semibold mb-1">{t('Choose the gift')}</legend>
              {(['yearly', 'monthly'] as const).map((p) => (
                <label key={p} className="flex items-center gap-3 min-h-[44px] px-3 border rounded-lg cursor-pointer has-[:checked]:border-[#2E5A44] has-[:checked]:bg-[#f1f6f3]">
                  <input type="radio" name="gift-plan" checked={plan === p} onChange={() => setPlan(p)} className="w-5 h-5" />
                  <span>{p === 'yearly' ? t('One year of Pro') : t('One month of Pro')} · <strong>{price(p)}</strong></span>
                </label>
              ))}
            </fieldset>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="gift-name" className="block text-sm font-medium mb-1">{t('Who is it for?')} <span className="font-normal text-[#5c6660]">{t('(optional)')}</span></label>
                <input id="gift-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="w-full px-3 py-3 border rounded-lg" placeholder={t('For example: Grandma Rosa')} />
              </div>
              <div>
                <label htmlFor="gift-email" className="block text-sm font-medium mb-1">{t('Their email')} <span className="font-normal text-[#5c6660]">{t('(optional, only for your list; we don’t email them)')}</span></label>
                <input id="gift-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} className="w-full px-3 py-3 border rounded-lg" />
              </div>
            </div>
            <div>
              <label htmlFor="gift-message" className="block text-sm font-medium mb-1">{t('A message for the card')} <span className="font-normal text-[#5c6660]">{t('(optional)')}</span></label>
              <textarea id="gift-message" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} rows={3} className="w-full px-3 py-3 border rounded-lg" />
            </div>
            <div className="flex flex-col gap-2">
              {isPayPalLink(manual.paypalLinks[plan]) && (
                <button onClick={() => buy('paypal_link')} disabled={busy !== null} className="min-h-[44px] rounded-full bg-[#ffc439] font-semibold text-gray-900 disabled:opacity-50">
                  {busy === 'paypal_link' ? t('Preparing…') : t('Pay with PayPal or card ({amount})', { amount: price(plan) })}
                </button>
              )}
              {manual.etransferEmail && (
                <button onClick={() => buy('etransfer')} disabled={busy !== null} className="min-h-[44px] rounded-full border border-gray-300 text-gray-800 disabled:opacity-50">
                  {busy === 'etransfer' ? t('Preparing…') : t('Pay by Interac e-Transfer ({amount})', { amount: price(plan) })}
                </button>
              )}
            </div>
          </section>
        )}

        {request && manual && (
          <PaymentInstructions request={request} manual={manual} footnote={false}
            done={t('As soon as the payment arrives (usually within one business day), the gift code appears below under “Your gifts”, ready to print or send.')} />
        )}

        {session && (
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-2xl font-semibold">{t('Your gifts')}</h2>
              <button onClick={() => void loadGifts()} className="inline-flex items-center gap-1 min-h-[44px] px-3 text-sm text-[#2E5A44]"><RefreshCw className="w-4 h-4" aria-hidden /> {t('Refresh')}</button>
            </div>
            {gifts.length ? <GiftsGiven gifts={gifts} /> : <p className="text-[#3d4a43]">{t('Gifts you buy will appear here.')}</p>}
          </section>
        )}
      </div>
    </main>
  );
}
