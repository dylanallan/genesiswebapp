import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe2, Trees, Map as MapIcon } from 'lucide-react';
import { toast } from 'sonner';
import { loadAllFamilyRows } from '../lib/family';
import { heritageMix, MixPerson } from '../lib/heritage-mix';
import { defaultFocus } from '../lib/pedigree';

interface Row {
  id: string; first_name: string | null; middle_name: string | null; last_name: string | null; birth_location: string | null;
  relationship: string | null; parent_ids: string[] | null; birth_date: string | null;
}

const COLOURS = ['#2E5A44', '#B5843A', '#4F7CAC', '#A2574F', '#6B8E4E', '#8C6BB1', '#C9A227', '#3E8E8E', '#B05C8A', '#5C6670'];

export const HeritageMix: React.FC = () => {
  const navigate = useNavigate();
  const [people, setPeople] = useState<(MixPerson & { relationship: string | null; birthDate: string | null })[] | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    loadAllFamilyRows<Row>('id,first_name,middle_name,last_name,birth_location,relationship,parent_ids,birth_date')
      .then((rows) => {
        const list = rows.map((r) => ({
          id: r.id, name: [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ') || 'Unknown', birthPlace: r.birth_location,
          parentIds: r.parent_ids ?? [], relationship: r.relationship, birthDate: r.birth_date,
        }));
        setPeople(list);
        setFocusId(defaultFocus(list.map((p) => ({ ...p, gender: null, deathDate: null, childrenIds: [], spouseIds: [] }))));
      })
      .catch(() => { toast.error('Could not load your family tree.'); setPeople([]); });
  }, []);

  const mix = useMemo(() => (focusId && people ? heritageMix(focusId, people) : null), [focusId, people]);
  const focus = people?.find((p) => p.id === focusId);

  if (people === null) return <p className="p-6 text-gray-600">Loading your family…</p>;
  if (!people.length) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center space-y-3">
        <Globe2 className="w-10 h-10 mx-auto text-genesis-600" />
        <p className="text-gray-700">Add your family first, and we'll show you where they came from.</p>
        <button onClick={() => navigate('/dashboard?feature=welcome')} className="px-4 py-2 bg-genesis-600 text-white rounded-lg">Get started</button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Globe2 className="w-6 h-6 text-genesis-600" /> Where your family comes from</h2>
          <p className="text-gray-600 mt-1">Worked out from where your ancestors were born. No DNA test needed.</p>
        </div>
        <label className="text-sm flex items-center gap-2">For
          <select value={focusId ?? ''} onChange={(e) => setFocusId(e.target.value)} className="px-2 py-1 border rounded-lg max-w-[220px]">
            {people.slice(0, 2000).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
      </div>

      {mix && (
        <>
          <div className="flex h-8 w-full overflow-hidden rounded-full border" role="img" aria-label="Heritage breakdown">
            {mix.shares.map((s, i) => <div key={s.country} title={`${s.country} ${s.percent}%`} style={{ width: `${s.percent}%`, background: COLOURS[i % COLOURS.length] }} />)}
            {mix.unknown > 0 && <div title={`Not yet known ${mix.unknown}%`} style={{ width: `${mix.unknown}%` }} className="bg-gray-200" />}
          </div>

          <ul className="space-y-3" data-testid="heritage-shares">
            {mix.shares.map((s, i) => (
              <li key={s.country} className="flex items-start gap-3">
                <span className="mt-1 w-4 h-4 rounded-full shrink-0" style={{ background: COLOURS[i % COLOURS.length] }} />
                <div className="flex-1">
                  <p className="font-semibold">{s.country} <span className="text-genesis-700">{s.percent}%</span></p>
                  <p className="text-sm text-gray-600">From {s.ancestors.slice(0, 6).join(', ')}{s.ancestors.length > 6 ? ` and ${s.ancestors.length - 6} more` : ''}</p>
                </div>
              </li>
            ))}
            {mix.unknown > 0 && (
              <li className="flex items-start gap-3">
                <span className="mt-1 w-4 h-4 rounded-full shrink-0 bg-gray-200" />
                <div className="flex-1">
                  <p className="font-semibold">Not yet known <span className="text-gray-600">{mix.unknown}%</span></p>
                  <p className="text-sm text-gray-600">Add missing parents and birthplaces to fill this in.</p>
                </div>
              </li>
            )}
          </ul>

          <p className="text-sm text-gray-600">
            Based on {mix.generations} generation{mix.generations === 1 ? '' : 's'} of {focus?.name.split(' ')[0]}'s tree. Each person is half from each parent,
            so this shows where the earliest known ancestors on every line were born. The further back your tree goes, the more accurate it gets.
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate('/dashboard?feature=family-tree-chart')} className="flex items-center gap-2 px-3 py-2 bg-genesis-600 text-white rounded-lg">
              <Trees className="w-4 h-4" /> Add more ancestors
            </button>
            <button onClick={() => navigate('/dashboard?feature=family-map')} className="flex items-center gap-2 px-3 py-2 border rounded-lg">
              <MapIcon className="w-4 h-4" /> See them on the map
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default HeritageMix;
