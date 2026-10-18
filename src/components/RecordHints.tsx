import React, { useEffect, useState } from 'react';
import { Sparkles, Loader2, BookmarkPlus, X, ExternalLink, CheckCircle2, XCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { loadAllFamilyRows } from '../lib/family';
import { scoreMatch, MatchResult, RecordFacts } from '../lib/record-match';
import { HintPerson, nextToCheck, searchable, worthShowing } from '../lib/hints';
import { useSaveGuard } from '../lib/use-save-guard';
import { locale, t, useLang } from '../lib/i18n';

interface Hit { source: string; sourceLabel: string; sourceId: string; title: string; snippet?: string; date?: string; url: string; license?: string; attribution: string; facts?: RecordFacts['facts'] }
interface Hint {
  id: string; family_member_id: string; source: string; source_id: string; source_label: string | null; title: string; snippet: string | null;
  record_date: string | null; url: string; license: string | null; attribution: string | null; score: number; level: MatchResult['level'];
  evidence: MatchResult['evidence']; status: 'new' | 'saved' | 'dismissed';
}

const BATCH = 10;
const year = (d: string | null) => (d ? Number(d.slice(0, 4)) || null : null);
const fullName = (p: HintPerson) => [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(' ');
const LEVEL: Record<string, string> = { strong: 'Strong match', possible: 'Possible match' };

/** Searches free archives for people in the tree and suggests likely matching records, with the evidence. */
export const RecordHints: React.FC = () => {
  useLang();
  const [people, setPeople] = useState<HintPerson[]>([]);
  const [checked, setChecked] = useState<Map<string, string>>(new Map());
  const [hints, setHints] = useState<Hint[]>([]);
  const [progress, setProgress] = useState('');
  const [loaded, setLoaded] = useState(false);
  const guard = useSaveGuard();

  const load = async () => {
    const [rows, checks, found] = await Promise.all([
      loadAllFamilyRows<HintPerson>('id,first_name,middle_name,last_name,birth_date,death_date,birth_location,death_location,is_living'),
      supabase.from('record_hint_checks').select('family_member_id,checked_at'),
      supabase.from('record_hints').select('*').eq('status', 'new').order('score', { ascending: false }).limit(300),
    ]);
    setPeople(rows);
    setChecked(new Map(((checks.data ?? []) as { family_member_id: string; checked_at: string }[]).map((c) => [c.family_member_id, c.checked_at])));
    setHints((found.data ?? []) as Hint[]);
    setLoaded(true);
  };
  useEffect(() => { load().catch(() => { toast.error(t('Could not load your hints.')); setLoaded(true); }); }, []);

  const findHints = guard(async () => {
    const batch = nextToCheck(people, checked, BATCH);
    if (!batch.length) { toast.info(t('Add names and dates to people in your tree, and Genesis can look for records about them.')); return; }
    const { data: auth } = await supabase.auth.getUser();
    let added = 0;
    try {
      for (let i = 0; i < batch.length; i++) {
        const p = batch[i];
        setProgress(t('Looking for records about {name} ({n} of {total})…', { name: fullName(p), n: i + 1, total: batch.length }));
        const { data, error } = await supabase.functions.invoke('records-search', {
          body: { name: fullName(p), year: year(p.birth_date) ?? undefined, place: p.birth_location ?? undefined },
        });
        if (error) {
          let message = t('The archive search isn’t answering right now. Please try again later.');
          try { const body = await (error as { context?: Response }).context?.json(); if (body?.error) message = body.error; } catch { /* default */ }
          throw new Error(message);
        }
        const me = { name: fullName(p), birthYear: year(p.birth_date), deathYear: year(p.death_date), birthPlace: p.birth_location, deathPlace: p.death_location };
        const good = ((data?.hits ?? []) as Hit[]).map((hit) => ({ hit, r: scoreMatch(me, hit) })).filter(({ r }) => worthShowing(r));
        if (good.length) {
          // A hint already decided (saved or "not them") is left alone, so it never comes back.
          const { error: saveError } = await supabase.from('record_hints').upsert(good.map(({ hit, r }) => ({
            user_id: auth.user?.id, family_member_id: p.id, source: hit.source, source_id: hit.sourceId, source_label: hit.sourceLabel,
            title: hit.title.slice(0, 500), snippet: hit.snippet?.slice(0, 2000) ?? null, record_date: hit.date ?? null, url: hit.url,
            license: hit.license ?? null, attribution: hit.attribution, score: r.score, level: r.level, evidence: r.evidence,
          })), { onConflict: 'user_id,family_member_id,source,source_id', ignoreDuplicates: true });
          if (saveError) throw new Error(t('We couldn’t save the hints. Please try again.'));
          added += good.length;
        }
        await supabase.from('record_hint_checks').upsert({ user_id: auth.user?.id, family_member_id: p.id, checked_at: new Date().toISOString() }, { onConflict: 'user_id,family_member_id' });
      }
      toast.success(added
        ? t(added === 1 ? 'Found 1 possible record for {people} people.' : 'Found {n} possible records for {people} people.', { n: added, people: batch.length })
        : t('No likely records yet for those {people} people. Try again later as archives grow.', { people: batch.length }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setProgress('');
      await load();
    }
  });

  const decide = async (h: Hint, status: 'saved' | 'dismissed') => {
    if (status === 'saved') {
      const { data: auth } = await supabase.auth.getUser();
      const notes = `Record hint: ${h.score}/100 (${LEVEL[h.level] ?? h.level}).\n` + h.evidence.map((e) => `${e.kind === 'support' ? '+' : e.kind === 'conflict' ? '-' : '•'} ${e.text}`).join('\n');
      const { error } = await supabase.from('saved_records').upsert({
        user_id: auth.user?.id, family_member_id: h.family_member_id, source: h.source, source_id: h.source_id, title: h.title, snippet: h.snippet,
        record_date: h.record_date, url: h.url, license: h.license, attribution: h.attribution ?? h.source_label ?? h.source, notes,
      }, { onConflict: 'user_id,source,source_id' });
      if (error) { toast.error(t('We couldn’t save this record. Please try again.')); return; }
    }
    const { error } = await supabase.from('record_hints').update({ status, decided_at: new Date().toISOString() }).eq('id', h.id);
    if (error) { toast.error(t('That didn’t save. Please try again.')); return; }
    setHints((list) => list.filter((x) => x.id !== h.id));
    toast.success(t(status === 'saved' ? 'Saved to this person’s records' : 'Got it. We won’t show that one again.'));
  };

  const byId = new Map(people.map((p) => [p.id, p]));
  const groups = new Map<string, Hint[]>();
  for (const h of hints) groups.set(h.family_member_id, [...(groups.get(h.family_member_id) ?? []), h]);
  const left = people.filter((p) => searchable(p) && !checked.has(p.id)).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5" data-testid="record-hints">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Sparkles className="w-6 h-6 text-genesis-600" /> {t('Record hints')}</h2>
          <p className="text-gray-600 mt-1">{t('Genesis searches free public archives for people in your tree and shows records that may be about them, with the reasons for and against. You decide what’s right.')}</p>
        </div>
        <button onClick={findHints} disabled={!!progress || !loaded} className="flex items-center gap-2 px-4 py-2 bg-genesis-600 text-white rounded-lg disabled:opacity-50">
          {progress ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {t('Find hints')}
        </button>
      </div>
      {progress && <p className="text-gray-700" role="status">{progress}</p>}
      {loaded && !progress && <p className="text-sm text-gray-500">{left > 0
        ? t(left === 1 ? '1 person not searched yet. Each press checks up to {batch}.' : '{n} people not searched yet. Each press checks up to {batch}.', { n: left.toLocaleString(locale()), batch: BATCH })
        : t('Everyone with enough details has been searched. Press again to check for new records.')}</p>}

      {loaded && hints.length === 0 && !progress && (
        <p className="text-gray-600 bg-gray-50 border rounded-lg p-4">{t('No hints waiting. Press “Find hints” to look for records about the people in your tree.')}</p>
      )}

      {[...groups].map(([personId, list]) => {
        const p = byId.get(personId);
        return (
          <section key={personId} className="space-y-3" aria-label={p ? t('Hints for {name}', { name: fullName(p) }) : t('Hints for a person')}>
            <h3 className="font-semibold text-lg">{p ? fullName(p) : t('Someone in your tree')}{p?.birth_date ? <span className="font-normal text-gray-500"> · {t('born {year}', { year: p.birth_date.slice(0, 4) })}</span> : null}</h3>
            {list.map((h) => (
              <article key={h.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium break-words">{h.title}</p>
                    <p className="text-sm text-gray-600">{[h.source_label ?? h.source, h.record_date].filter(Boolean).join(' · ')}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${h.level === 'strong' ? 'bg-green-100 text-green-800' : 'bg-genesis-100 text-genesis-800'}`}>{t(LEVEL[h.level] ?? h.level)} · {h.score}/100</span>
                </div>
                {h.snippet && <p className="text-sm text-gray-700">{h.snippet}</p>}
                <ul className="text-sm space-y-1">
                  {h.evidence.map((e, i) => (
                    <li key={i} className="flex gap-2">
                      {e.kind === 'support' ? <CheckCircle2 className="w-4 h-4 text-green-700 shrink-0 mt-0.5" aria-label={t('Supports')} /> : e.kind === 'conflict' ? <XCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" aria-label={t('Conflicts')} /> : <Info className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" aria-label={t('Note')} />}
                      <span>{e.text}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button onClick={() => decide(h, 'saved')} className="flex items-center gap-1 px-3 py-1.5 bg-genesis-600 text-white rounded-lg text-sm"><BookmarkPlus className="w-4 h-4" /> {p?.first_name ? t('Save to {name}', { name: p.first_name }) : t('Save to this person')}</button>
                  <button onClick={() => decide(h, 'dismissed')} className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm"><X className="w-4 h-4" /> {t('Not them')}</button>
                  <a href={h.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-1.5 border rounded-lg text-sm"><ExternalLink className="w-4 h-4" /> {t('See the record')}</a>
                </div>
              </article>
            ))}
          </section>
        );
      })}
    </div>
  );
};

export default RecordHints;
