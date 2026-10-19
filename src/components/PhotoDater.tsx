import React, { useState } from 'react';
import { CalendarClock, ImagePlus, Loader2, PenLine } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { uploadOwnFile } from '../lib/storage';
import { getLang, t, useLang } from '../lib/i18n';
import { cleanEstimate, wholeDecade, type Confidence, type PhotoDate } from '../lib/photo-date';

const CONFIDENCE: Record<Confidence, string> = {
  low: 'A rough guess: the clues are few.',
  medium: 'A fair guess from several clues.',
  high: 'A good guess: the clues agree.',
};

// "When was this photo taken?": an honest range of years and the clues behind it, always shown as a guess.
export const PhotoDater: React.FC = () => {
  useLang();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [estimate, setEstimate] = useState<PhotoDate | null>(null);

  const choose = (f: File | undefined) => {
    setEstimate(null);
    if (!f) return;
    if (!f.type.startsWith('image/')) { toast.error(t('Please choose a photo (JPG or PNG).')); return; }
    if (f.size > 8 * 1024 * 1024) { toast.error(t('Please choose a photo smaller than 8 MB.')); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const run = async () => {
    if (!file) return;
    try {
      setBusy(t('Uploading your photo…'));
      const path = await uploadOwnFile('family-photos', file.name, file);
      setBusy(t('Looking for clues in the photo…'));
      const { data, error } = await supabase.functions.invoke('date-photo', { body: { path, lang: getLang() } });
      if (error || data?.error) {
        let message = data?.error as string | undefined;
        try { message = message ?? (await (error as { context?: Response }).context?.json())?.error; } catch { /* default below */ }
        throw new Error(message ? t(message) : t('The photo could not be dated. Please try again.'));
      }
      const e = cleanEstimate(data?.estimate);
      if (e === 'not-a-photo') throw new Error(t('This doesn’t look like a photograph. For an old record or letter, use “Read an old document”.'));
      if (!e) throw new Error(t('The photo could not be dated. Please try a different photo.'));
      setEstimate(e);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const decade = estimate ? wholeDecade(estimate) : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><CalendarClock className="w-6 h-6 text-genesis-600" /> {t('When was this photo taken?')}</h2>
        <p className="text-gray-600 mt-1">{t('Choose an old photo with no date on it. Genesis looks at the clothing, hairstyles, the kind of print and what’s in the background, and gives you a range of years.')}</p>
      </div>

      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-genesis-400">
        {preview ? <img src={preview} alt={t('Your chosen photo')} className="max-h-64 rounded" /> : <ImagePlus className="w-10 h-10 text-gray-400" />}
        <span className="mt-2 font-medium">{file ? t('Choose a different photo') : t('Choose an old photo')}</span>
        <input type="file" accept="image/*" className="sr-only" aria-label={t('Photo to date')} onChange={(e) => choose(e.target.files?.[0])} />
      </label>

      <button onClick={run} disabled={!file || busy !== null} className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-genesis-600 text-white rounded-lg disabled:opacity-50">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />} {busy ? t('Working…') : t('Estimate the date')}
      </button>
      {busy && <p className="text-sm text-genesis-700" role="status">{busy}</p>}

      {estimate && (
        <section className="space-y-3 rounded-lg border border-genesis-200 bg-genesis-50 p-4" data-testid="photo-date">
          <p className="text-sm text-gray-600">{t('Our best guess')}</p>
          <p className="text-3xl font-bold text-genesis-800">
            {decade !== null ? t('The {decade}s', { decade }) : t('{from} to {to}', { from: estimate.earliest, to: estimate.latest })}
          </p>
          <p className="text-gray-700">{t(CONFIDENCE[estimate.confidence])}</p>
          {estimate.writtenDate && (
            <p className="flex items-start gap-2 text-gray-800"><PenLine className="w-5 h-5 shrink-0 text-genesis-700" aria-hidden /> {t('Written on the photo: {date}. That’s a better clue than any guess.', { date: estimate.writtenDate })}</p>
          )}
          {estimate.clues.length > 0 && (
            <div>
              <h3 className="font-medium">{t('Clues we used')}</h3>
              <ul className="list-disc pl-5 text-gray-800">{estimate.clues.map((c) => <li key={c}>{c}</li>)}</ul>
            </div>
          )}
          <p className="text-xs text-gray-500">{t('This is an estimate, not a fact. A relative’s memory, a date on the back or the photographer’s stamp can tell you more.')}</p>
        </section>
      )}
    </div>
  );
};

export default PhotoDater;
