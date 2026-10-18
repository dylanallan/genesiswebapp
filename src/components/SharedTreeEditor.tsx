import React, { useState } from 'react';
import { Pencil, UserPlus, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { t, useLang } from '../lib/i18n';

// For relatives the owner made editors: fix someone's facts, or add a missing parent, child or spouse.
// Everything goes through shared_save_member, which checks the editor role on the server. Nobody can be deleted here.

export interface EditableMember {
  id: string; first_name: string | null; middle_name: string | null; last_name: string | null;
  birth_date: string | null; birth_location: string | null; death_date: string | null; death_location: string | null;
}

type Fields = { first_name: string; last_name: string; birth_date: string; birth_location: string; death_date: string; death_location: string };
const blank: Fields = { first_name: '', last_name: '', birth_date: '', birth_location: '', death_date: '', death_location: '' };
const fromMember = (m: EditableMember): Fields => ({
  first_name: m.first_name ?? '', last_name: m.last_name ?? '', birth_date: m.birth_date ?? '', birth_location: m.birth_location ?? '',
  death_date: m.death_date ?? '', death_location: m.death_location ?? '',
});

async function save(owner: string, person: Record<string, string>, relativeOf?: string, relation?: string): Promise<boolean> {
  const { error } = await supabase.rpc('shared_save_member', { p_owner: owner, p_person: person, p_relative_of: relativeOf ?? null, p_relation: relation ?? null });
  if (error) { toast.error(t(error.message)); return false; }
  return true;
}

const PersonFields: React.FC<{ value: Fields; onChange: (f: Fields) => void }> = ({ value, onChange }) => {
  const field = (k: keyof Fields, label: string, type = 'text') => (
    <label className="text-sm">{t(label)}
      <input type={type} value={value[k]} onChange={(e) => onChange({ ...value, [k]: e.target.value })} className="mt-1 block w-full px-3 py-2 min-h-[44px] border rounded-lg" />
    </label>
  );
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {field('first_name', 'First name')}{field('last_name', 'Last name')}
      {field('birth_date', 'Birth date', 'date')}{field('birth_location', 'Birthplace')}
      {field('death_date', 'Death date', 'date')}{field('death_location', 'Place of death')}
    </div>
  );
};

export const EditPersonButton: React.FC<{ owner: string; member: EditableMember; onSaved: () => void }> = ({ owner, member, onSaved }) => {
  useLang();
  const [form, setForm] = useState<Fields | null>(null);
  const [busy, setBusy] = useState(false);
  if (!form) {
    return (
      <button onClick={() => setForm(fromMember(member))} className="mt-2 flex items-center gap-1 text-sm px-3 py-2 min-h-[44px] border rounded-lg">
        <Pencil className="w-4 h-4" aria-hidden /> {t('Edit')}
      </button>
    );
  }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const ok = await save(owner, { id: member.id, ...form });
    setBusy(false);
    if (ok) { toast.success(t('Saved.')); setForm(null); onSaved(); }
  };
  return (
    <form onSubmit={submit} className="mt-2 space-y-2" aria-label={t('Edit {name}', { name: [member.first_name, member.last_name].filter(Boolean).join(' ') })}>
      <PersonFields value={form} onChange={setForm} />
      <div className="flex gap-2">
        <button disabled={busy} className="flex items-center gap-1 px-4 py-2 min-h-[44px] bg-genesis-600 text-white rounded-lg disabled:opacity-50"><Save className="w-4 h-4" aria-hidden /> {busy ? t('Saving…') : t('Save')}</button>
        <button type="button" onClick={() => setForm(null)} className="flex items-center gap-1 px-4 py-2 min-h-[44px] border rounded-lg"><X className="w-4 h-4" aria-hidden /> {t('Cancel')}</button>
      </div>
    </form>
  );
};

export const AddRelativeForm: React.FC<{ owner: string; members: EditableMember[]; onSaved: () => void }> = ({ owner, members, onSaved }) => {
  useLang();
  const [relation, setRelation] = useState('parent');
  const [of, setOf] = useState('');
  const [form, setForm] = useState<Fields>(blank);
  const [busy, setBusy] = useState(false);
  if (members.length === 0) return null;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!of) { toast.error(t('Choose who this person is related to')); return; }
    if (!form.first_name.trim() || !form.last_name.trim()) { toast.error(t('A first and last name are required')); return; }
    setBusy(true);
    const ok = await save(owner, form, of, relation);
    setBusy(false);
    if (ok) { toast.success(t('{name} was added to the tree.', { name: `${form.first_name} ${form.last_name}`.trim() })); setForm(blank); onSaved(); }
  };
  return (
    <form onSubmit={submit} className="border rounded-lg p-4 space-y-3 bg-genesis-50">
      <h4 className="font-medium flex items-center gap-2"><UserPlus className="w-5 h-5 text-genesis-600" aria-hidden /> {t('Add a missing relative')}</h4>
      <div className="grid sm:grid-cols-2 gap-2">
        <label className="text-sm">{t('This person is the')}
          <select value={relation} onChange={(e) => setRelation(e.target.value)} className="mt-1 block w-full px-3 py-2 min-h-[44px] border rounded-lg bg-white">
            <option value="parent">{t('parent of')}</option>
            <option value="child">{t('child of')}</option>
            <option value="spouse">{t('spouse or partner of')}</option>
          </select>
        </label>
        <label className="text-sm">{t('Person in the tree')}
          <select value={of} onChange={(e) => setOf(e.target.value)} className="mt-1 block w-full px-3 py-2 min-h-[44px] border rounded-lg bg-white">
            <option value="">{t('Choose a person…')}</option>
            {members.map((m) => <option key={m.id} value={m.id}>{[m.first_name, m.last_name].filter(Boolean).join(' ') || t('Unknown')}</option>)}
          </select>
        </label>
      </div>
      <PersonFields value={form} onChange={setForm} />
      <button disabled={busy} className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-genesis-600 text-white rounded-lg disabled:opacity-50"><UserPlus className="w-4 h-4" aria-hidden /> {busy ? t('Saving…') : t('Add to the tree')}</button>
    </form>
  );
};
