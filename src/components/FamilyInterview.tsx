import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Volume2, ChevronRight, ChevronLeft, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { uploadOwnFile } from '../lib/storage';
import { chatApi } from '../api/chat';

export const INTERVIEW_TOPICS: Record<string, string[]> = {
  'Childhood': [
    'Where and when were you born? What was that place like?',
    'What is your earliest memory?',
    'What was your house like when you were a child? Who lived there with you?',
    'What games did you play, and who were your friends?',
    'What was school like for you?',
  ],
  'Family': [
    'What were your parents like? What did they do for work?',
    'What do you know about your grandparents and where they came from?',
    'Did the family ever move to a new town or country? Why, and what was it like?',
    'Who in the family made you laugh the most?',
    'Are there family sayings or nicknames that everyone knows?',
  ],
  'Love and work': [
    'How did you meet your husband, wife or partner?',
    'What was your first job? What other work have you done?',
    'What are you most proud of in your life?',
    'What was the hardest time you lived through, and how did you get through it?',
  ],
  'Traditions and food': [
    'What holidays or celebrations were most important in your family?',
    'What dish reminds you most of home? Who made it, and how?',
    'What songs, prayers or customs did your family keep?',
    'What language or languages did your family speak at home?',
  ],
  'Wisdom': [
    'What do you wish you had known when you were young?',
    'What would you like your grandchildren and great-grandchildren to know about you?',
    'How would you like to be remembered?',
  ],
};

const LANGS = [
  { code: 'en-CA', label: 'English' }, { code: 'es-MX', label: 'Español' }, { code: 'fr-CA', label: 'Français' },
  { code: 'pt-BR', label: 'Português' }, { code: 'it-IT', label: 'Italiano' }, { code: 'tl-PH', label: 'Tagalog' },
  { code: 'pa-IN', label: 'ਪੰਜਾਬੀ' }, { code: 'zh-CN', label: '中文' }, { code: 'ar-SA', label: 'العربية' },
];

type Answers = Record<string, string>;
interface RecognitionEvent { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }
type Recognition = { lang: string; continuous: boolean; interimResults: boolean; start: () => void; stop: () => void; onresult: ((e: RecognitionEvent) => void) | null; onend: (() => void) | null };
type RecognitionCtor = new () => Recognition;
const speechWindow = () => (typeof window === 'undefined' ? {} : window) as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };

