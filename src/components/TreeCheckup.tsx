import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { loadAllFamilyRows } from '../lib/family';
import { checkTree, TreeIssue } from '../lib/tree-checks';

interface Row {
  id: string; first_name: string | null; middle_name: string | null; last_name: string | null;
  birth_date: string | null; death_date: string | null; is_living: boolean | null; gender: string | null;
  parent_ids: string[] | null; spouse_ids: string[] | null; children_ids: string[] | null;
}

export const TreeCheckup: React.FC<{ open?: (featureId: string) => void }> = () => {
  const [issues, setIssues] = useState<TreeIssue[] | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const rows = await loadAllFamilyRows<Row>('id,first_name,middle_name,last_name,birth_date,death_date,is_living,gender,parent_ids,spouse_ids,children_ids');
      setCount(rows.length);
      setIssues(checkTree(rows.map((r) => ({
        id: r.id,
        name: [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ') || 'Unknown',
        birthDate: r.birth_date, deathDate: r.death_date, isLiving: r.is_living, gender: r.gender,
        parentIds: r.parent_ids ?? [], spouseIds: r.spouse_ids ?? [], childrenIds: r.children_ids ?? [],
      }))).sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'error' ? -1 : 1)));
    } catch (e) {
      toast.error(`Could not check your tree: ${(e as Error).message}`);
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
          <h2 className="text-xl font-semibold flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-genesis-600" /> Tree checkup</h2>
          <p className="text-gray-600 mt-1">Finds likely mistakes: impossible dates, parents who were too young, people listed twice, and more. Free, and it never changes anything by itself.</p>
        </div>
        <button onClick={run} disabled={loading} className="flex items-center gap-1 px-3 py-2 border rounded-lg disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Check again</button>
      </div>

      {issues && (
        count === 0 ? <p className="text-gray-600">Your tree is empty. Add or import people first.</p>
          : issues.length === 0 ? (
            <p className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg p-4"><ShieldCheck className="w-5 h-5" /> All {count.toLocaleString()} people look right. No problems found.</p>
          ) : (
            <>
              <p className="text-gray-700">Checked {count.toLocaleString()} people: <strong>{errors} {errors === 1 ? 'problem' : 'problems'}</strong> and <strong>{warnings} {warnings === 1 ? 'thing' : 'things'} to double-check</strong>. Fix them in your Family tree.</p>
              <ul className="space-y-2">
                {issues.slice(0, 300).map((i, n) => (
                  <li key={n} className={`flex gap-2 rounded-lg p-3 border ${i.severity === 'error' ? 'bg-red-50 border-red-200 text-red-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                    {i.severity === 'error' ? <AlertOctagon className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
                    <span>{i.message}</span>
                  </li>
                ))}
              </ul>
              {issues.length > 300 && <p className="text-sm text-gray-500">Showing the first 300 of {issues.length}.</p>}
            </>
          )
      )}
    </div>
  );
};

export default TreeCheckup;
