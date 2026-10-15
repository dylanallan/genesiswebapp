import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trees, Plus, Microscope, X, Users, BookHeart, Link2, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { loadAllFamilyRows } from '../lib/family';
import { defaultFocus, pedigree, PedigreePerson, PedigreeSlot, usedGenerations } from '../lib/pedigree';
import { describeRelationship, findRelationship } from '../lib/relationship';
import { posterHtml } from '../lib/tree-poster';

interface Row {
  id: string; first_name: string | null; middle_name: string | null; last_name: string | null; gender: string | null;
  birth_date: string | null; death_date: string | null; birth_location: string | null; relationship: string | null;
  parent_ids: string[] | null; children_ids: string[] | null; spouse_ids: string[] | null;
}

const BOX_W = 210, BOX_H = 66, GAP_X = 44, ROW = 78, MAX_GEN = 5;
const toPerson = (r: Row): PedigreePerson => ({
  id: r.id, name: [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ') || 'Unknown', gender: r.gender,
  birthDate: r.birth_date, deathDate: r.death_date, birthPlace: r.birth_location, relationship: r.relationship,
  parentIds: r.parent_ids ?? [], childrenIds: r.children_ids ?? [], spouseIds: r.spouse_ids ?? [],
});
const years = (p: PedigreePerson) => {
  const b = p.birthDate?.slice(0, 4), d = p.deathDate?.slice(0, 4);
  if (b && !d) return `b. ${b}`;
  return b || d ? `${b ?? '?'} – ${d ?? '?'}` : '';
};

interface AddTarget { childId: string; role: 'father' | 'mother' }

export const PedigreeChart: React.FC = () => {
  const navigate = useNavigate();
  const [people, setPeople] = useState<PedigreePerson[] | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [meId, setMeId] = useState<string | null>(null); // who "you" are, for the relationship calculator
  const [adding, setAdding] = useState<AddTarget | null>(null);
  const [form, setForm] = useState({ name: '', birthDate: '', birthPlace: '' });
  const [saving, setSaving] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const rows = await loadAllFamilyRows<Row>('id,first_name,middle_name,last_name,gender,birth_date,death_date,birth_location,relationship,parent_ids,children_ids,spouse_ids');
      const list = rows.map(toPerson);
      setPeople(list);
      setFocusId((f) => (f && list.some((p) => p.id === f) ? f : defaultFocus(list)));
      setMeId((m) => (m && list.some((p) => p.id === m) ? m : defaultFocus(list)));
    } catch {
      toast.error('Could not load your family tree.');
      setPeople([]);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const byId = useMemo(() => new Map((people ?? []).map((p) => [p.id, p])), [people]);
  const slots = useMemo(() => (focusId ? pedigree(focusId, people ?? [], MAX_GEN) : []), [focusId, people]);
  // Show every filled generation plus one more, so there is always room to add the next parents.
  const gens = Math.min(MAX_GEN, usedGenerations(slots) + 1);
  const shown = slots.filter((s) => s.gen < gens);
  const height = Math.max(2 ** (gens - 1), 2) * ROW;
  const pos = (s: Pick<PedigreeSlot, 'gen' | 'index'>) => ({
    x: s.gen * (BOX_W + GAP_X),
    y: ((s.index + 0.5) * height) / 2 ** s.gen - BOX_H / 2,
  });

  const saveParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adding || !form.name.trim()) return;
    const child = byId.get(adding.childId);
    if (!child) return;
    setSaving(true);
    const parts = form.name.trim().split(/\s+/);
    // One database step adds the parent and links them to the child, siblings and the other parent,
    // so adding a father and then a mother quickly can never lose a link.
    const { error } = await supabase.rpc('add_parent', {
      p_child: child.id, p_role: adding.role, p_first: parts[0],
      p_middle: parts.length > 2 ? parts.slice(1, -1).join(' ') : null, p_last: parts.length > 1 ? parts[parts.length - 1] : '',
      p_birth_date: form.birthDate || null, p_birth_place: form.birthPlace.trim() || null,
    });
    if (error) toast.error(`Could not add: ${error.message}`);
    else toast.success(`${form.name.trim()} added as ${child.name}'s ${adding.role}`);
    await load();
    setSaving(false);
    setAdding(null);
    setForm({ name: '', birthDate: '', birthPlace: '' });
  };

  const focus = focusId ? byId.get(focusId) ?? null : null;
  const kin = useMemo(() => (focus && meId && people ? findRelationship(meId, focus.id, people) : null), [focus, meId, people]);

  // Keep the chosen person in view: big trees are taller than the chart window.
  useEffect(() => {
    const el = scroller.current;
    if (!el || !focusId) return;
    el.scrollTo({ top: Math.max(0, height / 2 - el.clientHeight / 2), left: 0 });
  }, [focusId, height]);
  // A free printable poster of up to six generations (print it, or choose "Save as PDF").
  const printPoster = () => {
    if (!focus || !people) return;
    const w = window.open('', '_blank');
    if (!w) { toast.error('Please allow pop-ups to print your tree.'); return; }
    w.document.write(posterHtml(`${focus.name}'s family tree`, pedigree(focus.id, people, 6)));
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 300);
  };
  const research = (id: string) => navigate(`/dashboard?feature=research-assistant&person=${id}`);

  if (people === null) return <p className="p-6 text-gray-600">Loading your family tree…</p>;
  if (people.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center space-y-3">
        <Trees className="w-10 h-10 mx-auto text-genesis-600" />
        <p className="text-gray-700">Your tree is empty. Start on the "Get started" page, or import a tree from Ancestry or MyHeritage.</p>
        <button onClick={() => navigate('/dashboard?feature=welcome')} className="px-4 py-2 bg-genesis-600 text-white rounded-lg">Get started</button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold flex items-center gap-2"><Trees className="w-6 h-6 text-genesis-600" /> Family tree</h2>
        <div className="flex flex-wrap items-center gap-3">
        <button onClick={printPoster} className="flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm hover:bg-gray-50">
          <Printer className="w-4 h-4" /> Print poster
        </button>
        <label className="text-sm flex items-center gap-2">Show the tree of
          <select value={focusId ?? ''} onChange={(e) => setFocusId(e.target.value)} className="px-2 py-1 border rounded-lg max-w-[220px]">
            {people.slice(0, 2000).map((p) => <option key={p.id} value={p.id}>{p.name}{years(p) ? ` (${years(p)})` : ''}</option>)}
          </select>
        </label>
        </div>
      </div>
      <p className="text-sm text-gray-500">Click anyone to move the tree to them. Use the dashed boxes to add a missing parent.</p>

      <div ref={scroller} className="overflow-auto border rounded-lg bg-[#faf7f0]" style={{ maxHeight: 640 }}>
        <div className="relative" style={{ width: gens * (BOX_W + GAP_X), height: height + 16, margin: 8 }}>
          <svg className="absolute inset-0 pointer-events-none" width={gens * (BOX_W + GAP_X)} height={height + 16} aria-hidden="true">
            {shown.filter((s) => s.gen > 0 && (s.person || s.childId)).map((s) => {
              const child = pos({ gen: s.gen - 1, index: Math.floor(s.index / 2) });
              const me = pos(s);
              const x1 = child.x + BOX_W, y1 = child.y + BOX_H / 2, x2 = me.x, y2 = me.y + BOX_H / 2, mid = x1 + GAP_X / 2;
              return <path key={`${s.gen}-${s.index}`} d={`M${x1} ${y1}H${mid}V${y2}H${x2}`} fill="none" stroke={s.person ? '#7c8a80' : '#d5d0c4'} strokeWidth={1.5} />;
            })}
          </svg>
          {shown.map((s) => {
            const { x, y } = pos(s);
            const style = { left: x, top: y, width: BOX_W, height: BOX_H };
            if (s.person) {
              const colour = s.person.gender === 'female' ? 'border-l-rose-400' : s.person.gender === 'male' ? 'border-l-sky-500' : 'border-l-gray-400';
              return (
                <button key={`${s.gen}-${s.index}`} onClick={() => setFocusId(s.person!.id)} style={style}
                  className={`absolute text-left bg-white border border-gray-200 border-l-4 ${colour} rounded-lg px-3 py-1.5 shadow-sm hover:shadow-md ${s.gen === 0 ? 'ring-2 ring-genesis-400' : ''}`}>
                  <span className="block font-medium text-sm truncate">{s.person.name}</span>
                  <span className="block text-xs text-gray-500 truncate">{[years(s.person), s.person.birthPlace].filter(Boolean).join(' · ')}</span>
                </button>
              );
            }
            if (!s.childId) return null;
            return (
              <button key={`${s.gen}-${s.index}`} style={style} onClick={() => setAdding({ childId: s.childId!, role: s.role === 'mother' ? 'mother' : 'father' })}
                className="absolute flex items-center justify-center gap-1 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-genesis-400 hover:text-genesis-700">
                <Plus className="w-4 h-4" /> Add {s.role === 'mother' ? 'mother' : 'father'}
              </button>
            );
          })}
        </div>
      </div>

      {focus && (
        <div className="border rounded-lg p-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-semibold">{focus.name}</p>
            <p className="text-sm text-gray-600">{[years(focus), focus.birthPlace].filter(Boolean).join(' · ') || 'No dates yet'}</p>
            {[['Spouses', focus.spouseIds], ['Children', focus.childrenIds]].map(([label, ids]) => (ids as string[]).length > 0 && (
              <p key={label as string} className="text-sm mt-2 flex flex-wrap items-center gap-1">
                <Users className="w-4 h-4 text-gray-400" /> {label as string}:
                {(ids as string[]).map((id) => byId.get(id)).filter(Boolean).map((p) => (
                  <button key={p!.id} onClick={() => setFocusId(p!.id)} className="px-2 py-0.5 bg-gray-100 rounded-full hover:bg-genesis-50">{p!.name}</button>
                ))}
              </p>
            ))}
            {meId && (
              <div className="mt-3 text-sm bg-genesis-50 rounded-lg p-3 space-y-1" data-testid="relationship">
                <p className="flex flex-wrap items-center gap-1">
                  <Link2 className="w-4 h-4 text-genesis-600" /> How {focus.name.split(' ')[0]} is related to
                  <select aria-label="Related to" value={meId} onChange={(e) => setMeId(e.target.value)} className="px-1 py-0.5 border rounded max-w-[180px] bg-white">
                    {people.slice(0, 2000).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </p>
                <p className="font-semibold">{meId === focus.id ? 'Pick someone else in the tree to see how they are related.' : describeRelationship(focus.name, kin, /^(self|me|myself)$/i.test(byId.get(meId)?.relationship ?? '') ? undefined : byId.get(meId)?.name)}</p>
                {kin && kin.kind !== 'self' && kin.path.length > 2 && <p className="text-gray-600">Through: {kin.path.join(' → ')}</p>}
                {kin?.dnaPercent != null && kin.kind === 'blood' && (
                  <p className="text-gray-600">You would share about {kin.dnaPercent}% of your DNA (an average; real amounts vary).</p>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate(`/dashboard?feature=life-story&person=${focus.id}`)} className="flex items-center gap-2 px-3 py-2 border rounded-lg">
              <BookHeart className="w-4 h-4" /> Life story
            </button>
            <button onClick={() => research(focus.id)} className="flex items-center gap-2 px-3 py-2 bg-genesis-600 text-white rounded-lg">
              <Microscope className="w-4 h-4" /> Research {focus.name.split(' ')[0]}
            </button>
          </div>
        </div>
      )}

      {adding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <form onSubmit={saveParent} className="w-full max-w-md bg-white rounded-xl shadow-xl p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Add {byId.get(adding.childId)?.name}'s {adding.role}</h3>
              <button type="button" onClick={() => setAdding(null)} aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
            <label className="block text-sm">Full name
              <input required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-lg" />
            </label>
            <label className="block text-sm">Born on (optional)
              <input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} className="mt-1 w-full px-3 py-2 border rounded-lg" />
            </label>
            <label className="block text-sm">Born in (optional)
              <input value={form.birthPlace} onChange={(e) => setForm({ ...form, birthPlace: e.target.value })} placeholder="Town, country" className="mt-1 w-full px-3 py-2 border rounded-lg" />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAdding(null)} className="px-4 py-2 border rounded-lg">Cancel</button>
              <button disabled={saving} className="px-4 py-2 bg-genesis-600 text-white rounded-lg disabled:opacity-50">{saving ? 'Saving…' : 'Add to tree'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PedigreeChart;
