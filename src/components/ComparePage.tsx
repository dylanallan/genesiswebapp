import React from 'react';
import { useSession } from '../lib/session-context';
import { t, useLang } from '../lib/i18n';
import LanguageSwitch from './LanguageSwitch';

const MONTHLY_PRICE = import.meta.env.VITE_PRICE_MONTHLY_LABEL ?? '$19 / month';
const YEARLY_PRICE = import.meta.env.VITE_PRICE_YEARLY_LABEL ?? '$190 / year';
// Update this date whenever the other two columns are checked against their own published pages.
const LAST_CHECKED = '[date]';
const TO_CHECK = '[check current details]';

// Genesis vs Ancestry vs MyHeritage. Only our own column states facts; the others stay marked "to check" until
// someone has verified them on each company's own pricing and help pages. Never fill them in from memory.
const ROWS: { topic: string; genesis: string; ancestry: string; myheritage: string }[] = [
  { topic: 'Price', genesis: 'Free plan. Pro is {monthly} or {yearly} (CAD).', ancestry: '[check current price]', myheritage: '[check current price]' },
  { topic: 'Historical records', genesis: 'Free records search, no paywall', ancestry: TO_CHECK, myheritage: TO_CHECK },
  { topic: 'Your data', genesis: 'We never sell your data or your family’s data. Download everything any time.', ancestry: TO_CHECK, myheritage: TO_CHECK },
  { topic: 'Stories and voice recordings', genesis: 'Record interviews and stories in your relatives’ own voices, free', ancestry: TO_CHECK, myheritage: TO_CHECK },
  { topic: 'AI family storybook', genesis: 'Turns your tree and stories into a storybook', ancestry: TO_CHECK, myheritage: TO_CHECK },
  { topic: 'Family sharing', genesis: 'Share with family members for free', ancestry: TO_CHECK, myheritage: TO_CHECK },
  { topic: 'French', genesis: 'The whole app in Canadian French', ancestry: TO_CHECK, myheritage: TO_CHECK },
  { topic: 'Moving your tree', genesis: 'Import and export GEDCOM files, free', ancestry: TO_CHECK, myheritage: TO_CHECK },
];

export const ComparePage: React.FC = () => {
  useLang();
  const { session } = useSession();
  const cell = (s: string) => (s.startsWith('[') ? <span className="text-[#5c6660] italic">{t(s)}</span> : t(s, { monthly: MONTHLY_PRICE, yearly: YEARLY_PRICE }));

  return (
    <main className="min-h-screen bg-[#faf7f0] text-[#1f3a2e]">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <a href="/" className="text-sm text-[#2E5A44] underline">← Genesis Heritage</a>
          <LanguageSwitch className="text-sm text-[#3d4a43]" />
        </div>
        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold">{t('Genesis, Ancestry and MyHeritage, side by side')}</h1>
          <p className="text-lg text-[#3d4a43]">{t('An honest comparison of what matters most to families.')}</p>
        </header>

        {/* Phones: one card per topic, so nothing is squeezed or cut off. */}
        <div className="sm:hidden space-y-3" data-testid="compare-cards">
          {ROWS.map((r) => (
            <section key={r.topic} className="bg-white rounded-2xl border border-black/10 p-4 space-y-2">
              <h2 className="text-lg font-semibold">{t(r.topic)}</h2>
              <dl className="space-y-2">
                <div className="rounded-lg bg-[#f6faf6] p-3"><dt className="font-semibold">Genesis Heritage</dt><dd>{cell(r.genesis)}</dd></div>
                <div className="px-3"><dt className="font-semibold">Ancestry</dt><dd>{cell(r.ancestry)}</dd></div>
                <div className="px-3"><dt className="font-semibold">MyHeritage</dt><dd>{cell(r.myheritage)}</dd></div>
              </dl>
            </section>
          ))}
        </div>

        <div className="hidden sm:block overflow-x-auto bg-white rounded-2xl border border-black/10">
          <table className="w-full text-left text-base" data-testid="compare-table">
            <caption className="sr-only">{t('Genesis, Ancestry and MyHeritage, side by side')}</caption>
            <thead className="bg-[#eef3ee]">
              <tr>
                <th scope="col" className="p-4 w-1/5"><span className="sr-only">{t('Topic')}</span></th>
                <th scope="col" className="p-4">Genesis Heritage</th>
                <th scope="col" className="p-4">Ancestry</th>
                <th scope="col" className="p-4">MyHeritage</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.topic} className="border-t border-black/10 align-top">
                  <th scope="row" className="p-4 font-semibold">{t(r.topic)}</th>
                  <td className="p-4 bg-[#f6faf6]">{cell(r.genesis)}</td>
                  <td className="p-4">{cell(r.ancestry)}</td>
                  <td className="p-4">{cell(r.myheritage)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-sm text-[#5c6660]">{t('Last checked: {date}. Prices and features change, so please check each company’s own website before deciding.', { date: LAST_CHECKED })}</p>

        <div className="flex flex-wrap gap-3">
          <a href={session ? '/dashboard' : '/?start=signup'} className="px-8 py-3 rounded-full bg-[#2E5A44] text-white text-lg font-semibold shadow">{t('Start free')}</a>
          <a href="/switch" className="px-8 py-3 rounded-full border-2 border-[#2E5A44] text-[#2E5A44] text-lg font-semibold">{t('Move my tree to Genesis')}</a>
        </div>
        <p className="text-xs text-[#5c6660]">{t('Ancestry and MyHeritage are trademarks of their respective owners. Genesis Heritage is an independent service and is not affiliated with them.')}</p>
      </div>
    </main>
  );
};

export default ComparePage;
