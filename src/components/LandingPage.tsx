import React from 'react';
import { Upload, Microscope, BookHeart, Mic, BookOpen, Map, Wand2, ShieldCheck, Users, Search, Check, Link2, Globe2 } from 'lucide-react';
import Logo from './Logo';
import { TAGLINE } from '../lib/brand';
import { PRIVACY_PROMISES } from './PrivacyCenter';
import WaitlistForm from './WaitlistForm';

interface Props { onStart: () => void; onSignIn: () => void }

const SHOWCASE = [
  { img: '/screens/research.png', icon: Microscope, title: "Don't just get a hint. See the evidence.",
    text: 'Pick anyone in your tree. Genesis searches open archives several ways and checks every record against the names, dates and places you know, then shows exactly what matches and what doesn\'t. An AI genealogist explains it in plain words and tells you what to check next.' },
  { img: '/screens/life-story.png', icon: BookHeart, title: 'Every ancestor gets their life story.',
    text: 'See each person\'s life as a timeline, with their age at every moment and the world events they lived through. Then let the AI write their story from the facts you have, never inventing anything.' },
  { img: '/screens/interview.png', icon: Mic, title: "Save Grandma's voice while you can.",
    text: 'The app reads each question out loud, records the answers and writes them down, in English, Español, Français and more. Every interview is kept with the person it belongs to.' },
];

const MORE = [
  { icon: Upload, title: 'Bring your tree', text: 'Import your GEDCOM file from Ancestry, MyHeritage or FamilySearch in about two minutes. Download it again any time.' },
  { icon: Search, title: 'Free records, no paywall', text: 'World family trees, historic newspapers, and national archives in Canada, the US, Europe and beyond.' },
  { icon: BookOpen, title: 'AI family storybook', text: 'Turn your family history into a book to print, save as a PDF or give as a gift.' },
  { icon: Map, title: 'Family map', text: "See where your family lived and press play to watch the journey across the generations." },
  { icon: Wand2, title: 'Restore old photos', text: 'Repair scratches and fading, and add natural colour to black-and-white photos.' },
  { icon: ShieldCheck, title: 'Tree checkup', text: 'Finds impossible dates, too-young parents and people listed twice, free.' },
  { icon: Globe2, title: 'Where you come from', text: 'A heritage breakdown worked out from your own tree, country by country, with no DNA kit to buy.' },
  { icon: Link2, title: 'How are we related?', text: 'Click anyone to see exactly how you are related, from great-aunt to second cousin once removed, and the path that links you.' },
  { icon: Users, title: 'Share with family', text: 'Invite relatives to see your tree and add their own memories. Joining is free for them.' },
];

const FAQ = [
  ['Is it really free?', 'Yes. Building your tree, importing from other sites, searching free records, recording interviews and sharing with family are free. Pro ($19 CAD a month, or $190 a year) adds much higher AI limits and more photo restorations.'],
  ['Can I move my tree from Ancestry or MyHeritage?', 'Yes. Both let you download your tree as a GEDCOM file. Upload it to Genesis and everyone comes across with their parents, children and spouses linked. You can also download your Genesis tree as a GEDCOM file at any time.'],
  ['Do you sell my data or DNA?', 'No. We never sell your data or your family\'s data, to anyone. We don\'t run DNA tests. If you upload a DNA results file, it is only used to show you your own insights.'],
  ['Which countries\' records can I search?', 'Genesis searches open, free sources worldwide (WikiTree, Wikidata, the Internet Archive, US historic newspapers and more), and links you straight to free official archives in Canada, the United States, the UK and Ireland, Spain and Latin America, and Australia.'],
  ['Can my relatives join?', 'Yes. Send them an invite link. They can see your tree, stories and storybooks, and you can let them add their own memories. It\'s free for them.'],
  ['What if I want to leave?', 'Download everything you\'ve saved in one click, then delete your account and everything in it whenever you like.'],
];

