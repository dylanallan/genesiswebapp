import React, { useEffect, useState } from 'react';
import { Send, Copy, Check, Lock, Loader2, MessageCircle, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useSaveGuard } from '../lib/use-save-guard';
import { INTERVIEW_TOPICS } from './FamilyInterview';

interface Request { id: string; token: string; relative_name: string; questions: string[]; created_at: string; closed_at: string | null; answered: number }

const MAX_QUESTIONS = 12;
export const memoryLink = (token: string) => `${window.location.origin}/memories/${token}`;

/** "Ask a relative": send a private link; the relative answers on their own phone, no account needed. */
export const AskRelative: React.FC = () => {
  const [relative, setRelative] = useState('');
  const [fromName, setFromName] = useState('');
  const [chosen, setChosen] = useState<string[]>(INTERVIEW_TOPICS['Childhood'].slice(0, 3));
  const [custom, setCustom] = useState('');
  const [requests, setRequests] = useState<Request[]>([]);
  const [busy, setBusy] = useState(false);
  const [justMade, setJustMade] = useState<Request | null>(null);
  const [copied, setCopied] = useState('');
  const guard = useSaveGuard();

  const load = async () => {
    const { data } = await supabase.from('memory_requests').select('id,token,relative_name,questions,created_at,closed_at').order('created_at', { ascending: false }).limit(50);
    const rows = (data ?? []) as Omit<Request, 'answered'>[];
    const ids = rows.map((r) => r.id);
    const { data: answers } = ids.length ? await supabase.from('memory_answers').select('request_id').in('request_id', ids) : { data: [] };
    const count = new Map<string, number>();
    for (const a of (answers ?? []) as { request_id: string }[]) count.set(a.request_id, (count.get(a.request_id) ?? 0) + 1);
    setRequests(rows.map((r) => ({ ...r, answered: count.get(r.id) ?? 0 })));
  };

  useEffect(() => {
    void load();
    supabase.auth.getUser().then(({ data }: { data: { user: { user_metadata?: Record<string, unknown> } | null } }) => {
      const n = (data.user?.user_metadata?.full_name as string | undefined)?.split(' ')[0];
      if (n) setFromName((v) => v || n);
    });
  }, []);

  const toggle = (q: string) => setChosen((c) => (c.includes(q) ? c.filter((x) => x !== q) : c.length < MAX_QUESTIONS ? [...c, q] : c));
  const addCustom = () => {
    const q = custom.trim();
    if (!q || chosen.includes(q) || chosen.length >= MAX_QUESTIONS) return;
    setChosen([...chosen, q.slice(0, 300)]);
    setCustom('');
  };

  const create = guard(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relative.trim() || !fromName.trim() || chosen.length === 0) return;
    setBusy(true);
    const { data, error } = await supabase.from('memory_requests')
      .insert({ relative_name: relative.trim().slice(0, 80), from_name: fromName.trim().slice(0, 80), questions: chosen })
      .select('id,token,relative_name,questions,created_at,closed_at').single();
    setBusy(false);
    if (error || !data) { toast.error('We couldn’t make the link. Please try again.'); return; }
    setJustMade({ ...(data as Omit<Request, 'answered'>), answered: 0 });
    setRelative('');
    void load();
  });

  const copy = async (token: string) => {
    try { await navigator.clipboard.writeText(memoryLink(token)); setCopied(token); setTimeout(() => setCopied(''), 2500); }
    catch { toast.info('Press and hold the link to copy it.'); }
  };
  const close = async (id: string) => {
    if (!window.confirm('Close this link? Your relative won’t be able to add more answers. Answers already given stay in your stories.')) return;
    const { error } = await supabase.from('memory_requests').update({ closed_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error('We couldn’t close the link. Please try again.'); else { toast.success('Link closed'); void load(); }
  };

  const message = (r: Request) => `Hi ${r.relative_name}, I'm saving our family's stories. Could you answer a few questions about your life? No sign-up needed, you can type or just speak: ${memoryLink(r.token)}`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6" data-testid="ask-relative">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><Send className="w-6 h-6 text-genesis-600" /> Ask a relative</h2>
        <p className="text-gray-600 mt-1">Send Grandma, an uncle or a cousin a private link. They answer on their own phone, typing or simply speaking, with no account or password. Each answer is saved to your stories.</p>
      </div>

      {justMade ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 space-y-3" role="status">
          <p className="font-semibold text-green-900 flex items-center gap-2"><Check className="w-5 h-5" /> Your link for {justMade.relative_name} is ready</p>
          <div className="flex flex-wrap gap-2">
            <input readOnly value={memoryLink(justMade.token)} aria-label="Link to send" className="flex-1 min-w-0 px-3 py-2 border rounded-lg bg-white text-sm" onFocus={(e) => e.target.select()} />
            <button onClick={() => copy(justMade.token)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-genesis-600 text-white"><Copy className="w-4 h-4" /> {copied === justMade.token ? 'Copied' : 'Copy'}</button>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <a className="flex items-center gap-1 px-3 py-2 border rounded-lg bg-white" href={`sms:?&body=${encodeURIComponent(message(justMade))}`}><MessageCircle className="w-4 h-4" /> Text message</a>
            <a className="flex items-center gap-1 px-3 py-2 border rounded-lg bg-white" href={`https://wa.me/?text=${encodeURIComponent(message(justMade))}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4" /> WhatsApp</a>
            <a className="flex items-center gap-1 px-3 py-2 border rounded-lg bg-white" href={`mailto:?subject=${encodeURIComponent('A few questions about our family')}&body=${encodeURIComponent(message(justMade))}`}><Mail className="w-4 h-4" /> Email</a>
          </div>
          <p className="text-sm text-green-900">Anyone with this link can add answers, so send it only to {justMade.relative_name}. You can close it at any time.</p>
          <button onClick={() => setJustMade(null)} className="text-sm underline">Ask someone else</button>
        </div>
      ) : (
        <form onSubmit={create} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="ask-relative-name" className="block text-sm font-medium mb-1">Who are you asking?</label>
              <input id="ask-relative-name" required value={relative} onChange={(e) => setRelative(e.target.value)} maxLength={80} placeholder="e.g. Grandma Rosa" className="w-full px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label htmlFor="ask-from-name" className="block text-sm font-medium mb-1">Your name, as they know you</label>
              <input id="ask-from-name" required value={fromName} onChange={(e) => setFromName(e.target.value)} maxLength={80} placeholder="e.g. Dylan" className="w-full px-3 py-2 border rounded-lg" />
            </div>
          </div>
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Questions ({chosen.length} of up to {MAX_QUESTIONS})</legend>
            {Object.entries(INTERVIEW_TOPICS).map(([topic, qs]) => (
              <div key={topic}>
                <p className="text-sm font-semibold text-gray-700 mb-1">{topic}</p>
                <div className="space-y-1">
                  {qs.map((q) => (
                    <label key={q} className="flex items-start gap-2 text-sm">
                      <input type="checkbox" checked={chosen.includes(q)} onChange={() => toggle(q)} disabled={!chosen.includes(q) && chosen.length >= MAX_QUESTIONS} className="mt-1" />
                      <span>{q}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {chosen.filter((q) => !Object.values(INTERVIEW_TOPICS).flat().includes(q)).map((q) => (
              <label key={q} className="flex items-start gap-2 text-sm"><input type="checkbox" checked onChange={() => toggle(q)} className="mt-1" /><span>{q}</span></label>
            ))}
            <div className="flex flex-wrap gap-2">
              <label htmlFor="ask-custom" className="sr-only">Your own question</label>
              <input id="ask-custom" value={custom} onChange={(e) => setCustom(e.target.value)} maxLength={300} placeholder="Add your own question" className="flex-1 min-w-0 px-3 py-2 border rounded-lg"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }} />
              <button type="button" onClick={addCustom} disabled={!custom.trim() || chosen.length >= MAX_QUESTIONS} className="px-3 py-2 border rounded-lg disabled:opacity-50">Add</button>
            </div>
          </fieldset>
          <button disabled={busy || !relative.trim() || !fromName.trim() || chosen.length === 0} className="flex items-center gap-2 px-5 py-2 bg-genesis-600 text-white rounded-lg disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Make the link
          </button>
        </form>
      )}

      {requests.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Links you’ve sent</h3>
          <ul className="divide-y border rounded-lg">
            {requests.map((r) => (
              <li key={r.id} className="p-3 flex flex-wrap items-center gap-3 justify-between">
                <div>
                  <p className="font-medium">{r.relative_name}</p>
                  <p className="text-sm text-gray-600">{r.answered} of {r.questions.length} answered{r.closed_at ? ' · closed' : ''} · answers appear in your Story library</p>
                </div>
                {!r.closed_at && (
                  <div className="flex gap-2">
                    <button onClick={() => copy(r.token)} className="flex items-center gap-1 px-3 py-1 border rounded-lg text-sm"><Copy className="w-4 h-4" /> {copied === r.token ? 'Copied' : 'Copy link'}</button>
                    <button onClick={() => close(r.id)} className="flex items-center gap-1 px-3 py-1 border rounded-lg text-sm"><Lock className="w-4 h-4" /> Close</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AskRelative;
