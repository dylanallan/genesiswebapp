import React, { useState } from 'react';
import { ImagePlus, Wand2, Download, Loader2, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { signedUrl, uploadOwnFile } from '../lib/storage';
import { t, useLang } from '../lib/i18n';

interface Result { original: string; restored: string; path: string }

export const PhotoRestore: React.FC = () => {
  useLang();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [colourise, setColourise] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [split, setSplit] = useState(50);

  const choose = (f: File | undefined) => {
    setResult(null);
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast.error(t('Please choose a photo (JPG or PNG).')); return; }
    if (f.size > 8 * 1024 * 1024) { toast.error(t('Please choose a photo smaller than 8 MB.')); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const restore = async () => {
    if (!file) return;
    try {
      setBusy(t('Uploading your photo…'));
      const path = await uploadOwnFile('family-photos', file.name, file);
      setBusy(colourise ? t('Repairing and colourising… this can take up to a minute') : t('Repairing… this can take up to a minute'));
      const { data, error } = await supabase.functions.invoke('restore-photo', { body: { path, colourise } });
      if (error || data?.error) {
        let message = data?.error as string | undefined;
        try { message = message ?? (await (error as { context?: Response }).context?.json())?.error; } catch { /* default below */ }
        throw new Error(message ?? t('The photo could not be restored. Please try again.'));
      }
      const [original, restored] = await Promise.all([signedUrl('family-photos', path), signedUrl('family-photos', data.path)]);
      setResult({ original, restored, path: data.path });
      setSplit(50);
      toast.success(t('Your restored photo is saved in your private photos.'));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><Wand2 className="w-6 h-6 text-genesis-600" /> {t('Restore an old photo')}</h2>
        <p className="text-gray-600 mt-1">{t('Repair scratches, tears and fading, and bring old black-and-white photos to life in colour. Your original is always kept.')}</p>
      </div>

      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-genesis-400">
        {preview && !result ? <img src={preview} alt={t('Your chosen photo')} className="max-h-64 rounded" /> : <ImagePlus className="w-10 h-10 text-gray-400" />}
        <span className="mt-2 font-medium">{file ? t('Choose a different photo') : t('Choose an old photo')}</span>
        <span className="text-sm text-gray-500">{t('A clear scan or a phone photo of the print works best.')}</span>
        <input type="file" accept="image/*" className="sr-only" aria-label={t('Photo to restore')} onChange={(e) => choose(e.target.files?.[0])} />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={colourise} onChange={(e) => setColourise(e.target.checked)} />
          <Palette className="w-4 h-4 text-genesis-600" /> {t('Add natural colour')}
        </label>
        <button onClick={restore} disabled={!file || busy !== null} className="flex items-center gap-2 px-4 py-2 bg-genesis-600 text-white rounded-lg disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} {busy ? t('Working…') : t('Restore photo')}
        </button>
      </div>
      {busy && <p className="text-sm text-genesis-700" role="status">{busy}</p>}

      {result && (
        <div className="space-y-3">
          <div className="relative w-full overflow-hidden rounded-lg border select-none" aria-label={t('Before and after comparison')}>
            <img src={result.restored} alt={t('Restored photo')} className="block w-full" />
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${split}%` }}>
              <img src={result.original} alt={t('Original photo')} className="block h-full max-w-none object-cover" style={{ width: `${10000 / Math.max(split, 1)}%` }} />
            </div>
            <div className="absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${split}%` }} />
            <span className="absolute top-2 left-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded">{t('Before')}</span>
            <span className="absolute top-2 right-2 text-xs bg-black/60 text-white px-2 py-0.5 rounded">{t('After')}</span>
          </div>
          <input type="range" min={0} max={100} value={split} onChange={(e) => setSplit(Number(e.target.value))} className="w-full" aria-label={t('Slide to compare before and after')} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-gray-500">{t('Restored with AI: small details can differ from the real photo, so we keep your original too.')}</p>
            <a href={result.restored} download className="flex items-center gap-2 px-4 py-2 border rounded-lg"><Download className="w-4 h-4" /> {t('Download')}</a>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoRestore;