export const LandingPage: React.FC<Props> = ({ onStart, onSignIn }) => (
  <div className="min-h-screen bg-[#F5EEDF] text-[#1E2A23]">
    <header className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
      <a href="/" className="flex items-center gap-2 font-serif text-xl font-bold"><Logo size={36} /> Genesis Heritage</a>
      <nav className="flex items-center gap-4 text-sm">
        <a href="#features" className="hidden sm:inline hover:underline">Features</a>
        <a href="#pricing" className="hidden sm:inline hover:underline">Pricing</a>
        <a href="#faq" className="hidden sm:inline hover:underline">Questions</a>
        <button onClick={onSignIn} className="hover:underline">Sign in</button>
        <button onClick={onStart} className="px-4 py-2 rounded-full bg-[#2E5A44] text-white font-semibold hover:opacity-90">Start free</button>
      </nav>
    </header>

    <section className="max-w-6xl mx-auto px-4 pt-10 pb-16 grid lg:grid-cols-2 gap-10 items-center">
      <div>
        <p className="uppercase tracking-widest text-sm font-semibold text-[#2E5A44]">Family history, kept alive</p>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold leading-tight mt-3">{TAGLINE}</h1>
        <p className="mt-5 text-lg text-[#4a554e]">Your family tree, your relatives' voices, their stories, recipes and photos, and free historical records, all in one private place you can share with the people who matter.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button onClick={onStart} className="px-6 py-3 rounded-full bg-[#2E5A44] text-white text-lg font-semibold shadow hover:opacity-90">Start your family's story, free</button>
          <a href="#move" className="px-6 py-3 rounded-full border border-[#2E5A44] text-[#2E5A44] text-lg font-semibold hover:bg-white/50">Moving from Ancestry?</a>
        </div>
        <p className="mt-4 text-sm text-[#5c6660]">Free to start · No credit card · We never sell your data · <a href="#waitlist" className="underline">Not ready yet? Join the waitlist</a></p>
      </div>
      <img src="/screens/tree.png" alt="A Genesis family tree with four generations" className="w-full rounded-xl shadow-xl border border-black/5 bg-white" loading="eager" />
    </section>

    <section id="move" className="bg-white/60 border-y border-black/5">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="font-serif text-3xl font-bold">Bring your tree over in about two minutes</h2>
        <ol className="mt-6 grid sm:grid-cols-3 gap-6">
          {[
            ['Download your tree', 'On Ancestry or MyHeritage, use the "Export tree" option to download a GEDCOM (.ged) file.'],
            ['Upload it to Genesis', 'Choose the file. Everyone comes across, with parents, children and spouses linked, even old files with accented names.'],
            ['Keep the journey going', 'Check your tree for mistakes, research ancestors with evidence, record interviews and make your storybook.'],
          ].map(([t, d], i) => (
            <li key={t} className="bg-white rounded-xl p-5 shadow-sm">
              <span className="inline-flex w-8 h-8 items-center justify-center rounded-full bg-[#B5843A] text-white font-bold">{i + 1}</span>
              <h3 className="mt-3 font-semibold text-lg">{t}</h3>
              <p className="mt-1 text-[#4a554e]">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>

    <section id="features" className="max-w-6xl mx-auto px-4 py-16 space-y-16">
      {SHOWCASE.map((f, i) => (
        <div key={f.title} className={`grid lg:grid-cols-2 gap-10 items-center ${i % 2 ? 'lg:[&>*:first-child]:order-2' : ''}`}>
          <div>
            <f.icon className="w-9 h-9 text-[#2E5A44]" />
            <h2 className="font-serif text-3xl font-bold mt-3">{f.title}</h2>
            <p className="mt-3 text-lg text-[#4a554e]">{f.text}</p>
          </div>
          <img src={f.img} alt={f.title} loading="lazy" className="w-full rounded-xl shadow-lg border border-black/5 bg-white" />
        </div>
      ))}

      <div>
        <h2 className="font-serif text-3xl font-bold">And everything else your family's story needs</h2>
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {MORE.map((f) => (
            <div key={f.title} className="bg-white rounded-xl p-5 shadow-sm">
              <f.icon className="w-7 h-7 text-[#2E5A44]" />
              <h3 className="mt-2 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-[#4a554e]">{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="bg-[#2E5A44] text-white">
      <div className="max-w-6xl mx-auto px-4 py-14 grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <ShieldCheck className="w-10 h-10 text-[#E9C98B]" />
          <h2 className="font-serif text-3xl font-bold mt-3">Your family's story is not for sale.</h2>
          <p className="mt-3 text-white/80">Family history is personal. Here is our promise, in plain words.</p>
        </div>
        <ul className="space-y-2">
          {PRIVACY_PROMISES.map((p) => <li key={p} className="flex gap-2"><Check className="w-5 h-5 shrink-0 text-[#E9C98B]" />{p}</li>)}
        </ul>
      </div>
    </section>

    <section id="pricing" className="max-w-6xl mx-auto px-4 py-16">
      <h2 className="font-serif text-3xl font-bold text-center">Simple, fair pricing</h2>
      <div className="mt-8 grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl p-6 shadow-sm border">
          <h3 className="text-xl font-semibold">Free</h3>
          <p className="text-4xl font-bold mt-2">$0</p>
          <ul className="mt-4 space-y-2 text-sm">
            {['Unlimited family tree, import and export', 'Free records search, no paywall', 'Interviews, stories, recipes and photos', 'Share with family for free', 'AI helper with a daily allowance'].map((x) => <li key={x} className="flex gap-2"><Check className="w-4 h-4 text-[#2E5A44] shrink-0 mt-0.5" />{x}</li>)}
          </ul>
          <button onClick={onStart} className="mt-6 w-full py-3 rounded-full border border-[#2E5A44] text-[#2E5A44] font-semibold">Start free</button>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-md border-2 border-[#2E5A44]">
          <h3 className="text-xl font-semibold">Pro</h3>
          <p className="text-4xl font-bold mt-2">$19 <span className="text-base font-normal text-[#5c6660]">CAD / month, or $190 / year</span></p>
          <ul className="mt-4 space-y-2 text-sm">
            {['Everything in Free', 'Much higher AI limits: storybooks, life stories, research', 'Restore and colourise 10 old photos a day', 'Priority support'].map((x) => <li key={x} className="flex gap-2"><Check className="w-4 h-4 text-[#2E5A44] shrink-0 mt-0.5" />{x}</li>)}
          </ul>
          <button onClick={onStart} className="mt-6 w-full py-3 rounded-full bg-[#2E5A44] text-white font-semibold">Start free, upgrade any time</button>
        </div>
      </div>
    </section>

    <section id="waitlist" className="bg-[#efe8da] border-t border-black/5">
      <div className="max-w-2xl mx-auto px-4 py-14 text-center space-y-5">
        <h2 className="font-serif text-3xl font-bold">Not ready to start? Join the waitlist.</h2>
        <p className="text-lg text-[#4a554e]">Be first to hear when new features open, from printed family books to the French version. Share your link and bring the whole family.</p>
        <WaitlistForm source="home" />
      </div>
    </section>

    <section id="faq" className="bg-white/60 border-t border-black/5">
      <div className="max-w-3xl mx-auto px-4 py-14">
        <h2 className="font-serif text-3xl font-bold">Questions families ask</h2>
        <div className="mt-6 space-y-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className="bg-white rounded-xl p-4 shadow-sm">
              <summary className="cursor-pointer font-semibold">{q}</summary>
              <p className="mt-2 text-[#4a554e]">{a}</p>
            </details>
          ))}
        </div>
        <div className="mt-10 text-center">
          <button onClick={onStart} className="px-8 py-3 rounded-full bg-[#2E5A44] text-white text-lg font-semibold shadow">Start your family's story, free</button>
        </div>
      </div>
    </section>

    <footer className="max-w-6xl mx-auto px-4 py-8 text-sm text-[#5c6660] space-y-2">
      <p><a href="/privacy" className="underline">Privacy</a> · <a href="/terms" className="underline">Terms</a> · © {new Date().getFullYear()} Genesis Heritage. All rights reserved.</p>
      <p className="text-xs">Ancestry and MyHeritage are trademarks of their respective owners. Genesis Heritage is an independent service and is not affiliated with them.</p>
    </footer>
  </div>
);

export default LandingPage;
