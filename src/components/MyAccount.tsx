import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle, KeyRound, LogOut, Type, MessageCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { SetNewPassword } from './SetNewPassword';
import { applyTextSize, readTextSize, saveTextSize, TEXT_SIZES, TextSize } from '../lib/text-size';

// Everything here really changes something: the name and password on the account, the text size on this
// device, and the instructions the family history helper follows in every answer.
export const MyAccount: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [savedName, setSavedName] = useState('');
  const [instructions, setInstructions] = useState('');
  const [savedInstructions, setSavedInstructions] = useState('');
  const [textSize, setTextSize] = useState<TextSize>(readTextSize());
  const [changingPassword, setChangingPassword] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false); // fields stay locked until your saved details arrive, so typing is never overwritten

  useEffect(() => {
    let current = true; // a load that was superseded never overwrites the fields
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user || !current) return;
      const { data: row } = await supabase.from('ai_custom_instructions').select('instructions').eq('user_id', user.id).maybeSingle();
      if (!current) return;
      setEmail(user.email ?? '');
      const n = (user.user_metadata?.full_name as string | undefined) ?? '';
      setName(n); setSavedName(n);
      const text = row?.instructions ?? '';
      setInstructions(text); setSavedInstructions(text);
    })().finally(() => { if (current) setLoaded(true); });
    return () => { current = false; };
  }, []);

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('name');
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    setBusy(null);
    if (error) { toast.error('We could not save your name. Please try again.'); return; }
    setSavedName(name.trim());
    toast.success('Name saved');
  };

  const saveInstructions = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('instructions');
    const { data } = await supabase.auth.getUser();
    const { error } = await supabase.from('ai_custom_instructions')
      .upsert({ user_id: data.user?.id, instructions: instructions.trim().slice(0, 1000), is_active: true, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    setBusy(null);
    if (error) { toast.error('We could not save that. Please try again.'); return; }
    setSavedInstructions(instructions.trim());
    toast.success('Saved. The helper will follow this from your next question.');
  };

  const chooseSize = (size: TextSize) => {
    setTextSize(size);
    saveTextSize(size);
    applyTextSize(size);
  };

  const signOutEverywhere = async () => {
    setBusy('signout');
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    setBusy(null);
    if (error) toast.error('We could not sign you out everywhere. Please try again.');
  };

  if (changingPassword) {
    return <SetNewPassword title="Change your password" onDone={() => { setChangingPassword(false); toast.success('Password changed'); }} onCancel={() => setChangingPassword(false)} />;
  }

  const section = 'bg-white rounded-xl border border-gray-200 p-5 space-y-3';
  return (
    <div className="space-y-5" data-testid="my-account">
      <h2 className="text-xl font-semibold flex items-center gap-2"><UserCircle className="w-6 h-6 text-genesis-600" /> My account</h2>

      <form onSubmit={saveName} className={section}>
        <h3 className="font-semibold">Your details</h3>
        <p className="text-sm text-gray-600">Signed in as <strong>{email || '…'}</strong></p>
        <label htmlFor="account-name" className="block text-sm font-medium">Your name</label>
        <div className="flex flex-wrap gap-2">
          <input id="account-name" disabled={!loaded} value={name} onChange={(e) => setName(e.target.value)} placeholder="How should we greet you?" className="flex-1 min-w-0 px-3 py-2 border rounded-lg" maxLength={80} />
          <button disabled={busy === 'name' || name.trim() === savedName} className="px-4 py-2 bg-genesis-600 text-white rounded-lg disabled:opacity-50">Save name</button>
        </div>
      </form>

      <section className={section}>
        <h3 className="font-semibold flex items-center gap-2"><Type className="w-5 h-5 text-genesis-600" /> Text size</h3>
        <p className="text-sm text-gray-600">Make everything easier to read on this device.</p>
        <div role="radiogroup" aria-label="Text size" className="flex flex-wrap gap-2">
          {TEXT_SIZES.map((s) => (
            <button key={s.id} role="radio" aria-checked={textSize === s.id} onClick={() => chooseSize(s.id)}
              className={`px-4 py-2 rounded-lg border ${textSize === s.id ? 'bg-genesis-600 text-white border-genesis-600' : 'bg-white hover:bg-gray-50'}`}
              style={{ fontSize: `${s.px}px` }}>
              {s.label}
            </button>
          ))}
        </div>
      </section>

      <form onSubmit={saveInstructions} className={section}>
        <h3 className="font-semibold flex items-center gap-2"><MessageCircle className="w-5 h-5 text-genesis-600" /> How the helper talks to you</h3>
        <label htmlFor="helper-instructions" className="block text-sm text-gray-600">
          Tell the family history helper anything it should always keep in mind. For example: "Please answer in Spanish", "Keep answers short", or "My family is from County Cork".
        </label>
        <textarea id="helper-instructions" disabled={!loaded} value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={3} maxLength={1000} className="w-full px-3 py-2 border rounded-lg" />
        <button disabled={busy === 'instructions' || instructions.trim() === savedInstructions} className="px-4 py-2 bg-genesis-600 text-white rounded-lg disabled:opacity-50">Save</button>
      </form>

      <section className={section}>
        <h3 className="font-semibold flex items-center gap-2"><KeyRound className="w-5 h-5 text-genesis-600" /> Password and sign-in</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setChangingPassword(true)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Change password</button>
          <button onClick={signOutEverywhere} disabled={busy === 'signout'} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50">
            <LogOut className="w-4 h-4" /> Sign out on all my devices
          </button>
        </div>
        <p className="text-xs text-gray-500">Use "Sign out on all my devices" if you used Genesis on someone else's phone or computer.</p>
      </section>

      <section className={section}>
        <h3 className="font-semibold flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-genesis-600" /> Your data</h3>
        <p className="text-sm text-gray-600">Download everything you have saved, or delete your account.</p>
        <button onClick={() => navigate('/dashboard?feature=privacy-center')} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Open your data &amp; privacy</button>
      </section>
    </div>
  );
};

export default MyAccount;
