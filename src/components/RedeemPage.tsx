import React, { useState } from 'react';
import { Gift as GiftIcon, Loader2, PartyPopper } from 'lucide-react';
import { useSession } from '../lib/session-context';
import { cleanGiftCode, formatGiftCode, redeemGiftCode, rememberGiftCode, takeGiftCode } from '../lib/gifts';
import { locale, t, useLang } from '../lib/i18n';
import { useSaveGuard } from '../lib/use-save-guard';
import LanguageSwitch from './LanguageSwitch';

const codeFromLink = () => {
  try { return new URLSearchParams(window.location.search).get('code') ?? ''; } catch { return ''; }
};

/** Someone who was given Pro enters their gift code. Signed-out visitors make a free account first. */
export default function RedeemPage() {
  useLang();
  const { session, refreshSubscription } = useSession();
  const [code, setCode] = useState(() => formatGiftCode(codeFromLink() || takeGiftCode()));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [until, setUntil] = useState<string | null>(null);
  const guard = useSaveGuard();
  const ready = cleanGiftCode(code).length === 12;

  const redeem = guard(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!session) {
      // Keep the code on this device while they make an account, then bring them back here.
      rememberGiftCode(code);
      window.location.assign('/?start=signup&next=redeem');
      return;
    }
    setBusy(true);
    const result = await redeemGiftCode(code);
    setBusy(false);
    if (!result.ok) { setError(t(result.reason)); return; }
    setUntil(result.until);
    void refreshSubscription?.();
  });

  return (
    <main className="min-h-screen bg-[#faf7f0] text-[#1f3a2e]">
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <a href={session ? '/dashboard' : '/'} className="text-sm text-[#2E5A44] underline">← Genesis Heritage</a>
          <LanguageSwitch className="text-sm text-[#3d4a43]" />
        </div>
        <h1 className="text-3xl font-bold flex items-center gap-3"><GiftIcon className="w-8 h-8 text-[#2E5A44]" aria-hidden /> {t('Use your gift code')}</h1>

        {until ? (
          <section className="rounded-2xl bg-white border border-black/10 p-6 space-y-3" role="status" data-testid="redeem-done">
            <p className="flex items-center gap-2 text-xl font-semibold"><PartyPopper className="w-6 h-6 text-[#2E5A44]" aria-hidden /> {t('Your gift is ready!')}</p>
            <p>{t('You have Genesis Heritage Pro until {date}.', { date: new Date(until).toLocaleDateString(locale()) })}</p>
            <a href="/dashboard" className="inline-flex items-center justify-center min-h-[44px] px-6 rounded-full bg-[#2E5A44] text-white font-semibold">{t('Start my family story')}</a>
          </section>
        ) : (
          <form onSubmit={redeem} className="rounded-2xl bg-white border border-black/10 p-6 space-y-4" data-testid="redeem-form">
            <p className="text-[#3d4a43]">{t('Enter the 12-character code from your gift card. Dashes and spaces don’t matter.')}</p>
            <div>
              <label htmlFor="gift-code" className="block text-sm font-medium mb-1">{t('Gift code')}</label>
              <input id="gift-code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={20} autoComplete="off" autoCapitalize="characters" spellCheck={false}
                className="w-full px-3 py-3 border rounded-lg font-mono text-xl tracking-widest uppercase" placeholder="ABCD-EFGH-JKMN" />
            </div>
            {error && <p className="text-red-700" role="alert">{error}</p>}
            {!session && <p className="text-sm text-[#5c6660]">{t('Next, you’ll sign in or create a free account. Your code is kept on this device.')}</p>}
            <button disabled={busy || !ready} className="w-full flex items-center justify-center gap-2 min-h-[48px] rounded-full bg-[#2E5A44] text-white text-lg font-semibold disabled:opacity-50">
              {busy && <Loader2 className="w-5 h-5 animate-spin" aria-hidden />} {session ? t('Use my gift') : t('Continue')}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
