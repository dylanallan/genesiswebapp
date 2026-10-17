import React, { useState } from 'react';
import { Check, Copy, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSaveGuard } from '../lib/use-save-guard';

interface Joined { position: number; code: string; invited: number; already: boolean }

// The referral code from a shared link (?ref=abc12345), if any.
const refFromUrl = () => {
  try { return new URLSearchParams(window.location.search).get('ref')?.slice(0, 16) ?? ''; } catch { return ''; }
};

/** Pre-launch waitlist: an email (and optional name), then a personal link to share with family. */
export const WaitlistForm: React.FC<{ source?: string }> = ({ source = 'home' }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [joined, setJoined] = useState<Joined | null>(null);
  const [copied, setCopied] = useState(false);
  const guard = useSaveGuard();

  const submit = guard(async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    const { data, error: rpcError } = await supabase.rpc('join_waitlist', { p_email: email, p_name: name || null, p_source: source, p_ref: refFromUrl() || null });
    setBusy(false);
    if (rpcError || !data) { setError('We couldn’t add you just now. Please try again.'); return; }
    if (!data.ok) { setError(data.reason ?? 'Please check your email address.'); return; }
    setJoined({ position: Number(data.position), code: String(data.code), invited: Number(data.invited ?? 0), already: !!data.already });
  });

  if (joined) {
    const link = `${window.location.origin}/?ref=${joined.code}#waitlist`;
    const copy = async () => {
      try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* clipboard blocked: the link is shown to copy by hand */ }
    };
    return (
      <div className="rounded-2xl bg-white border border-black/10 p-6 space-y-4 text-left" role="status" data-testid="waitlist-joined">
        <p className="flex items-center gap-2 text-xl font-semibold text-[#1f3a2e]"><Check className="w-6 h-6" /> {joined.already ? 'You’re already on the list.' : 'You’re on the list!'}</p>
        <p className="text-[#3d4a43]">You’re number <strong>{joined.position.toLocaleString()}</strong>. We’ll email you when Genesis Heritage opens.</p>
        <div className="space-y-2">
          <p className="text-[#3d4a43]">Invite your family with your own link:</p>
          <div className="flex flex-wrap gap-2">
            <input readOnly value={link} aria-label="Your invite link" className="flex-1 min-w-0 px-3 py-2 border rounded-lg bg-[#faf7f0] text-sm" onFocus={(e) => e.target.select()} />
            <button type="button" onClick={copy} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2E5A44] text-white font-semibold">
              <Copy className="w-4 h-4" /> {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
          {joined.invited > 0 && <p className="text-sm text-[#3d4a43]">{joined.invited} {joined.invited === 1 ? 'person has' : 'people have'} joined from your link.</p>}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white border border-black/10 p-6 space-y-3 text-left" data-testid="waitlist-form">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="waitlist-email" className="block text-sm font-medium text-[#1f3a2e] mb-1">Email</label>
          <input id="waitlist-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254}
            className="w-full px-3 py-3 border rounded-lg" placeholder="you@example.com" />
        </div>
        <div>
          <label htmlFor="waitlist-name" className="block text-sm font-medium text-[#1f3a2e] mb-1">First name <span className="font-normal text-[#5c6660]">(optional)</span></label>
          <input id="waitlist-name" autoComplete="given-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80}
            className="w-full px-3 py-3 border rounded-lg" />
        </div>
      </div>
      {error && <p className="text-red-700" role="alert">{error}</p>}
      <button disabled={busy} className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#2E5A44] text-white text-lg font-semibold disabled:opacity-60">
        {busy && <Loader2 className="w-5 h-5 animate-spin" />} Join the waitlist
      </button>
      <p className="text-sm text-[#5c6660]">Just launch news, no spam. We never share or sell your email. Leave any time.</p>
    </form>
  );
};

export default WaitlistForm;
