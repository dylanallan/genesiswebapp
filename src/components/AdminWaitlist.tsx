import React, { useEffect, useState } from 'react';
import { Download, ListChecks, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { downloadFile } from './TreeImport';

interface Signup {
  email: string; name: string | null; source: string | null; code: string; referred_by: string | null; created_at: string;
  interest: string | null; organization: string | null; note: string | null;
}

// Who signed up, so the owner can follow up with societies, partners and investors personally.
const SEGMENTS: { id: string; label: string }[] = [
  { id: 'all', label: 'Everyone' }, { id: 'family', label: 'Families' }, { id: 'society', label: 'Societies & libraries' },
  { id: 'partner', label: 'Partners' }, { id: 'investor', label: 'Investors & buyers' },
];
const segmentOf = (r: Signup) => r.interest ?? 'family';
const segmentLabel = (id: string) => SEGMENTS.find((s) => s.id === id)?.label ?? id;

const csvCell = (v: string | number | null) => {
  const s = String(v ?? '');
  // Quote every cell; a leading = + - @ or space/tab/return is neutralised so a spreadsheet never runs it as a formula.
  return `"${(/^[\s=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
};

/** Admins only (the database shows rows to admins and nobody else): who joined the waitlist, and from where. */
export const AdminWaitlist: React.FC = () => {
  const [rows, setRows] = useState<Signup[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [segment, setSegment] = useState('all');

  const load = async () => {
    setFailed(false);
    const { data, error } = await supabase.from('waitlist_signups')
      .select('email,name,source,code,referred_by,created_at,interest,organization,note').order('created_at', { ascending: false }).limit(5000);
    if (error) { setFailed(true); return; }
    setRows((data ?? []) as Signup[]);
  };
  useEffect(() => { void load(); }, []);

  const invites = new Map<string, number>();
  for (const r of rows ?? []) if (r.referred_by) invites.set(r.referred_by, (invites.get(r.referred_by) ?? 0) + 1);
  const week = (rows ?? []).filter((r) => Date.now() - new Date(r.created_at).getTime() < 7 * 86_400_000).length;

  const shown = (rows ?? []).filter((r) => segment === 'all' || segmentOf(r) === segment);
  const count = (id: string) => (rows ?? []).filter((r) => id === 'all' || segmentOf(r) === id).length;

  const exportCsv = () => {
    const lines = [['email', 'name', 'type', 'organization', 'note', 'source', 'joined', 'invited'].map(csvCell).join(',')];
    for (const r of shown) lines.push([r.email, r.name, segmentLabel(segmentOf(r)), r.organization, r.note, r.source, r.created_at.slice(0, 10), invites.get(r.code) ?? 0].map(csvCell).join(','));
    downloadFile(`genesis-waitlist-${new Date().toISOString().slice(0, 10)}.csv`, lines.join('\n') + '\n', 'text/csv');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5" data-testid="admin-waitlist">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-xl font-semibold flex items-center gap-2"><ListChecks className="w-6 h-6 text-genesis-600" /> Waitlist</h2>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1 px-3 py-2 border rounded-lg"><RefreshCw className="w-4 h-4" /> Refresh</button>
          <button onClick={exportCsv} disabled={!rows?.length} className="flex items-center gap-1 px-3 py-2 bg-genesis-600 text-white rounded-lg disabled:opacity-50"><Download className="w-4 h-4" /> Download CSV</button>
        </div>
      </div>
      {failed && <p className="text-red-700" role="alert">Couldn’t load the waitlist. Please try again.</p>}
      {rows && (
        <>
          <p className="text-gray-700"><strong>{rows.length.toLocaleString()}</strong> {rows.length === 1 ? 'person' : 'people'} on the waitlist · <strong>{week}</strong> joined this week · <strong>{[...invites.values()].reduce((a, b) => a + b, 0)}</strong> came from an invite link.</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Show">
            {SEGMENTS.map((s) => (
              <button key={s.id} onClick={() => setSegment(s.id)} aria-pressed={segment === s.id}
                className={`px-3 py-2 rounded-full border text-sm ${segment === s.id ? 'bg-genesis-600 text-white border-genesis-600' : 'bg-white'}`}>
                {s.label} ({count(s.id)})
              </button>
            ))}
          </div>
          {rows.length === 0 ? <p className="text-gray-600">No one has joined yet. Share the home page link to get started.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left border-b"><th className="py-2 pr-3">Email</th><th className="py-2 pr-3">Name</th><th className="py-2 pr-3">Type</th><th className="py-2 pr-3">From</th><th className="py-2 pr-3">Joined</th><th className="py-2">Invited</th></tr></thead>
                <tbody>
                  {shown.slice(0, 500).map((r) => (
                    <tr key={r.code} className="border-b last:border-0">
                      <td className="py-2 pr-3 break-all">{r.email}</td><td className="py-2 pr-3">{r.name ?? ''}</td>
                      <td className="py-2 pr-3">{segmentLabel(segmentOf(r))}{r.organization ? ` · ${r.organization}` : ''}{r.note && <span className="block text-gray-600">{r.note}</span>}</td><td className="py-2 pr-3">{r.source ?? ''}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</td><td className="py-2">{invites.get(r.code) ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {shown.length > 500 && <p className="text-sm text-gray-500 mt-2">Showing the newest 500. Download the CSV for everyone.</p>}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminWaitlist;
