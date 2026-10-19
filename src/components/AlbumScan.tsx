import React, { useEffect, useState } from 'react';
import { BookImage, Check, ImagePlus, Loader2, RotateCw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { uploadOwnFile } from '../lib/storage';
import { t, useLang } from '../lib/i18n';
import { cropsFrom, fitWithin, nextTurn, turnedSize, type Crop } from '../lib/album-scan';

interface Found extends Crop { keep: boolean; preview: string }

const savedText = (n: number) => (n === 1 ? t('1 photo saved to your private photos.') : t('{n} photos saved to your private photos.', { n }));

const toBlob = (c: HTMLCanvasElement) => new Promise<Blob>((resolve, reject) =>
  c.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not prepare the photo.'))), 'image/jpeg', 0.92));

// The page drawn upright (phone photos carry their rotation separately) and shrunk to a sensible size,
// so the server and the browser crop exactly the same pixels.
async function loadPage(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const { w, h } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  return canvas;
}

function cut(page: HTMLCanvasElement, c: Crop): HTMLCanvasElement {
  const out = document.createElement('canvas');
  const size = turnedSize(c);
  out.width = size.w; out.height = size.h;
  const ctx = out.getContext('2d')!;
  ctx.translate(size.w / 2, size.h / 2);
  ctx.rotate((c.turn * Math.PI) / 180);
  ctx.drawImage(page, c.x, c.y, c.w, c.h, -c.w / 2, -c.h / 2, c.w, c.h);
  return out;
}

// Scan a whole album page with the phone camera: each photo on it is found, cropped and saved on its own.
export const AlbumScan: React.FC = () => {
  useLang();
  const [page, setPage] = useState<HTMLCanvasElement | null>(null);
  const [pagePreview, setPagePreview] = useState<string | null>(null);
  const [found, setFound] = useState<Found[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState(0);
  useEffect(() => () => { if (pagePreview) URL.revokeObjectURL(pagePreview); }, [pagePreview]);

  const choose = async (f: File | undefined) => {
    setFound(null); setSaved(0);
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast.error(t('Please choose a photo (JPG or PNG).')); return; }
    try {
      const canvas = await loadPage(f);
      setPage(canvas);
      setPagePreview(URL.createObjectURL(await toBlob(canvas)));
    } catch {
      toast.error(t('That photo could not be opened. Please try another.'));
    }
  };

  const scan = async () => {
    if (!page) return;
    try {
      setBusy(t('Uploading your photo…'));
      const path = await uploadOwnFile('family-photos', 'album-page.jpg', await toBlob(page), 'image/jpeg');
      setBusy(t('Finding the photos on the page…'));
      const { data, error } = await supabase.functions.invoke('find-photos', { body: { path } });
      if (error || data?.error) {
        let message = data?.error as string | undefined;
        try { message = message ?? (await (error as { context?: Response }).context?.json())?.error; } catch { /* default below */ }
        throw new Error(message ? t(message) : t('The album page could not be scanned. Please try again.'));
      }
      const crops = cropsFrom(data?.photos, page.width, page.height);
      setFound(crops.map((c) => ({ ...c, keep: true, preview: cut(page, c).toDataURL('image/jpeg', 0.8) })));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const update = (i: number, change: Partial<Found>) => setFound((list) => list && list.map((f, j) => {
    if (j !== i) return f;
    const next = { ...f, ...change };
    return change.turn !== undefined && page ? { ...next, preview: cut(page, next).toDataURL('image/jpeg', 0.8) } : next;
  }));

  const keep = found?.filter((f) => f.keep) ?? [];
  const save = async () => {
    if (!page || !keep.length) return;
    try {
      let n = 0;
      for (const f of keep) {
        n += 1;
        setBusy(t('Saving photo {n} of {total}…', { n, total: keep.length }));
        await uploadOwnFile('family-photos', `album-photo-${n}.jpg`, await toBlob(cut(page, f)), 'image/jpeg');
      }
      setSaved(keep.length);
      setFound(null);
      toast.success(savedText(keep.length));
    } catch {
      toast.error(t('Could not save. Please try again.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><BookImage className="w-6 h-6 text-genesis-600" /> {t('Scan an album page')}</h2>
        <p className="text-gray-600 mt-1">{t('Take one photo of a whole album page, or of several prints on a table. Genesis finds each photo, crops it and saves it on its own.')}</p>
      </div>

      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-genesis-400">
        {pagePreview ? <img src={pagePreview} alt={t('Your album page')} className="max-h-64 rounded" /> : <ImagePlus className="w-10 h-10 text-gray-400" />}
        <span className="mt-2 font-medium">{page ? t('Choose a different photo') : t('Choose a photo of the album page')}</span>
        <span className="text-sm text-gray-500">{t('Hold the phone straight above the page, in good light, without flash glare.')}</span>
        <input type="file" accept="image/*" className="sr-only" aria-label={t('Photo of the album page')} onChange={(e) => choose(e.target.files?.[0])} />
      </label>

      <button onClick={scan} disabled={!page || busy !== null} className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-genesis-600 text-white rounded-lg disabled:opacity-50">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookImage className="w-4 h-4" />} {busy ? t('Working…') : t('Find the photos')}
      </button>
      {busy && <p className="text-sm text-genesis-700" role="status">{busy}</p>}
      {saved > 0 && <p className="text-genesis-800" role="status">{savedText(saved)}</p>}

      {found && found.length === 0 && <p className="text-gray-700">{t('No separate photos were found. Try again from straight above, with the whole page showing.')}</p>}
      {found && found.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-semibold">{found.length === 1 ? t('1 photo found. Turn it if it’s sideways.') : t('{n} photos found. Untick any you don’t want, and turn any that are sideways.', { n: found.length })}</h3>
          <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {found.map((f, i) => (
              <li key={i} className={`border-2 rounded-lg p-2 space-y-2 ${f.keep ? 'border-genesis-400' : 'border-gray-200 opacity-60'}`}>
                <img src={f.preview} alt={t('Photo {n}', { n: i + 1 })} className="w-full h-32 object-contain bg-gray-50 rounded" />
                <div className="flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm min-h-[44px]">
                    <input type="checkbox" className="w-5 h-5" checked={f.keep} onChange={(e) => update(i, { keep: e.target.checked })} />
                    {t('Keep')}
                  </label>
                  <button onClick={() => update(i, { turn: nextTurn(f.turn) })} aria-label={t('Turn photo {n}', { n: i + 1 })} className="w-11 h-11 flex items-center justify-center border rounded-lg">
                    <RotateCw className="w-5 h-5" aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button onClick={save} disabled={!keep.length || busy !== null} className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-genesis-600 text-white rounded-lg disabled:opacity-50">
            {keep.length ? <Save className="w-4 h-4" /> : <Check className="w-4 h-4" />} {keep.length === 1 ? t('Save 1 photo') : t('Save {n} photos', { n: keep.length })}
          </button>
        </section>
      )}
    </div>
  );
};

export default AlbumScan;
