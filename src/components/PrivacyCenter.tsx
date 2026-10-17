import React, { useState } from 'react';
import { ShieldCheck, Download, Trash2, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { downloadFile, exportTreeAsGedcom, treeAsGedcom } from './TreeImport';
import { t, useLang } from '../lib/i18n';
import { listAllFiles, makeZip, MEDIA_BUCKETS, README, zipPath, type ListFn } from '../lib/full-export';

export const PRIVACY_PROMISES = [
  'We never sell your data or your family\'s data. Not to advertisers, not to insurers, not to anyone.',
  'Your tree, photos, recordings and stories are private to you unless you choose to share them.',
  'If you upload a DNA results file, it is used only to show you your own insights. It is never sold or shared.',
  'You can download everything you have saved, at any time, in standard formats.',
  'You can delete your account and everything in it, at any time, in one step.',
];

export const PrivacyCenter: React.FC = () => {
  useLang();
  const [busy, setBusy] = useState<'zip' | 'export' | 'gedcom' | 'delete' | null>(null);
  const [zipProgress, setZipProgress] = useState('');
  const [confirmText, setConfirmText] = useState('');

  // One .zip with the data, the tree and every photo and recording. A file that can't be fetched is listed, not fatal.
  const exportZip = async () => {
    setBusy('zip');
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error(t('Please sign in again.'));
      setZipProgress(t('Gathering your saved data…'));
      const { data, error } = await supabase.rpc('export_my_data');
      if (error) throw error;
      const tree = await treeAsGedcom();
      const files: Record<string, Uint8Array | string> = {
        'README.txt': README,
        'my-data.json': JSON.stringify(data, null, 2),
        'my-family-tree.ged': tree.text,
      };
      const list: ListFn = async (bucket, prefix) => {
        const { data: items, error: listError } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
        if (listError) throw listError;
        return (items ?? []).map((i: { name: string; id: string | null }) => ({ name: i.name, id: i.id ?? null }));
      };
      const missing: string[] = [];
      let media = 0;
      for (const { bucket, folder } of MEDIA_BUCKETS) {
        const paths = await listAllFiles(list, bucket, uid).catch(() => [] as string[]);
        for (let i = 0; i < paths.length; i++) {
          setZipProgress(t('Adding {what} ({n} of {total})…', { what: t(folder).toLowerCase(), n: i + 1, total: paths.length }));
          const { data: blob, error: dlError } = await supabase.storage.from(bucket).download(paths[i]);
          if (dlError || !blob) { missing.push(zipPath(folder, paths[i])); continue; }
          files[zipPath(folder, paths[i])] = new Uint8Array(await blob.arrayBuffer());
          media++;
        }
      }
      if (missing.length) files['NOT-INCLUDED.txt'] = `These files could not be downloaded just now. Please try again later:\n${missing.join('\n')}\n`;
      setZipProgress(t('Packing your download…'));
      downloadFile(`genesis-heritage-${new Date().toISOString().slice(0, 10)}.zip`, await makeZip(files), 'application/zip');
      toast.success(`${t('Downloaded your data, {people} and {files}.', { people: tree.count === 1 ? t('1 person') : t('{n} people', { n: tree.count }), files: media === 1 ? t('1 file') : t('{n} files', { n: media }) })}${missing.length ? ` ${t('{n} could not be included; see NOT-INCLUDED.txt', { n: missing.length })}` : ''}`);
    } catch (e) {
      toast.error(`${t('Could not prepare your download:')} ${(e as Error).message}`);
    } finally {
      setBusy(null);
      setZipProgress('');
    }
  };

  const exportAll = async () => {
    setBusy('export');
    try {
      const { data, error } = await supabase.rpc('export_my_data');
      if (error) throw error;
      downloadFile(`genesis-heritage-my-data-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json');
      toast.success(t('Your data has been downloaded'));
    } catch (e) {
      toast.error(`${t('Could not download your data:')} ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  const exportTree = async () => {
    setBusy('gedcom');
    try {
      const n = await exportTreeAsGedcom();
      toast.success(t('Downloaded {n} people as a GEDCOM file', { n }));
    } catch (e) {
      toast.error(`${t('Could not export your tree:')} ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  const deleteAccount = async () => {
    if (confirmText !== 'DELETE') return;
    setBusy('delete');
    try {
      const { data, error } = await supabase.functions.invoke('delete-account', { body: { confirm: 'DELETE' } });
      if (error || data?.error) {
        let message = data?.error as string | undefined;
        try { message = message ?? (await (error as { context?: Response }).context?.json())?.error; } catch { /* keep default */ }
        throw new Error(message ?? t('Please try again in a moment.'));
      }
      toast.success(t('Your account and everything in it has been deleted.'));
      await supabase.auth.signOut();
    } catch (e) {
      toast.error(`${t('Could not delete your account:')} ${(e as Error).message}`);
      setBusy(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-green-600" /> {t('Your data & privacy')}</h2>
        <p className="text-gray-600 mt-1">{t('Our promise to you and your family:')}</p>
        <ul className="mt-2 space-y-1">
          {PRIVACY_PROMISES.map((p) => (
            <li key={p} className="flex gap-2 text-gray-800"><span className="text-green-600">✓</span>{t(p)}</li>
          ))}
        </ul>
      </div>

      <div className="border-t pt-4 space-y-2">
        <h3 className="font-semibold">{t('Download everything')}</h3>
        <p className="text-sm text-gray-600">{t('One file with everything: your saved data, your family tree, and every photo and recording you’ve added.')}</p>
        <button onClick={exportZip} disabled={busy !== null} className="flex items-center gap-2 px-4 py-2 bg-genesis-600 text-white rounded-lg hover:bg-genesis-700 disabled:opacity-50">
          <Archive className="w-4 h-4" /> {busy === 'zip' ? t('Preparing…') : t('Download everything (.zip)')}
        </button>
        {zipProgress && <p className="text-sm text-gray-600" role="status">{zipProgress}</p>}
        <p className="text-sm text-gray-500 pt-2">{t('Or just one part:')}</p>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportAll} disabled={busy !== null} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <Download className="w-4 h-4" /> {busy === 'export' ? t('Preparing…') : t('My data only (.json)')}
          </button>
          <button onClick={exportTree} disabled={busy !== null} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <Download className="w-4 h-4" /> {busy === 'gedcom' ? t('Preparing…') : t('Download my family tree (.ged)')}
          </button>
        </div>
      </div>

      <div className="border-t pt-4 space-y-2">
        <h3 className="font-semibold text-red-700">{t('Delete my account')}</h3>
        <p className="text-sm text-gray-600">
          {t('This permanently removes your account, family tree, stories, photos and recordings. It cannot be undone. Download your data first if you want to keep a copy.')}
        </p>
        <label className="block text-sm">
          {t('Type')} <strong>DELETE</strong> {t('to confirm')}
          <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className="mt-1 block w-48 px-3 py-2 border border-gray-300 rounded-lg" aria-label={t('Type DELETE to confirm')} />
        </label>
        <button onClick={deleteAccount} disabled={confirmText !== 'DELETE' || busy !== null} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
          <Trash2 className="w-4 h-4" /> {busy === 'delete' ? t('Deleting…') : t('Permanently delete my account')}
        </button>
      </div>
    </div>
  );
};

export default PrivacyCenter;
