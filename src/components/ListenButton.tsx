import React, { useEffect, useRef, useState } from 'react';
import { Pause, Play, Square, Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { getLang, t, useLang } from '../lib/i18n';
import { chunkForSpeech, pickVoice, speechLang } from '../lib/speech';

// Reads a story aloud: with the device's own voice (free, works offline), or with a family voice the user
// preserved with consent on the Voice page (read through the voice-clone function).

type Status = 'idle' | 'playing' | 'paused';
const CLONE_MAX = 2400; // the voice-clone function takes up to 2,500 characters per request

// Only one reading at a time: starting one stops whichever was playing.
let stopActive: (() => void) | null = null;

const synth = () => (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null);

interface Props {
  text: string;
  title?: string;
  /** A voice the user preserved (voice_profiles.id); without it the device voice reads. */
  voiceProfileId?: string | null;
  /** The language the text is written in, when known (e.g. a story's language). */
  lang?: string | null;
  /** Button text, e.g. "Listen to the whole book". */
  label?: string;
}

export const ListenButton: React.FC<Props> = ({ text, title, voiceProfileId, lang, label }) => {
  useLang();
  const [status, setStatus] = useState<Status>('idle');
  const [loading, setLoading] = useState(false);
  const run = useRef(0); // bumps on every start/stop so callbacks from an old reading are ignored
  const audio = useRef<HTMLAudioElement | null>(null);
  const mine = useRef<(() => void) | null>(null);
  const playing = useRef(false);
  playing.current = status !== 'idle';

  const stop = () => {
    run.current++;
    if (stopActive && stopActive === mine.current) stopActive = null;
    if (audio.current) { audio.current.pause(); audio.current = null; }
    synth()?.cancel();
    setStatus('idle');
    setLoading(false);
  };
  const stopRef = useRef(stop);
  stopRef.current = stop;
  useEffect(() => () => { if (playing.current) stopRef.current(); }, []); // stop reading when the story closes

  const full = [title, text].filter((s) => s && s.trim()).join('.\n');
  if (!full.trim() || (!voiceProfileId && !synth())) return null;

  const begin = () => {
    stopActive?.();
    const me = ++run.current;
    mine.current = () => stopRef.current();
    stopActive = mine.current;
    return me;
  };

  const startDevice = () => {
    const s = synth()!;
    const me = begin();
    s.cancel();
    const language = speechLang(getLang(), lang);
    const voice = pickVoice(s.getVoices(), language);
    const chunks = chunkForSpeech(full);
    let i = 0;
    const next = () => {
      if (run.current !== me) return;
      if (i >= chunks.length) { stop(); return; }
      const u = new SpeechSynthesisUtterance(chunks[i++]);
      u.lang = language;
      if (voice) u.voice = voice;
      u.rate = 0.95; // a little slower, easier to follow
      u.onend = next;
      u.onerror = (e) => { if (run.current === me && e.error !== 'interrupted' && e.error !== 'canceled') next(); };
      s.speak(u);
    };
    setStatus('playing');
    next();
  };

  const startVoice = async () => {
    const me = begin();
    const chunks = chunkForSpeech(full, CLONE_MAX);
    setStatus('playing');
    for (const chunk of chunks) {
      if (run.current !== me) return;
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('voice-clone', { body: { action: 'speak', profileId: voiceProfileId, text: chunk } });
      if (run.current !== me) return;
      setLoading(false);
      const url = (data as { audioUrl?: string } | null)?.audioUrl;
      if (error || !url) {
        let message = t('The family voice could not read this. Please try again.');
        try { const b = await (error as { context?: Response } | null)?.context?.json(); if (b?.error) message = b.error; } catch { /* default */ }
        toast.error(message);
        stop();
        return;
      }
      const a = new Audio(url);
      audio.current = a;
      const finished = await new Promise<boolean>((done) => {
        a.onended = () => done(true);
        a.onerror = () => done(false);
        a.play().catch(() => done(false));
      });
      if (run.current !== me) return;
      if (!finished) { toast.error(t('The family voice could not read this. Please try again.')); stop(); return; }
    }
    if (run.current === me) stop();
  };

  const pause = () => {
    if (audio.current) audio.current.pause(); else synth()?.pause();
    setStatus('paused');
  };
  const resume = () => {
    if (audio.current) void audio.current.play(); else synth()?.resume();
    setStatus('playing');
  };

  const btn = 'inline-flex items-center gap-2 px-4 py-2 min-h-[44px] border rounded-lg text-sm font-medium bg-white hover:bg-gray-50';
  return (
    <div className="flex flex-wrap items-center gap-2 font-sans" data-testid="listen">
      {status === 'idle' ? (
        <button type="button" onClick={() => (voiceProfileId ? void startVoice() : startDevice())} className={`${btn} text-genesis-700`}>
          <Volume2 className="w-4 h-4" aria-hidden /> {label ?? t('Listen')}
        </button>
      ) : (
        <>
          {status === 'playing'
            ? <button type="button" onClick={pause} disabled={loading} className={`${btn} disabled:opacity-50`}><Pause className="w-4 h-4" aria-hidden /> {t('Pause')}</button>
            : <button type="button" onClick={resume} className={btn}><Play className="w-4 h-4" aria-hidden /> {t('Resume')}</button>}
          <button type="button" onClick={stop} className={btn}><Square className="w-4 h-4" aria-hidden /> {t('Stop')}</button>
        </>
      )}
      <span role="status" aria-live="polite" className="text-sm text-gray-600">
        {loading ? t('Getting the family voice ready…') : status === 'playing' ? t('Reading aloud…') : status === 'paused' ? t('Paused') : ''}
      </span>
    </div>
  );
};

interface VoiceProfile { id: string; name: string }

/** The voices this user preserved (only their own; the database enforces this too). */
export function useVoiceProfiles(): VoiceProfile[] {
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  useEffect(() => {
    let live = true;
    supabase.auth.getUser().then(async ({ data }: { data: { user: { id: string } | null } }) => {
      if (!data.user) return;
      const { data: rows } = await supabase.from('voice_profiles').select('id,name').eq('user_id', data.user.id).order('created_at', { ascending: false });
      if (live && Array.isArray(rows)) setProfiles(rows as VoiceProfile[]);
    }).catch(() => undefined);
    return () => { live = false; };
  }, []);
  return profiles;
}

/** "Read aloud with": the device voice or a preserved family voice. Shown only when the user has one. */
export const VoicePicker: React.FC<{ profiles: VoiceProfile[]; value: string; onChange: (id: string) => void }> = ({ profiles, value, onChange }) => {
  useLang();
  if (profiles.length === 0) return null;
  return (
    <label className="text-sm flex flex-wrap items-center gap-2">{t('Read aloud with')}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="px-3 py-2 min-h-[44px] border rounded-lg">
        <option value="">{t('This device’s voice')}</option>
        {profiles.map((p) => <option key={p.id} value={p.id}>{t('{name}’s voice', { name: p.name })}</option>)}
      </select>
    </label>
  );
};

export default ListenButton;
