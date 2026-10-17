import React, { useState } from 'react';
import { Upload, Download, CheckCircle2, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { loadAllFamilyRows } from '../lib/family';
import { decodeGedcom, parseGedcom, toFamilyRows, toGedcom, GedcomParseResult, ExportPerson } from '../lib/gedcom';

const BATCH = 400;

export function downloadFile(name: string, content: string | Uint8Array, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content as BlobPart], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function treeAsGedcom(): Promise<{ text: string; count: number }> {
  const rows = await loadAllFamilyRows<ExportPerson>('id,first_name,middle_name,last_name,gender,birth_date,birth_location,death_date,death_location,is_living,notes,parent_ids,spouse_ids');
  return { text: toGedcom(rows), count: rows.length };
}

export async function exportTreeAsGedcom() {
  const { text, count } = await treeAsGedcom();
  downloadFile('my-family-tree.ged', text, 'text/vnd.familysearch.gedcom');
  return count;
}

export const TreeImport: React.FC = () => {
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState<GedcomParseResult | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const [existing, setExisting] = useState(0);

  const onFile = async (file: File | undefined) => {
    setDone(null);
    setParsed(null);
    if (!file) return;
    setFileName(file.name);
    try {
      const result = parseGedcom(decodeGedcom(await file.arrayBuffer()).text);
      if (!result.people.length) {
        toast.error('No people were found in that file. Please choose a GEDCOM (.ged) family tree file.');
        return;
      }
      const { data: auth } = await supabase.auth.getUser();
      const { count } = await supabase.from('family_members').select('id', { count: 'exact', head: true }).eq('user_id', auth.user?.id ?? '');
      setExisting(count ?? 0);
      setParsed(result);
    } catch {
      toast.error('That file could not be read. Please choose a GEDCOM (.ged) family tree file.');
    }
  };

  const runImport = async () => {
    if (!parsed) return;
    const rows = toFamilyRows(parsed.people);
    setProgress(0);
    let inserted = 0;
    try {
      for (let i = 0; i < rows.length; i += BATCH) {
        const { error } = await supabase.from('family_members').insert(rows.slice(i, i + BATCH));
        if (error) throw error;
        inserted = Math.min(rows.length, i + BATCH);
        setProgress(inserted);
      }
      setDone(rows.length);
      setParsed(null);
      toast.success(`${rows.length} people added to your family tree`);
    } catch (e) {
      // Undo the part that was added, so the tree is never left half-imported with broken links.
      const added = rows.slice(0, inserted).map((r) => r.id);
      for (let i = 0; i < added.length; i += BATCH) await supabase.from('family_members').delete().in('id', added.slice(i, i + BATCH));
      toast.error(`The import did not finish (${(e as Error).message}), so nothing was added. Please try again.`);
    } finally {
      setProgress(null);
    }
  };

  const onExport = async () => {
    try {
      const n = await exportTreeAsGedcom();
      toast.success(n ? `Downloaded ${n} people as a GEDCOM file` : 'Your tree is empty, so the file has no people yet');
    } catch (e) {
      toast.error(`Could not export: ${(e as Error).message}`);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><Upload className="w-6 h-6 text-genesis-600" /> Bring your tree here</h2>
        <p className="text-gray-600 mt-1">
          Already built a tree on Ancestry, MyHeritage, FamilySearch or another site? Move it here in about two minutes.
        </p>
      </div>

      <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-700">
        <li><strong>Ancestry:</strong> open your tree, click the tree name, choose <em>Tree settings</em>, then <em>Export tree</em>. Download the <code>.ged</code> file.</li>
        <li><strong>MyHeritage:</strong> Family tree, then <em>Manage trees</em>, then <em>Export to GEDCOM</em>.</li>
        <li><strong>FamilySearch / others:</strong> look for <em>Export</em> or <em>GEDCOM</em> in the tree menu.</li>
        <li>Choose that file below.</li>
      </ol>

      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-genesis-400">
        <FileText className="w-10 h-10 text-gray-400" />
        <span className="mt-2 font-medium">{fileName || 'Choose your .ged file'}</span>
        <span className="text-sm text-gray-500">Your file is read on your device and saved only to your private account.</span>
        <input type="file" accept=".ged,.gedcom,text/plain" className="sr-only" aria-label="GEDCOM file" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>

      {parsed && (
        <div className="bg-genesis-50 border border-genesis-200 rounded-lg p-4 space-y-3">
          <p>
            Found <strong>{parsed.people.length.toLocaleString()} people</strong> in <strong>{parsed.familyCount.toLocaleString()} families</strong>
            {parsed.source ? <> (from {parsed.source})</> : null}.
          </p>
          {existing > 0 && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded p-2">
              Your tree already has {existing.toLocaleString()} people. Importing adds everyone in this file as well, so anyone already in your tree will appear twice.
            </p>
          )}
          <p className="text-sm text-gray-600">
            They will be added to your tree. Dates that are only approximate (like "about 1890") are kept in each person's notes.
          </p>
          <button onClick={runImport} disabled={progress !== null} className="px-4 py-2 bg-genesis-600 text-white rounded-lg hover:bg-genesis-700 disabled:opacity-50">
            {progress !== null ? `Adding... ${progress} of ${parsed.people.length}` : `Add ${parsed.people.length.toLocaleString()} people to my tree`}
          </button>
        </div>
      )}

      {done !== null && (
        <p className="flex items-center gap-2 text-green-700"><CheckCircle2 className="w-5 h-5" /> Done! {done.toLocaleString()} people are now in your family tree.</p>
      )}

      <div className="border-t pt-4">
        <h3 className="font-semibold">Take your tree anywhere</h3>
        <p className="text-sm text-gray-600 mb-2">Your tree is yours. Download it as a GEDCOM file that any genealogy site can open.</p>
        <button onClick={onExport} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Download className="w-4 h-4" /> Download my tree (.ged)
        </button>
      </div>
    </div>
  );
};

export default TreeImport;
