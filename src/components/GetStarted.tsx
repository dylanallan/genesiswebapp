import React, { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Upload, Users, Mic, BookOpen, Search, Sparkles, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface Props { open: (featureId: string) => void }
interface Slot { key: string; label: string; relationship: string }
interface Entry { name: string; birthDate: string; birthPlace: string }
interface Hit { title: string; url: string; sourceLabel: string; snippet?: string }

const SLOTS: Slot[] = [
  { key: 'me', label: 'You', relationship: 'self' },
  { key: 'mother', label: 'Your mother', relationship: 'mother' },
  { key: 'father', label: 'Your father', relationship: 'father' },
  { key: 'mgm', label: "Mother's mother", relationship: 'maternal grandmother' },
  { key: 'mgf', label: "Mother's father", relationship: 'maternal grandfather' },
  { key: 'pgm', label: "Father's mother", relationship: 'paternal grandmother' },
  { key: 'pgf', label: "Father's father", relationship: 'paternal grandfather' },
];
const PARENTS: Record<string, [string, string]> = { me: ['mother', 'father'], mother: ['mgm', 'mgf'], father: ['pgm', 'pgf'] };
const GENDER: Record<string, string> = { mother: 'female', mgm: 'female', pgm: 'female', father: 'male', mgf: 'male', pgf: 'male' };

/** Builds linked family_members rows for whoever was filled in. Exported for tests. */
export function quickTreeRows(entries: Record<string, Entry>, newId: () => string = () => crypto.randomUUID()) {
  const filled = SLOTS.filter((s) => entries[s.key]?.name.trim());
  const ids = Object.fromEntries(filled.map((s) => [s.key, newId()]));
  const childOf = (key: string) => Object.keys(PARENTS).find((c) => PARENTS[c].includes(key));
  return filled.map((s) => {
    const parts = entries[s.key].name.trim().split(/\s+/);
    const first = parts.shift()!;
    const parents = (PARENTS[s.key] ?? []).filter((p) => ids[p]).map((p) => ids[p]);
    const pair = Object.values(PARENTS).find((p) => p.includes(s.key));
    const spouse = pair?.find((p) => p !== s.key && ids[p]);
    const child = childOf(s.key);
    return {
      id: ids[s.key],
      first_name: first,
      middle_name: parts.length > 1 ? parts.slice(0, -1).join(' ') : null,
      last_name: parts.length ? parts[parts.length - 1] : '',
      relationship: s.relationship,
      gender: GENDER[s.key] ?? null,
      birth_date: entries[s.key].birthDate || null,
      birth_location: entries[s.key].birthPlace.trim() || null,
      is_living: true,
      source: 'user',
      confidence: 100,
      parent_ids: parents,
      spouse_ids: spouse ? [ids[spouse]] : [],
      children_ids: child && ids[child] ? [ids[child]] : [],
    };
  });
}

export const GetStarted: React.FC<Props> = ({ open }) => {
  const [counts, setCounts] = useState({ people: 0, stories: 0, shares: 0, books: 0 });
  const [loaded, setLoaded] = useState(false);
  const [entries, setEntries] = useState<Record<string, Entry>>(Object.fromEntries(SLOTS.map((s) => [s.key, { name: '', birthDate: '', birthPlace: '' }])));
  const [saving, setSaving] = useState(false);
  const [discovery, setDiscovery] = useState<{ who: string; hits: Hit[] } | null>(null);

  const load = async () => {
    const head = { count: 'exact' as const, head: true };
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id ?? '';
    const [p, s, sh, b] = await Promise.all([
      supabase.from('family_members').select('id', head).eq('user_id', uid),
      supabase.from('cultural_stories').select('id', head).eq('user_id', uid),
      supabase.from('family_shares').select('id', head).eq('owner_id', uid),
      supabase.from('storybooks').select('id', head),
    ]);
    setCounts({ people: p.count ?? 0, stories: s.count ?? 0, shares: sh.count ?? 0, books: b.count ?? 0 });
    setLoaded(true);
  };
  useEffect(() => { load(); }, []);

  const discover = async (name: string, place: string, birthDate: string) => {
    const { data, error } = await supabase.functions.invoke('records-search', { body: { name, place: place || undefined, year: birthDate ? birthDate.slice(0, 4) : undefined } });
    if (!error && data?.hits?.length) setDiscovery({ who: name, hits: data.hits.slice(0, 3) });
    else setDiscovery({ who: name, hits: [] });
  };

  const saveQuickTree = async (e: React.FormEvent) => {
    e.preventDefault();
    const rows = quickTreeRows(entries);
    if (!rows.length) { toast.error('Add at least your own name to start.'); return; }
    // Grandparents are linked through a parent, so that parent needs at least a name (even "Unknown").
    const has = (k: string) => !!entries[k].name.trim();
    if ((has('mgm') || has('mgf')) && !has('mother')) { toast.error('Please add your mother\'s name too (or type "Unknown"), so her parents connect to you.'); return; }
    if ((has('pgm') || has('pgf')) && !has('father')) { toast.error('Please add your father\'s name too (or type "Unknown"), so his parents connect to you.'); return; }
    if ((has('mother') || has('father')) && !has('me')) { toast.error('Please add your own name too, so your parents connect to you.'); return; }
    setSaving(true);
    const { error } = await supabase.from('family_members').insert(rows);
    setSaving(false);
    if (error) { toast.error(`Could not save: ${error.message}`); return; }
    toast.success(`${rows.length} people added to your family tree`);
    load();
    // First discovery: search free archives for the oldest person they entered.
    const oldest = ['pgf', 'pgm', 'mgf', 'mgm', 'father', 'mother', 'me'].map((k) => entries[k]).find((x) => x.name.trim());
    if (oldest) discover(oldest.name.trim(), oldest.birthPlace.trim(), oldest.birthDate);
  };

  const steps = [
    { done: counts.people > 0, label: 'Start your family tree', icon: Users, action: counts.people ? () => open('family-tree-chart') : undefined, cta: 'See my tree' },
    { done: counts.stories > 0, label: 'Interview a parent or grandparent', icon: Mic, action: () => open('family-interview'), cta: 'Start an interview' },
    { done: counts.shares > 0, label: 'Invite a relative to add their memories', icon: Users, action: () => open('family-sharing'), cta: 'Invite family' },
    { done: counts.books > 0, label: 'Make your family storybook', icon: BookOpen, action: () => open('family-storybook'), cta: 'Make a storybook' },
  ];

  const field = (key: string, prop: keyof Entry) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEntries({ ...entries, [key]: { ...entries[key], [prop]: e.target.value } });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Welcome to Genesis Heritage</h2>
        <p className="text-gray-600 mt-1">Keep your family's story alive, not just its names and dates. Here is how to get started.</p>
      </div>

      <ol className="space-y-2">
        {steps.map((s) => (
          <li key={s.label} className="flex items-center justify-between gap-3 border rounded-lg px-4 py-3">
            <span className="flex items-center gap-3">
              {s.done ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Circle className="w-5 h-5 text-gray-300" />}
              <span className={s.done ? 'text-gray-500' : 'font-medium'}>{s.label}</span>
            </span>
            {s.action && <button onClick={s.action} className="text-sm text-genesis-700 hover:underline whitespace-nowrap">{s.cta} →</button>}
          </li>
        ))}
      </ol>

      {loaded && counts.people === 0 && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <button onClick={() => open('tree-import')} className="flex items-start gap-3 text-left border-2 border-genesis-200 rounded-lg p-4 hover:border-genesis-400">
              <Upload className="w-6 h-6 text-genesis-600 shrink-0" />
              <span><strong>I already have a tree</strong><br /><span className="text-sm text-gray-600">Bring it from Ancestry, MyHeritage or FamilySearch in about two minutes.</span></span>
            </button>
            <a href="#quick-tree" className="flex items-start gap-3 text-left border-2 border-gray-200 rounded-lg p-4 hover:border-genesis-400">
              <Sparkles className="w-6 h-6 text-genesis-600 shrink-0" />
              <span><strong>I'm starting fresh</strong><br /><span className="text-sm text-gray-600">Add yourself, your parents and grandparents below. Leave blank anyone you don't know.</span></span>
            </a>
          </div>

          <form id="quick-tree" onSubmit={saveQuickTree} className="space-y-3">
            {SLOTS.map((s) => (
              <fieldset key={s.key} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                <label className="text-sm">{s.label}
                  <input value={entries[s.key].name} onChange={field(s.key, 'name')} placeholder="Full name" className="mt-1 block w-full px-3 py-2 border rounded-lg" />
                </label>
                <label className="text-sm">Born on (optional)
                  <input type="date" value={entries[s.key].birthDate} onChange={field(s.key, 'birthDate')} className="mt-1 block w-full px-3 py-2 border rounded-lg" />
                </label>
                <label className="text-sm">Born in (optional)
                  <input value={entries[s.key].birthPlace} onChange={field(s.key, 'birthPlace')} placeholder="Town, country" className="mt-1 block w-full px-3 py-2 border rounded-lg" />
                </label>
              </fieldset>
            ))}
            <button disabled={saving} className="px-5 py-3 bg-genesis-600 text-white rounded-lg hover:bg-genesis-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save and find my first records'}
            </button>
          </form>
        </div>
      )}

      {discovery && (
        <div className="bg-genesis-50 border border-genesis-200 rounded-lg p-4">
          <h3 className="font-semibold flex items-center gap-2"><Search className="w-4 h-4" /> Your first discovery: {discovery.who}</h3>
          {discovery.hits.length === 0 ? (
            <p className="text-sm text-gray-700 mt-1">Nothing in the open archives yet. Try Historical Records with other spellings, or the free archive links there.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {discovery.hits.map((h) => (
                <li key={h.url} className="text-sm">
                  <a href={h.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline inline-flex items-center gap-1">{h.title}<ExternalLink className="w-3 h-3" /></a>
                  <span className="text-gray-500"> · {h.sourceLabel}</span>
                  {h.snippet && <p className="text-gray-600">{h.snippet}</p>}
                </li>
              ))}
            </ul>
          )}
          <button onClick={() => open('records-search')} className="mt-2 text-sm text-genesis-700 hover:underline">Search more records →</button>
        </div>
      )}
    </div>
  );
};

export default GetStarted;
