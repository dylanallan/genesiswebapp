import React from 'react';
import { ArrowRight, Check, Download, Upload } from 'lucide-react';
import { useSession } from '../lib/session-context';
import { t, useLang } from '../lib/i18n';
import LanguageSwitch from './LanguageSwitch';

// "Move from Ancestry or MyHeritage": how to download a GEDCOM file from each site, in plain steps, then straight
// into our tree import. Steps are written in general terms because both sites move their menus around.
const STEPS: Record<'ancestry' | 'myheritage', string[]> = {
  ancestry: [
    'Sign in to Ancestry on a computer (the phone app can’t download your tree).',
    'Open your tree, then open the tree’s name menu and choose Tree settings.',
    'Choose Export tree. Ancestry gets the file ready, which can take a few minutes for a big tree.',
    'Click Download your GEDCOM file. It is saved to your computer, usually in Downloads, with a name ending in .ged.',
  ],
  myheritage: [
    'Sign in to MyHeritage on a computer.',
    'Go to Family tree, then Manage trees.',
    'Next to your tree, choose Export to GEDCOM and start the export.',
    'MyHeritage emails you a link when the file is ready. Open the email and download the file (it ends in .ged, sometimes inside a .zip).',
  ],
};

const FACTS = [
  'Nothing is deleted from Ancestry or MyHeritage. Downloading a copy leaves your old tree exactly as it was.',
  'A GEDCOM file holds people, dates, places, relationships and notes. It is the standard file every family tree site uses.',
  'Photos, documents and DNA results are not inside a GEDCOM file. You can add photos to Genesis yourself, and DNA results are downloaded separately from each site.',
  'Your tree stays private in Genesis. We never sell your data or your family’s data.',
];

export const SwitchGuide: React.FC = () => {
  useLang();
  const { session } = useSession();
  const importHref = session ? '/dashboard?feature=tree-import' : '/?start=signup';

  return (
    <main className="min-h-screen bg-[#faf7f0] text-[#1f3a2e]">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between gap-3">
          <a href="/" className="text-sm text-[#2E5A44] underline">← Genesis Heritage</a>
          <LanguageSwitch className="text-sm text-[#3d4a43]" />
        </div>
        <header className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold">{t('Move your tree from Ancestry or MyHeritage in 5 minutes')}</h1>
          <p className="text-lg text-[#3d4a43]">{t('Download one file from your old site, then upload it here. Your people, dates and places come with you.')}</p>
        </header>

        {(['ancestry', 'myheritage'] as const).map((site) => (
          <section key={site} className="bg-white rounded-2xl border border-black/10 p-6 space-y-4" aria-labelledby={`steps-${site}`}>
            <h2 id={`steps-${site}`} className="flex items-center gap-2 text-2xl font-semibold">
              <Download className="w-6 h-6" aria-hidden /> {site === 'ancestry' ? t('From Ancestry') : t('From MyHeritage')}
            </h2>
            <ol className="space-y-3 list-decimal pl-6 text-lg">
              {STEPS[site].map((s) => <li key={s}>{t(s)}</li>)}
            </ol>
          </section>
        ))}

        <section className="bg-white rounded-2xl border border-black/10 p-6 space-y-4" aria-labelledby="steps-genesis">
          <h2 id="steps-genesis" className="flex items-center gap-2 text-2xl font-semibold"><Upload className="w-6 h-6" aria-hidden /> {t('Then, in Genesis')}</h2>
          <ol className="space-y-3 list-decimal pl-6 text-lg">
            <li>{t('Create your free account, or sign in.')}</li>
            <li>{t('Choose Import a tree and pick the .ged file you downloaded.')}</li>
            <li>{t('Check the summary and tap Import. Big trees take a minute.')}</li>
          </ol>
          <a href={importHref} className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#2E5A44] text-white text-lg font-semibold shadow">
            {session ? t('Import my tree now') : t('Create my free account and import')} <ArrowRight className="w-5 h-5" aria-hidden />
          </a>
        </section>

        <section className="space-y-3" aria-labelledby="good-to-know">
          <h2 id="good-to-know" className="text-2xl font-semibold">{t('Good to know')}</h2>
          <ul className="space-y-3">
            {FACTS.map((f) => (
              <li key={f} className="flex gap-3 text-lg"><Check className="w-6 h-6 shrink-0 text-[#2E5A44]" aria-hidden /> <span>{t(f)}</span></li>
            ))}
          </ul>
        </section>

        <p className="text-sm text-[#5c6660]">{t('The menus on other sites can change. If a step looks different, search their help pages for “export GEDCOM”.')}</p>
        <p className="text-xs text-[#5c6660]">{t('Ancestry and MyHeritage are trademarks of their respective owners. Genesis Heritage is an independent service and is not affiliated with them.')}</p>
      </div>
    </main>
  );
};

export default SwitchGuide;
