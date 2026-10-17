import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, BookOpen, UtensilsCrossed, Archive, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Row = Record<string, string | null>;

interface Hit { kind: string; title: string; detail: string; open: string; icon: React.ComponentType<{ className?: string }> }

// Searches everything the person has saved in Genesis: people, stories, recipes, traditions and saved records.
export const FamilySearch: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    // Characters that would change the meaning of the database filter are dropped.
    const q = query.replace(/[%,()*\\]/g, ' ').trim();
    if (q.length < 2) return;
    setBusy(true); setFailed(false);
    const like = `%${q}%`;
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id ?? '';
    const [people, stories, recipes, traditions, records] = await Promise.all([
      supabase.from('family_members').select('id,first_name,middle_name,last_name,birth_date,birth_location')
        .eq('user_id', uid).or(`first_name.ilike.${like},middle_name.ilike.${like},last_name.ilike.${like},birth_location.ilike.${like},death_location.ilike.${like}`).limit(25),
      supabase.from('cultural_stories').select('id,title,storyteller').eq('user_id', uid).or(`title.ilike.${like},content.ilike.${like},storyteller.ilike.${like}`).limit(15),
      supabase.from('recipes').select('id,name,origin').eq('user_id', uid).or(`name.ilike.${like},origin.ilike.${like},story.ilike.${like}`).limit(15),
      supabase.from('traditions').select('id,name,origin').eq('user_id', uid).or(`name.ilike.${like},description.ilike.${like},origin.ilike.${like}`).limit(15),
      supabase.from('saved_records').select('id,title,source').eq('user_id', uid).or(`title.ilike.${like},notes.ilike.${like}`).limit(15),
    ]);
    setBusy(false);
    if ([people, stories, recipes, traditions, records].every((r) => r.error)) { setFailed(true); setHits(null); return; }
    const out: Hit[] = [
      ...((people.data ?? []) as Row[]).map((p) => ({
        kind: 'Person', icon: User, open: `/dashboard?feature=life-story&person=${p.id}`,
        title: [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(' ') || 'Unnamed person',
        detail: [p.birth_date ? `born ${p.birth_date.slice(0, 4)}` : '', p.birth_location ?? ''].filter(Boolean).join(', '),
      })),
      ...((stories.data ?? []) as Row[]).map((s) => ({ kind: 'Story', icon: BookOpen, open: '/dashboard?feature=cultural-stories', title: s.title ?? 'Untitled story', detail: s.storyteller ? `told by ${s.storyteller}` : '' })),
      ...((recipes.data ?? []) as Row[]).map((r) => ({ kind: 'Recipe', icon: UtensilsCrossed, open: '/dashboard?feature=cultural-recipes', title: r.name ?? 'Recipe', detail: r.origin ?? '' })),
      ...((traditions.data ?? []) as Row[]).map((t) => ({ kind: 'Tradition', icon: Sparkles, open: '/dashboard?feature=traditions', title: t.name ?? 'Tradition', detail: t.origin ?? '' })),
      ...((records.data ?? []) as Row[]).map((r) => ({ kind: 'Saved record', icon: Archive, open: '/dashboard?feature=data-table', title: r.title ?? 'Record', detail: r.source ?? '' })),
    ];
    setHits(out);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><Search className="w-6 h-6 text-genesis-600" /> Search my family</h2>
        <p className="text-gray-600 mt-1">Find anyone or anything you've saved: people, places, stories, recipes, traditions and records.</p>
      </div>
      <form onSubmit={run} className="flex flex-wrap gap-2" role="search">
        <label htmlFor="family-search" className="sr-only">Search my family</label>
        <input id="family-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="A name, a town, a dish…" className="flex-1 min-w-0 px-3 py-2 border rounded-lg" />
        <button disabled={busy || query.trim().length < 2} className="flex items-center gap-2 px-4 py-2 bg-genesis-600 text-white rounded-lg disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search
        </button>
      </form>

      {failed && <p className="text-red-700" role="alert">Search isn't working right now. Please check your connection and try again.</p>}
      {hits && hits.length === 0 && <p className="text-gray-600" role="status">Nothing found for "{query.trim()}". Try part of a name, or a town.</p>}
      {hits && hits.length > 0 && (
        <ul className="divide-y border rounded-lg" data-testid="family-search-results">
          {hits.map((h, i) => (
            <li key={`${h.kind}-${i}`}>
              <button onClick={() => navigate(h.open)} className="w-full text-left flex items-start gap-3 p-3 hover:bg-gray-50">
                <h.icon className="w-5 h-5 text-genesis-600 mt-0.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block font-medium">{h.title}</span>
                  <span className="block text-sm text-gray-600">{[h.kind, h.detail].filter(Boolean).join(' · ')}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FamilySearch;