export const FamilyInterview: React.FC = () => {
  const [people, setPeople] = useState<Array<{ id: string; name: string }>>([]);
  const [personId, setPersonId] = useState('');
  const [personName, setPersonName] = useState('');
  const [lang, setLang] = useState('en-CA');
  const [topics, setTopics] = useState<string[]>(Object.keys(INTERVIEW_TOPICS));
  const [started, setStarted] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [recording, setRecording] = useState(false);
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const recognition = useRef<Recognition | null>(null);

  const questions = topics.flatMap((t) => INTERVIEW_TOPICS[t]);
  const question = questions[index];
  const SpeechRecognition = speechWindow().SpeechRecognition ?? speechWindow().webkitSpeechRecognition ?? null;

  useEffect(() => {
    supabase.from('family_members').select('id,first_name,last_name').order('birth_date', { ascending: true }).limit(1000)
      .then(({ data }: { data: Array<{ id: string; first_name: string; last_name: string | null }> | null }) =>
        setPeople((data ?? []).map((m) => ({ id: m.id, name: [m.first_name, m.last_name].filter(Boolean).join(' ') }))));
    return () => { recognition.current?.stop(); recorder.current?.stop(); };
  }, []);

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const startListening = () => {
    if (!SpeechRecognition) return;
    const r: Recognition = new SpeechRecognition();
    r.lang = lang;
    r.continuous = true;
    r.interimResults = false;
    const q = question;
    r.onresult = (e) => {
      let text = '';
      for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) text += e.results[i][0].transcript;
      if (text) setAnswers((a) => ({ ...a, [q]: `${a[q] ? a[q] + ' ' : ''}${text.trim()}` }));
    };
    r.onend = () => setListening(false);
    recognition.current = r;
    r.start();
    setListening(true);
  };
  const stopListening = () => { recognition.current?.stop(); setListening(false); };

  const begin = async () => {
    if (!personName.trim()) { toast.error('Who are you interviewing? Choose or type their name.'); return; }
    // Start clean, so a new interview can never pick up the previous interview's recording.
    chunks.current = [];
    recorder.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      rec.onstop = () => stream.getTracks().forEach((t) => t.stop());
      rec.start(1000);
      recorder.current = rec;
      setRecording(true);
    } catch {
      toast.warning('The microphone is not available, so answers will be typed instead of recorded.');
    }
    setStarted(true);
    setIndex(0);
    setTimeout(() => speak(questions[0]), 300);
  };

  const go = (delta: number) => {
    stopListening();
    const next = Math.max(0, Math.min(questions.length - 1, index + delta));
    setIndex(next);
    speak(questions[next]);
  };

  const transcript = () => questions.filter((q) => answers[q]?.trim()).map((q) => `Q: ${q}\nA: ${answers[q].trim()}`).join('\n\n');

  const finishRecording = (): Promise<Blob | null> => new Promise((resolve) => {
    const rec = recorder.current;
    if (!rec || rec.state === 'inactive') { resolve(chunks.current.length ? new Blob(chunks.current, { type: 'audio/webm' }) : null); return; }
    rec.addEventListener('stop', () => resolve(new Blob(chunks.current, { type: rec.mimeType || 'audio/webm' })), { once: true });
    rec.stop();
    setRecording(false);
  });

  const save = async (writeUp: boolean) => {
    const qa = transcript();
    if (!qa) { toast.error('Answer at least one question first.'); return; }
    stopListening();
    try {
      let story = '';
      if (writeUp) {
        setBusy('Writing the story...');
        const res = await chatApi.sendMessage(
          `Below is an interview with ${personName}. Rewrite it as a warm, first-person life story in ${personName}'s own voice, ` +
          `in the same language the answers were given in. Keep every fact and name exactly as said; do not add anything new. ` +
          `No headings or bullet points.\n\n${qa.slice(0, 6500)}`, { persist: false });
        if (res.provider === 'error') toast.warning(`The story write-up was skipped: ${res.response}`); else story = res.response.trim();
      }
      setBusy('Saving the recording...');
      const audio = await finishRecording();
      const audioPath = audio && audio.size > 0 ? await uploadOwnFile('voice-recordings', `interview-${personName}.webm`, audio, audio.type) : null;
      setBusy('Saving...');
      const { error } = await supabase.from('cultural_stories').insert({
        title: `Interview with ${personName} (${new Date().toLocaleDateString()})`,
        content: story ? `${story}\n\n---\nInterview transcript\n\n${qa}` : qa,
        storyteller: personName,
        family_member_id: personId || null,
        audio_path: audioPath,
        language: lang,
        themes: ['interview', ...topics.map((t) => t.toLowerCase())],
        date_recorded: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success(`Saved! You'll find it in the Story Library${audioPath ? ', with the recording' : ''}.`);
      setStarted(false);
      setAnswers({});
      chunks.current = [];
      recorder.current = null;
    } catch (e) {
      toast.error(`Could not save the interview: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  if (!started) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Mic className="w-6 h-6 text-genesis-600" /> Interview a relative</h2>
          <p className="text-gray-600 mt-1">Sit down with a parent or grandparent. The app reads each question out loud, records their answers, writes them down, and saves it all to your family history.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="text-sm">Who are you interviewing?
            <select value={personId} onChange={(e) => { setPersonId(e.target.value); setPersonName(people.find((p) => p.id === e.target.value)?.name ?? ''); }} className="mt-1 block w-full px-3 py-2 border rounded-lg">
              <option value="">Someone not in my tree yet</option>
              {people.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label className="text-sm">Their name
            <input value={personName} onChange={(e) => setPersonName(e.target.value)} placeholder="e.g. Grandma Rosa" className="mt-1 block w-full px-3 py-2 border rounded-lg" />
          </label>
          <label className="text-sm">Language
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-lg">
              {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </label>
        </div>
        <fieldset>
          <legend className="text-sm font-medium mb-1">Topics</legend>
          <div className="flex flex-wrap gap-3">
            {Object.keys(INTERVIEW_TOPICS).map((t) => (
              <label key={t} className="flex items-center gap-1 text-sm">
                <input type="checkbox" checked={topics.includes(t)} onChange={(e) => setTopics(e.target.checked ? [...topics, t] : topics.filter((x) => x !== t))} /> {t}
              </label>
            ))}
          </div>
        </fieldset>
        {lang !== 'en-CA' && <p className="text-sm text-gray-500">Questions are read in English; answers can be given in any language you choose above.</p>}
        <button onClick={begin} disabled={!topics.length} className="flex items-center gap-2 px-5 py-3 bg-genesis-600 text-white rounded-lg text-lg hover:bg-genesis-700 disabled:opacity-50">
          <Mic className="w-5 h-5" /> Start the interview
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>Question {index + 1} of {questions.length} · {personName}</span>
        {recording && <span className="flex items-center gap-1 text-red-600"><span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" /> Recording</span>}
      </div>
      <p className="text-2xl font-serif leading-snug">{question}</p>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => speak(question)} className="flex items-center gap-1 px-3 py-2 border rounded-lg"><Volume2 className="w-4 h-4" /> Read aloud</button>
        {SpeechRecognition && (listening
          ? <button onClick={stopListening} className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg"><Square className="w-4 h-4" /> Stop writing down</button>
          : <button onClick={startListening} className="flex items-center gap-1 px-3 py-2 bg-genesis-600 text-white rounded-lg"><Mic className="w-4 h-4" /> Write down the answer</button>)}
      </div>
      <textarea rows={6} value={answers[question] ?? ''} onChange={(e) => setAnswers({ ...answers, [question]: e.target.value })}
        placeholder={SpeechRecognition ? 'The answer appears here as they speak. You can also type or fix it.' : 'Type their answer here.'}
        className="w-full px-3 py-2 border rounded-lg" aria-label="Answer" />
      <div className="flex flex-wrap justify-between gap-2">
        <button onClick={() => go(-1)} disabled={index === 0} className="flex items-center gap-1 px-3 py-2 border rounded-lg disabled:opacity-40"><ChevronLeft className="w-4 h-4" /> Back</button>
        {index < questions.length - 1 && <button onClick={() => go(1)} className="flex items-center gap-1 px-4 py-2 bg-gray-900 text-white rounded-lg">{answers[question] ? 'Next question' : 'Skip'} <ChevronRight className="w-4 h-4" /></button>}
      </div>
      <div className="border-t pt-4 flex flex-wrap gap-3">
        <button onClick={() => save(true)} disabled={busy !== null} className="flex items-center gap-2 px-4 py-2 bg-genesis-600 text-white rounded-lg disabled:opacity-50"><Sparkles className="w-4 h-4" /> {busy ?? 'Finish and write it as a story'}</button>
        <button onClick={() => save(false)} disabled={busy !== null} className="flex items-center gap-2 px-4 py-2 border rounded-lg disabled:opacity-50"><Save className="w-4 h-4" /> Finish and save answers only</button>
      </div>
    </div>
  );
};

export default FamilyInterview;
