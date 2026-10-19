import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, BookOpen, CalendarHeart, Check, Copy, Mail, MessageCircle, Plus, Smartphone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useSaveGuard } from '../lib/use-save-guard';
import { getLang, locale, t, useLang } from '../lib/i18n';
import { WEEKLY_QUESTIONS, opensOn, questionsOpen, seriesLink } from '../lib/weekly-questions';

interface Series { id: string; token: string; relative_name: string; questions: string[]; start_on: string; created_at: string; closed_at: string | null; answered: number }
const MAX = 60;
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const longDate = (s: string) => new Date(`${s}T12:00:00`).toLocaleDateString(locale(), { weekday: 'long', month: 'long', day: 'numeric' });

/** Weekly story questions: one private link; a new question opens each week; answers fill the family storybook. */
export const WeeklyQuestions: React.FC = () => {
  useLang();
  const [relative, setRelative] = useState('');
  const [fromName, setFromName] = useState('');
  const [startOn, setStartOn] = useState(today);
  const [questions, setQuestions] = useState<string[]>(() => WEEKLY_QUESTIONS.map((q) => (getLang() === 'fr' ? q.fr : q.en)));
  const [custom, setCustom] = useState('');
  const [series, setSeries] = useState<Series[]>([]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');
  const [editing, setEditing] = useState(false);
  const guard = useSaveGuard();

  const load = async () => {
    const { data } = await supabase.from('story_series').select('id,token,relative_name,questions,start_on,created_at,closed_at').order('created_at', { ascending: false }).limit(50);
    const rows = (data ?? []) as Omit<Series, 'answered'>[];
    const ids = rows.map((r) => r.id);
    const { data: answers } = ids.length ? await supabase.from('story_series_answers').select('series_id').in('series_id', ids) : { data: [] };
    const count = new Map<string, number>();
    for (const a of (answers ?? []) as { series_id: string }[]) count.set(a.series_id, (count.get(a.series_id) ?? 0) + 1);
    setSeries(rows.map((r) => ({ ...r, answered: count.get(r.id) ?? 0 })));
  };

  useEffect(() => {
    void load();
    supabase.auth.getUser().then(({ data }: { data: { user: { user_metadata?: Record<string, unknown> } | null } }) => {
      const n = (data.user?.user_metadata?.full_name as string | undefined)?.split(' ')[0];
      if (n) setFromName((v) => v || n);
    });
  }, []);

  const move = (i: number, by: number) => setQuestions((list) => {
    const next = [...list];
    const [q] = next.splice(i, 1);
    next.splice(Math.max(0, Math.min(next.length, i + by)), 0, q);
    return next;
  });
  const addCustom = () => {
    const q = custom.trim().slice(0, 300);
    if (!q || questions.includes(q) || questions.length >= MAX) return;
    setQuestions([...questions, q]);
    setCustom('');
  };

  const create = guard(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relative.trim() || !fromName.trim() || !questions.length) return;
    setBusy(true);
    const { error } = await supabase.from('story_series')
      .insert({ relative_name: relative.trim().slice(0, 80), from_name: fromName.trim().slice(0, 80), questions, start_on: startOn })
      .select('id').single();
    setBusy(false);
    if (error) { toast.error(t('We couldn’t make the link. Please try again.')); return; }
    toast.success(t('Weekly questions are ready for {name}. Send them the link below.', { name: relative.trim() }));
    setRelative('');
    setEditing(false);
    void load();
  });

  const copy = async (token: string) => {
    try { await navigator.clipboard.writeText(seriesLink(token)); setCopied(token); setTimeout(() => setCopied(''), 2500); }
    catch { toast.info(t('Press and hold the link to copy it.')); }
  };
  const close = async (id: string) => {
    if (!window.confirm(t('Stop the weekly questions? Your relative won’t be able to add more answers. Answers already given stay in your stories.'))) return;
    const { error } = await supabase.from('story_series').update({ closed_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error(t('We couldn’t close the link. Please try again.')); else { toast.success(t('Link closed')); void load(); }
  };

  const message = (s: Series, open: number) => open <= 1
    ? t('Hi {name}, I’m saving our family’s stories. Each week there’s one question about your life for you to answer. No sign-up needed, you can type or just speak: {link}', { name: s.relative_name, link: seriesLink(s.token) })
    : t('Hi {name}, this week’s family story question is ready: “{question}” Answer here whenever you like: {link}', { name: s.relative_name, question: s.questions[open - 1], link: seriesLink(s.token) });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6" data-testid="weekly-questions">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><CalendarHeart className="w-6 h-6 text-genesis-600" /> {t('Weekly story questions')}</h2>
        <p className="text-gray-600 mt-1">{t('Send a parent or grandparent one question a week for a year. They answer on their own phone or computer, typing or just talking, with no account. Every answer is saved to your family stories, ready to become a printed family book.')}</p>
      </div>

      <form onSubmit={create} className="space-y-4 border rounded-lg p-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <label className="text-sm">{t('Who is it for?')}
            <input required value={relative} onChange={(e) => setRelative(e.target.value)} placeholder={t('e.g. Grandma Rosa')} className="mt-1 block w-full px-3 py-2 min-h-[44px] border rounded-lg" />
          </label>
          <label className="text-sm">{t('Your name, as they know you')}
            <input required value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder={t('e.g. Léa')} className="mt-1 block w-full px-3 py-2 min-h-[44px] border rounded-lg" />
          </label>
          <label className="text-sm">{t('First question opens on')}
            <input type="date" required value={startOn} min={today()} onChange={(e) => setStartOn(e.target.value)} className="mt-1 block w-full px-3 py-2 min-h-[44px] border rounded-lg" />
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{t('{n} questions, one a week (until {date})', { n: questions.length, date: questions.length ? longDate(opensOn(startOn, questions.length)) : '' })}</p>
            <button type="button" onClick={() => setEditing(!editing)} className="text-sm text-genesis-700 underline min-h-[44px]">{editing ? t('Done choosing') : t('Change the questions')}</button>
          </div>
          {editing ? (
            <ol className="space-y-1 max-h-96 overflow-y-auto border rounded-lg p-2">
              {questions.map((q, i) => (
                <li key={q} className="flex items-center gap-2">
                  <span className="w-8 text-right text-sm text-gray-500 shrink-0">{i + 1}.</span>
                  <span className="flex-1 text-sm">{q}</span>
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={t('Move question {n} up', { n: i + 1 })} className="w-11 h-11 flex items-center justify-center border rounded-lg disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === questions.length - 1} aria-label={t('Move question {n} down', { n: i + 1 })} className="w-11 h-11 flex items-center justify-center border rounded-lg disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                  <button type="button" onClick={() => setQuestions(questions.filter((x) => x !== q))} aria-label={t('Remove question {n}', { n: i + 1 })} className="w-11 h-11 flex items-center justify-center border rounded-lg text-red-600"><Trash2 className="w-4 h-4" /></button>
                </li>
              ))}
            </ol>
          ) : (
            <ul className="list-disc pl-6 text-sm text-gray-700">
              {questions.slice(0, 3).map((q) => <li key={q}>{q}</li>)}
              {questions.length > 3 && <li className="list-none -ml-6 text-gray-500">{t('…and {n} more', { n: questions.length - 3 })}</li>}
            </ul>
          )}
          <div className="flex gap-2">
            <input value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
              placeholder={t('Add your own question')} aria-label={t('Add your own question')} className="flex-1 px-3 py-2 min-h-[44px] border rounded-lg" />
            <button type="button" onClick={addCustom} disabled={!custom.trim() || questions.length >= MAX} className="flex items-center gap-1 px-4 py-2 min-h-[44px] border rounded-lg disabled:opacity-50"><Plus className="w-4 h-4" /> {t('Add')}</button>
          </div>
        </div>

        <button disabled={busy || !relative.trim() || !fromName.trim() || !questions.length} className="flex items-center gap-2 px-5 py-3 min-h-[44px] bg-genesis-600 text-white rounded-lg disabled:opacity-50">
          <CalendarHeart className="w-5 h-5" /> {busy ? t('Saving…') : t('Start weekly questions')}
        </button>
      </form>

      {series.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-semibold">{t('Your weekly questions')}</h3>
          {series.map((s) => {
            const total = s.questions.length;
            const open = questionsOpen(s.start_on, total);
            const closed = !!s.closed_at;
            const msg = encodeURIComponent(message(s, open));
            return (
              <article key={s.id} className="border rounded-lg p-4 space-y-3" data-testid="series-card">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h4 className="font-semibold text-lg">{s.relative_name}</h4>
                  <p className="text-sm text-gray-600">
                    {closed ? t('Stopped') : open === 0 ? t('Starts on {date}', { date: longDate(s.start_on) }) : t('Week {n} of {total}', { n: open, total })} · {t('{n} answered', { n: s.answered })}
                  </p>
                </div>
                {!closed && open > 0 && <p className="text-gray-800"><span className="text-sm text-gray-500">{t('This week:')} </span>{s.questions[open - 1]}</p>}
                {!closed && open < total && <p className="text-sm text-gray-600">{t('Next question opens on {date}.', { date: longDate(opensOn(s.start_on, open + 1)) })}</p>}
                {!closed && (
                  <div className="flex flex-wrap gap-2 text-sm">
                    <button onClick={() => copy(s.token)} className="flex items-center gap-1 px-3 py-2 min-h-[44px] border rounded-lg">{copied === s.token ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied === s.token ? t('Copied') : t('Copy link')}</button>
                    <a href={`sms:?&body=${msg}`} className="flex items-center gap-1 px-3 py-2 min-h-[44px] border rounded-lg"><Smartphone className="w-4 h-4" /> {t('Text message')}</a>
                    <a href={`mailto:?subject=${encodeURIComponent(t('A question about your life'))}&body=${msg}`} className="flex items-center gap-1 px-3 py-2 min-h-[44px] border rounded-lg"><Mail className="w-4 h-4" /> {t('Email')}</a>
                    <a href={`https://wa.me/?text=${msg}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-2 min-h-[44px] border rounded-lg"><MessageCircle className="w-4 h-4" /> WhatsApp</a>
                    <button onClick={() => close(s.id)} className="px-3 py-2 min-h-[44px] border rounded-lg text-red-600">{t('Stop')}</button>
                  </div>
                )}
                {s.answered > 0 && (
                  <a href="/dashboard?feature=family-storybook" className="inline-flex items-center gap-1 text-sm text-genesis-700 underline min-h-[44px]"><BookOpen className="w-4 h-4" /> {t('Turn the answers into a family book')}</a>
                )}
              </article>
            );
          })}
          <p className="text-sm text-gray-500">{t('Tip: send a short reminder each week when the new question opens. A text from you means more than an automatic email.')}</p>
        </section>
      )}
    </div>
  );
};

export default WeeklyQuestions;
