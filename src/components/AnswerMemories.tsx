import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Check, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSaveGuard } from '../lib/use-save-guard';
import Logo from './Logo';

interface MemoryRequest { from_name: string; relative_name: string; questions: string[]; answered: number[]; closed: boolean }

type Recognition = { lang: string; continuous: boolean; interimResults: boolean; start(): void; stop(): void; onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null };
const SpeechRecognition = (): (new () => Recognition) | null => {
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

/** The page a relative opens from an "Ask a relative" link: no account, big text, type or speak each answer. */
export const AnswerMemories: React.FC<{ token: string }> = ({ token }) => {
  const [req, setReq] = useState<MemoryRequest | null | undefined>(undefined);
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const recognition = useRef<Recognition | null>(null);
  const guard = useSaveGuard();
  const canSpeak = SpeechRecognition() !== null;

  useEffect(() => {
    supabase.rpc('get_memory_request', { p_token: token }).then(({ data, error: e }: { data: unknown; error: unknown }) => {
      if (e) { setReq(null); return; }
      const r = data as MemoryRequest | null;
      setReq(r);
      if (r) setIndex(Math.max(0, r.questions.findIndex((_, i) => !r.answered.includes(i))));
    });
  }, [token]);

  useEffect(() => { setText(''); setSaved(false); setError(''); }, [index]);
  useEffect(() => () => recognition.current?.stop(), []);

  const toggleSpeech = () => {
    if (listening) { recognition.current?.stop(); return; }
    const Rec = SpeechRecognition();
    if (!Rec) return;
    const rec = new Rec();
    rec.lang = navigator.language || 'en-CA';
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      let said = '';
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) said += e.results[i][0].transcript;
      if (said.trim()) setText((t) => `${t}${t && !t.endsWith(' ') ? ' ' : ''}${said.trim()}`);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => { setListening(false); setError('The microphone didn’t work. You can type your answer instead.'); };
    recognition.current = rec;
    setError('');
    setListening(true);
    rec.start();
  };

  const save = guard(async () => {
    if (!req || !text.trim()) return;
    recognition.current?.stop();
    setSaving(true); setError('');
    const { error: e } = await supabase.rpc('answer_memory_request', { p_token: token, p_index: index, p_text: text });
    setSaving(false);
    if (e) { setError(e.message || 'That didn’t save. Please try again.'); return; }
    setReq({ ...req, answered: req.answered.includes(index) ? req.answered : [...req.answered, index] });
    setSaved(true);
  });

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-[#faf7f0] text-[#1e2a24] px-4 py-8" style={{ fontSize: '20px' }}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-[#2E5A44]"><Logo /></div>
        {children}
      </div>
    </div>
  );

  if (req === undefined) return shell(<p className="flex items-center gap-2"><Loader2 className="w-6 h-6 animate-spin" /> Opening…</p>);
  if (req === null) return shell(<div className="space-y-3"><h1 className="font-serif text-3xl font-bold">This link doesn’t work</h1><p>Please ask the person who sent it for a new link.</p></div>);
  if (req.closed) return shell(<div className="space-y-3"><h1 className="font-serif text-3xl font-bold">Thank you, {req.relative_name}</h1><p>{req.from_name} has closed this link. Your answers are safely saved.</p></div>);

  const total = req.questions.length;
  const done = req.answered.length;
  const allDone = done === total;
  const last = index === total - 1;

  return shell(
    <main className="space-y-6" data-testid="answer-memories">
      <div className="space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">Hello {req.relative_name}</h1>
        <p className="text-[#3d4a43]">{req.from_name} is saving your family’s stories and would love to hear yours. Answer as much or as little as you like. You can type, or press the microphone and just talk.</p>
        <p className="text-base text-[#5c6660]" aria-live="polite">{done} of {total} answered</p>
      </div>

      <section className="rounded-2xl bg-white border border-black/10 p-6 space-y-4">
        <p className="text-base text-[#5c6660]">Question {index + 1} of {total}</p>
        <h2 id="memory-question" className="font-serif text-2xl sm:text-3xl font-semibold leading-snug">{req.questions[index]}</h2>
        {req.answered.includes(index) && !saved && <p className="text-base text-[#2E5A44] flex items-center gap-1"><Check className="w-5 h-5" /> You’ve answered this one. Writing again will replace your answer.</p>}
        <textarea aria-labelledby="memory-question" value={text} onChange={(e) => { setText(e.target.value); setSaved(false); }} rows={6} maxLength={20000}
          className="w-full p-4 border-2 border-[#d9cfbc] rounded-xl text-xl leading-relaxed" placeholder="Your answer…" />
        {canSpeak && (
          <button type="button" onClick={toggleSpeech} aria-pressed={listening}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl text-xl font-semibold border-2 ${listening ? 'bg-red-50 border-red-600 text-red-800' : 'bg-[#efe8da] border-[#2E5A44] text-[#1f3a2e]'}`}>
            {listening ? <><MicOff className="w-7 h-7" /> Stop listening</> : <><Mic className="w-7 h-7" /> Speak instead of typing</>}
          </button>
        )}
        {error && <p className="text-red-700" role="alert">{error}</p>}
        {saved ? (
          <p className="flex items-center gap-2 text-[#2E5A44] text-xl font-semibold" role="status"><Check className="w-7 h-7" /> Saved. Thank you!</p>
        ) : (
          <button onClick={save} disabled={saving || !text.trim()} className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-[#2E5A44] text-white text-xl font-semibold disabled:opacity-50">
            {saving && <Loader2 className="w-6 h-6 animate-spin" />} Save my answer
          </button>
        )}
      </section>

      <div className="flex justify-between gap-3">
        <button onClick={() => setIndex(index - 1)} disabled={index === 0} className="flex items-center gap-1 px-5 py-3 rounded-xl border-2 border-[#d9cfbc] bg-white disabled:opacity-40"><ChevronLeft className="w-6 h-6" /> Back</button>
        <button onClick={() => setIndex(index + 1)} disabled={last} className="flex items-center gap-1 px-5 py-3 rounded-xl border-2 border-[#2E5A44] bg-white text-[#1f3a2e] font-semibold disabled:opacity-40">{saved ? 'Next question' : 'Skip'} <ChevronRight className="w-6 h-6" /></button>
      </div>

      {allDone && <p className="rounded-xl bg-[#e3efe7] p-4 text-[#1f3a2e]" role="status">You’ve answered every question. Thank you, {req.relative_name}! {req.from_name} will treasure these. You can go back and add more to any answer.</p>}
      <p className="text-base text-[#5c6660]">Your answers go only to {req.from_name}’s private family tree on Genesis Heritage.</p>
    </main>,
  );
};

export default AnswerMemories;
