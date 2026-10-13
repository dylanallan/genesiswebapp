import React, { useEffect, useMemo, useState } from 'react';
import { Microscope, Search, Sparkles, BookmarkPlus, ExternalLink, CheckCircle2, XCircle, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { loadAllFamilyRows } from '../lib/family';
import { chatApi } from '../api/chat';
import { MatchPerson, MatchResult, RecordFacts, scoreMatch, verificationPrompt } from '../lib/record-match';
import { archiveLinks } from '../lib/archive-links';

interface Row { id: string; first_name: string | null; middle_name: string | null; last_name: string | null; birth_date: string | null; death_date: string | null; birth_location: string | null; death_location: string | null }
interface Hit { source: string; sourceLabel: string; sourceId: string; title: string; snippet?: string; date?: string; url: string; license?: string; attribution: string; facts?: RecordFacts['facts'] }
interface Finding { hit: Hit; result: MatchResult }

const year = (d: string | null) => (d ? Number(d.slice(0, 4)) || null : null);
const fullName = (r: Row) => [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ') || 'Unknown';
const LEVEL_STYLE: Record<MatchResult['level'], string> = {
  strong: 'bg-green-100 text-green-800', possible: 'bg-blue-100 text-blue-800', weak: 'bg-amber-100 text-amber-800', unlikely: 'bg-gray-100 text-gray-600',
};
const LEVEL_LABEL: Record<MatchResult['level'], string> = { strong: 'Strong match', possible: 'Possible match', weak: 'Weak match', unlikely: 'Probably someone else' };

export const ResearchAssistant: React.FC = () => {
  const [people, setPeople] = useState<Row[]>([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Row | null>(null);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [explanation, setExplanation] = useState('');
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAllFamilyRows<Row>('id,first_name,middle_name,last_name,birth_date,death_date,birth_location,death_location')
      .then(setPeople).catch(() => toast.error('Could not load your family tree.'));
  }, []);

  const shown = useMemo(() => {
    const f = filter.trim().toLowerCase();
    return (f ? people.filter((p) => fullName(p).toLowerCase().includes(f)) : people).slice(0, 200);
  }, [people, filter]);

  const person = (r: Row): MatchPerson => ({ name: fullName(r), birthYear: year(r.birth_date), deathYear: year(r.death_date), birthPlace: r.birth_location, deathPlace: r.death_location });

  const research = async (r: Row) => {
    setSelected(r);
    setFindings(null);
    setExplanation('');
    const me = person(r);
    const surname = r.last_name ?? '';
    // Several searches catch records that a single exact search misses (no place, surname + place only).
    const queries = [
      { name: me.name, place: me.birthPlace ?? undefined, year: me.birthYear ?? undefined },
      { name: me.name },
      ...(surname && me.birthPlace ? [{ name: surname, place: me.birthPlace, year: me.birthYear ?? undefined }] : []),
    ];
    const all = new Map<string, Hit>();
    try {
      for (let i = 0; i < queries.length; i++) {
        setBusy(`Searching archives (${i + 1} of ${queries.length})...`);
        const { data, error } = await supabase.functions.invoke('records-search', { body: queries[i] });
        if (error) {
          let message = 'Search failed. Please try again.';
          try { const body = await (error as { context?: Response }).context?.json(); if (body?.error) message = body.error; } catch { /* default */ }
          throw new Error(message);
        }
        for (const h of (data?.hits ?? []) as Hit[]) all.set(`${h.source}:${h.sourceId}`, h);
      }
      setBusy('Checking each record against what you know...');
      const scored = [...all.values()].map((hit) => ({ hit, result: scoreMatch(me, hit) })).sort((a, b) => b.result.score - a.result.score);
      setFindings(scored);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const explain = async () => {
    if (!selected || !findings?.length) return;
    setBusy('Asking the AI genealogist...');
    const res = await chatApi.sendMessage(verificationPrompt(person(selected), findings.map((f) => ({ title: f.hit.title, source: f.hit.sourceLabel, url: f.hit.url, result: f.result }))), { persist: false });
    setBusy(null);
    if (res.provider === 'error') toast.error(res.response); else setExplanation(res.response.trim());
  };

  const save = async (f: Finding) => {
    if (!selected) return;
    const { data: auth } = await supabase.auth.getUser();
    const notes = `Possible record for ${fullName(selected)}: ${f.result.score}/100 (${LEVEL_LABEL[f.result.level]}).\n` + f.result.evidence.map((e) => `${e.kind === 'support' ? '+' : e.kind === 'conflict' ? '-' : '•'} ${e.text}`).join('\n');
    const { error } = await supabase.from('saved_records').upsert({
      user_id: auth.user?.id, source: f.hit.source, source_id: f.hit.sourceId, title: f.hit.title, snippet: f.hit.snippet,
      record_date: f.hit.date, url: f.hit.url, license: f.hit.license, attribution: f.hit.attribution, notes,
    }, { onConflict: 'user_id,source,source_id' });
    if (error) { toast.error('Could not save this record.'); return; }
    setSaved((s) => new Set(s).add(`${f.hit.source}:${f.hit.sourceId}`));
    toast.success('Saved to My saved records, with the evidence');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><Microscope className="w-6 h-6 text-genesis-600" /> Research assistant</h2>
        <p className="text-gray-600 mt-1">
          Pick someone in your tree. We search the open archives several ways, check every record against the names, dates and places you know,
          and show the evidence for and against each one, so you know what to trust. The AI genealogist can then explain it and suggest next steps.
        </p>
      </div>

      {!selected ? (
        <div className="space-y-3">
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Find a person in your tree" aria-label="Find a person" className="w-full px-3 py-2 border rounded-lg" />
          {people.length === 0 ? <p className="text-gray-500 text-sm">Add or import people to your tree first.</p> : (
            <ul className="max-h-96 overflow-y-auto divide-y border rounded-lg">
              {shown.map((r) => (
                <li key={r.id}>
                  <button onClick={() => research(r)} className="w-full text-left px-3 py-2 hover:bg-gray-50 flex justify-between gap-2">
                    <span>{fullName(r)}</span>
                    <span className="text-sm text-gray-500">{[year(r.birth_date), r.birth_location].filter(Boolean).join(' · ')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">Researching {fullName(selected)} {year(selected.birth_date) ? `(born ${year(selected.birth_date)})` : ''}</p>
            <button onClick={() => { setSelected(null); setFindings(null); }} className="text-sm text-genesis-700 hover:underline">← Choose someone else</button>
          </div>
          {busy && <p className="flex items-center gap-2 text-genesis-700" role="status"><Loader2 className="w-4 h-4 animate-spin" /> {busy}</p>}

          {findings && (findings.length === 0 ? (
            <p className="text-gray-600">No records found in the open archives yet. Try the free official archives below.</p>
          ) : (
            <>
              <button onClick={explain} disabled={busy !== null} className="flex items-center gap-2 px-4 py-2 bg-genesis-600 text-white rounded-lg disabled:opacity-50">
                <Sparkles className="w-4 h-4" /> Explain these results and suggest next steps
              </button>
              {explanation && <div className="bg-genesis-50 border border-genesis-200 rounded-lg p-4 whitespace-pre-line">{explanation}</div>}
              <ul className="space-y-3">
                {findings.slice(0, 25).map((f) => {
                  const key = `${f.hit.source}:${f.hit.sourceId}`;
                  return (
                    <li key={key} className="border rounded-lg p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <a href={f.hit.url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-700 hover:underline inline-flex items-center gap-1">{f.hit.title}<ExternalLink className="w-3 h-3" /></a>
                          <p className="text-xs text-gray-500">{f.hit.sourceLabel} · {f.hit.attribution}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${LEVEL_STYLE[f.result.level]}`}>{LEVEL_LABEL[f.result.level]} · {f.result.score}/100</span>
                      </div>
                      {f.hit.snippet && <p className="text-sm text-gray-700 mt-2">{f.hit.snippet}</p>}
                      <ul className="mt-2 space-y-1 text-sm">
                        {f.result.evidence.map((e, i) => (
                          <li key={i} className="flex gap-2">
                            {e.kind === 'support' ? <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /> : e.kind === 'conflict' ? <XCircle className="w-4 h-4 text-red-600 shrink-0" /> : <Info className="w-4 h-4 text-gray-400 shrink-0" />}
                            <span>{e.text}</span>
                          </li>
                        ))}
                      </ul>
                      <button onClick={() => save(f)} disabled={saved.has(key)} className="mt-3 inline-flex items-center gap-1 rounded border px-2 py-1 text-sm disabled:opacity-50">
                        <BookmarkPlus className="w-4 h-4" /> {saved.has(key) ? 'Saved' : 'Save with evidence'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ))}

          <details className="border rounded-lg p-4">
            <summary className="cursor-pointer font-medium flex items-center gap-2"><Search className="w-4 h-4" /> Search more free official archives for {fullName(selected)}</summary>
            <ul className="mt-2 space-y-1">
              {archiveLinks(fullName(selected), selected.birth_location ?? '', year(selected.birth_date)?.toString() ?? '').map((l) => (
                <li key={l.label} className="text-sm">
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">{l.label}</a>
                  <span className="text-gray-500"> · {l.region}</span>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
};

export default ResearchAssistant;
