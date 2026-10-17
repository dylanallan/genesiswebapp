import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, RefreshCw, GitMerge, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { loadAllFamilyRows } from '../lib/family';
import { checkTree, TreeIssue } from '../lib/tree-checks';
import { locale, t, useLang } from '../lib/i18n';
import { chooseKeeper, mergedFields, MERGE_FIELDS, MergeField, MergeRow, suggestChoices } from '../lib/merge';

interface Row extends MergeRow { is_living: boolean | null }

const fullName = (r: MergeRow) => [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ') || t('Unknown');
const links = (r: MergeRow) => {
  const n = (r.parent_ids?.length ?? 0) + (r.spouse_ids?.length ?? 0) + (r.children_ids?.length ?? 0);
  return n === 1 ? t('1 family link') : t('{n} family links', { n });
};

// Side-by-side view of two records for the same person. The person picks which value to keep for each detail.
const MergeDialog: React.FC<{ a: Row; b: Row; onClose: () => void; onMerged: () => void }> = ({ a, b, onClose, onMerged }) => {
  useLang();
  const [keep, remove] = chooseKeeper(a, b) as [Row, Row];
  const [choices, setChoices] = useState(() => suggestChoices(keep, remove));
  const [busy, setBusy] = useState(false);
  const differing = MERGE_FIELDS.filter((f) => (keep[f.key] ?? '').trim() !== (remove[f.key] ?? '').trim());

  const undo = async (mergeId: string) => {
    const { error } = await supabase.rpc('undo_family_merge', { p_merge: mergeId });
    if (error) { toast.error(t('We could not undo that merge. Please try again.')); return; }
    toast.success(t('Merge undone. Both records are back.'));
    onMerged();
  };

  const merge = async () => {
    setBusy(true);
    const { data: mergeId, error } = await supabase.rpc('merge_family_members', { p_keep: keep.id, p_remove: remove.id, p_fields: mergedFields(keep, remove, choices) });
    if (error || !mergeId) { setBusy(false); toast.error(t('We could not merge these records. Nothing was changed.')); return; }
    const { error: delError } = await supabase.from('family_members').delete().eq('id', remove.id);
    setBusy(false);
    if (delError) {
      await supabase.rpc('undo_family_merge', { p_merge: mergeId });
      toast.error(t('We could not finish the merge, so nothing was changed. Please try again.'));
      return;
    }
    toast.success(t('Merged into one record for {name}.', { name: fullName(keep) }), { duration: 15000, action: { label: t('Undo'), onClick: () => { void undo(mergeId as string); } } });
    onMerged();
  };

  const cell = (side: 'keep' | 'remove', key: MergeField) => {
    const value = (side === 'keep' ? keep : remove)[key];
    return (
      <label className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer ${choices[key] === side ? 'border-genesis-600 bg-genesis-50' : 'border-gray-200'}`}>
        <input type="radio" name={`merge-${key}`} checked={choices[key] === side} onChange={() => setChoices({ ...choices, [key]: side })} className="mt-1" />
        <span className={value ? '' : 'text-gray-400 italic'}>{value || t('empty')}</span>
      </label>
    );
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="merge-title" className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" data-testid="merge-dialog">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 space-y-4">
        <h3 id="merge-title" className="text-lg font-semibold flex items-center gap-2"><GitMerge className="w-5 h-5 text-genesis-600" /> {t('Merge two records for {name}', { name: fullName(keep) })}</h3>
        <p className="text-sm text-gray-600">
          {t('All family links and stories from both records are kept.')} {t(differing.length > 0 ? 'Where the two records disagree, choose which detail is right. We picked the most complete one for you.' : 'The two records have the same details.')} {t('You can undo this straight after.')}
        </p>
        <div className="grid grid-cols-2 gap-2 text-sm font-medium text-gray-700">
          <span>{t('Record 1')} · {links(keep)}</span><span>{t('Record 2')} · {links(remove)}</span>
        </div>
        {differing.map((f) => (
          <fieldset key={f.key} className="space-y-1">
            <legend className="text-sm font-medium">{t(f.label)}</legend>
            <div className="grid grid-cols-2 gap-2 text-sm break-words">{cell('keep', f.key)}{cell('remove', f.key)}</div>
          </fieldset>
        ))}
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <button onClick={onClose} disabled={busy} className="px-4 py-2 border rounded-lg">{t('Cancel')}</button>
          <button onClick={merge} disabled={busy} className="flex items-center gap-2 px-4 py-2 bg-genesis-600 text-white rounded-lg disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitMerge className="w-4 h-4" />} {t('Merge into one person')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const TreeCheckup: React.FC<{ open?: (featureId: string) => void }> = () => {
  useLang();
  const [issues, setIssues] = useState<TreeIssue[] | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Map<string, Row>>(new Map());
  const [merging, setMerging] = useState<[Row, Row] | null>(null);

  const run = async () => {
    setLoading(true);
    try {
      const rows = await loadAllFamilyRows<Row>('id,first_name,middle_name,last_name,gender,birth_date,birth_location,death_date,death_location,notes,is_living,parent_ids,spouse_ids,children_ids');
      setCount(rows.length);
      setRows(new Map(rows.map((r) => [r.id, r])));
      setIssues(checkTree(rows.map((r) => ({
        id: r.id,
        name: [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ') || t('Unknown'),
        birthDate: r.birth_date, deathDate: r.death_date, isLiving: r.is_living, gender: r.gender,
        parentIds: r.parent_ids ?? [], spouseIds: r.spouse_ids ?? [], childrenIds: r.children_ids ?? [],
      }))).sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'error' ? -1 : 1)));
    } catch (e) {
      toast.error(t('Could not check your tree: {error}', { error: (e as Error).message }));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { run(); }, []);

  const errors = issues?.filter((i) => i.severity === 'error').length ?? 0;
  const warnings = (issues?.length ?? 0) - errors;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-genesis-600" /> {t('Tree checkup')}</h2>
          <p className="text-gray-600 mt-1">{t('Finds likely mistakes: impossible dates, parents who were too young, people listed twice, and more. Free, and it never changes anything without asking you.')}</p>
        </div>
        <button onClick={run} disabled={loading} className="flex items-center gap-1 px-3 py-2 border rounded-lg disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> {t('Check again')}</button>
      </div>

      {issues && (
        count === 0 ? <p className="text-gray-600">{t('Your tree is empty. Add or import people first.')}</p>
          : issues.length === 0 ? (
            <p className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-4"><ShieldCheck className="w-5 h-5" /> {t('All {n} people look right. No problems found.', { n: count.toLocaleString(locale()) })}</p>
          ) : (
            <>
              <p className="text-gray-700">{t('Checked {n} people:', { n: count.toLocaleString(locale()) })} <strong>{errors === 1 ? t('1 problem') : t('{n} problems', { n: errors })}</strong> {t('and')} <strong>{warnings === 1 ? t('1 thing to double-check') : t('{n} things to double-check', { n: warnings })}</strong>. {t('Fix them in your Family tree, or tap Merge when someone is listed twice.')}</p>
              <ul className="space-y-2">
                {issues.slice(0, 300).map((i, n) => (
                  <li key={n} className={`flex gap-2 rounded-lg p-3 border ${i.severity === 'error' ? 'bg-red-50 border-red-200 text-red-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                    {i.severity === 'error' ? <AlertOctagon className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
                    <span className="flex-1">{i.message}</span>
                    {i.otherId && rows.has(i.personId) && rows.has(i.otherId) && (
                      <button onClick={() => setMerging([rows.get(i.otherId!)!, rows.get(i.personId)!])}
                        className="shrink-0 self-start flex items-center gap-1 px-3 py-1 bg-white border border-amber-300 rounded-lg text-amber-900 hover:bg-amber-100">
                        <GitMerge className="w-4 h-4" /> {t('Merge')}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              {issues.length > 300 && <p className="text-sm text-gray-500">{t('Showing the first 300 of {n}.', { n: issues.length })}</p>}
            </>
          )
      )}
      {merging && <MergeDialog a={merging[0]} b={merging[1]} onClose={() => setMerging(null)} onMerged={() => { setMerging(null); void run(); }} />}
    </div>
  );
};

export default TreeCheckup;
