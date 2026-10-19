import { BookOpen, Handshake, Landmark, TrendingUp } from 'lucide-react';
import { t, useLang } from '../lib/i18n';
import LanguageSwitch from './LanguageSwitch';
import WaitlistForm, { type Interest } from './WaitlistForm';

// Who we want to hear from before launch, and what we can offer each of them. Every line here must stay true.
const GROUPS: { id: Interest; icon: typeof Landmark; title: string; points: string[] }[] = [
  {
    id: 'society', icon: Landmark, title: 'Genealogy societies, libraries and archives',
    points: [
      'Free accounts for your volunteers while we test together',
      'A simple, bilingual tool your members can use without training',
      'Your records and collections linked back to you, never copied without permission',
      'Workshops: we can show members how to record a grandparent’s stories',
    ],
  },
  {
    id: 'partner', icon: Handshake, title: 'Business partners',
    points: [
      'Photo restoration, printing, memory books and gift shops',
      'Funeral homes and retirement residences that help families keep memories',
      'Referral and gift-subscription arrangements',
    ],
  },
  {
    id: 'investor', icon: TrendingUp, title: 'Investors and buyers',
    points: [
      'A family-history app built to beat Ancestry and MyHeritage on price, privacy and stories',
      'Bilingual from day one (English and Canadian French)',
      'Subscriptions in Canadian dollars, with the waitlist growing before launch',
      'Ask for the pitch deck and current numbers',
    ],
  },
];

export default function PartnersPage() {
  useLang();
  return (
    <div className="min-h-screen bg-[#faf7f0] text-[#1f3a2e]">
      <header className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
        <a href="/" className="font-semibold text-lg">Genesis Heritage</a>
        <LanguageSwitch className="text-[#3d4a43]" />
      </header>
      <main className="max-w-5xl mx-auto px-4 pb-16 space-y-10">
        <section className="pt-6 space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold">{t('Work with Genesis Heritage')}</h1>
          <p className="text-lg text-[#3d4a43] max-w-2xl">{t('We’re building the family-history app families actually enjoy: fair prices, free records, private by default, and real stories in real voices. We’d love to hear from people who can help.')}</p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {GROUPS.map((g) => (
            <article key={g.id} className="rounded-2xl bg-white border border-black/10 p-5 space-y-3">
              <h2 className="flex items-center gap-2 text-xl font-semibold"><g.icon className="w-6 h-6 text-[#2E5A44]" aria-hidden /> {t(g.title)}</h2>
              <ul className="space-y-2 text-[#3d4a43] list-disc pl-5">
                {g.points.map((p) => <li key={p}>{t(p)}</li>)}
              </ul>
            </article>
          ))}
        </section>

        <section id="contact" className="max-w-2xl space-y-3">
          <h2 className="flex items-center gap-2 text-2xl font-semibold"><BookOpen className="w-6 h-6 text-[#2E5A44]" aria-hidden /> {t('Get in touch')}</h2>
          <p className="text-[#3d4a43]">{t('Tell us who you are and we’ll reply personally. No mailing lists beyond launch news.')}</p>
          <WaitlistForm source="partners" interest="society" askInterest />
        </section>
      </main>
    </div>
  );
}
