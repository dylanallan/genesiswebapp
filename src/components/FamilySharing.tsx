import React, { useCallback, useEffect, useState } from 'react';
import { Users, Link2, Copy, Mail, MessageCircle, Eye, BookOpen, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { t, useLang } from '../lib/i18n';
import ListenButton from './ListenButton';
import { AddRelativeForm, EditPersonButton } from './SharedTreeEditor';

type Role = 'viewer' | 'contributor' | 'editor';
const ROLE_LABEL: Record<Role, string> = { viewer: 'can view', contributor: 'can view and add', editor: 'can view, add and edit the tree' };

interface Invite { id: string; invitee_name: string | null; member_name: string | null; role: Role; status: 'pending' | 'active' | 'revoked'; token: string; created_at: string }
interface SharedFamily { owner_id: string; owner_name: string; role: Role }
interface SnapshotMember { id: string; first_name: string | null; middle_name: string | null; last_name: string | null; birth_date: string | null; birth_location: string | null; death_date: string | null; death_location: string | null; relationship: string | null; notes: string | null; is_living?: boolean }
interface SnapshotStory { id: string; title: string; content: string; storyteller: string | null; created_at: string }
interface Snapshot { owner_name: string; role: string; members: SnapshotMember[]; stories: SnapshotStory[]; storybooks: Array<{ id: string; title: string; chapters: Array<{ heading: string; body: string }> }> }

export const inviteLink = (token: string) => `${window.location.origin}/join/${token}`;
const fullName = (m: SnapshotMember) => [m.first_name, m.middle_name, m.last_name].filter(Boolean).join(' ') || t('Unknown');
const years = (m: SnapshotMember) => {
  const b = m.birth_date?.slice(0, 4);
  const d = m.death_date?.slice(0, 4);
  return b || d ? `${b ?? '?'} – ${d ?? ''}` : '';
};

const SharedFamilyView: React.FC<{ family: SharedFamily; onBack: () => void }> = ({ family, onBack }) => {
  useLang();
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [story, setStory] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase.rpc('shared_family_snapshot', { p_owner: family.owner_id });
    if (error) { toast.error(error.message); return; }
    setSnap(data as Snapshot);
  }, [family.owner_id]);
  useEffect(() => { load(); }, [load]);

  const addStory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.rpc('add_shared_story', { p_owner: family.owner_id, p_title: story.title, p_content: story.content });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("Memory added to {name}'s family", { name: family.owner_name }));
    setStory({ title: '', content: '' });
    load();
  };

  if (!snap) return <p className="text-gray-500">{t("Loading {name}'s family…", { name: family.owner_name })}</p>;
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-genesis-600 hover:text-genesis-700">← {t('Back')}</button>
      <h3 className="text-lg font-semibold">{t("{name}'s family", { name: snap.owner_name })}</h3>

      <section>
        <h4 className="font-medium mb-2">{t('People ({n})', { n: snap.members.length })}</h4>
        {snap.members.length === 0 ? <p className="text-gray-500 text-sm">{t('No one has been added yet.')}</p> : (
          <ul className="grid sm:grid-cols-2 gap-2">
            {snap.members.slice(0, 500).map((m) => (
              <li key={m.id} className="border rounded-lg p-3">
                <p className="font-medium">{fullName(m)}</p>
                <p className="text-sm text-gray-500">{snap.role !== 'editor' && m.is_living ? t('Living') : [years(m), m.birth_location].filter(Boolean).join(' · ')}</p>
                {snap.role === 'editor' && <EditPersonButton owner={family.owner_id} member={m} onSaved={load} />}
              </li>
            ))}
          </ul>
        )}
      </section>

      {snap.storybooks.length > 0 && (
        <section>
          <h4 className="font-medium mb-2">{t('Storybooks')}</h4>
          {snap.storybooks.map((b) => (
            <details key={b.id} className="border rounded-lg p-3 mb-2">
              <summary className="cursor-pointer font-medium">{b.title}</summary>
              <div className="mt-3"><ListenButton label={t('Listen to the whole book')} title={b.title} text={b.chapters.map((c) => `${t(c.heading)}.\n\n${c.body}`).join('\n\n')} /></div>
              {b.chapters.map((c, i) => (<div key={i} className="mt-3"><h5 className="font-semibold">{t(c.heading)}</h5><p className="whitespace-pre-line text-gray-700">{c.body}</p></div>))}
            </details>
          ))}
        </section>
      )}

      <section>
        <h4 className="font-medium mb-2">{t('Stories and memories')}</h4>
        {snap.stories.length === 0 ? <p className="text-gray-500 text-sm">{t('No stories yet.')}</p> : snap.stories.map((s) => (
          <details key={s.id} className="border rounded-lg p-3 mb-2">
            <summary className="cursor-pointer font-medium">{s.title}{s.storyteller ? ` — ${t('told by {name}', { name: s.storyteller })}` : ''}</summary>
            <p className="whitespace-pre-line text-gray-700 mt-2">{s.content}</p>
            <div className="mt-2"><ListenButton title={s.title} text={s.content} /></div>
          </details>
        ))}
      </section>

      {snap.role === 'editor' && <AddRelativeForm owner={family.owner_id} members={snap.members} onSaved={load} />}

      {(snap.role === 'contributor' || snap.role === 'editor') && (
        <form onSubmit={addStory} className="border rounded-lg p-4 space-y-3 bg-genesis-50">
          <h4 className="font-medium">{t('Add a memory to this family')}</h4>
          <input required value={story.title} onChange={(e) => setStory({ ...story, title: e.target.value })} placeholder={t('Title, e.g. Sundays at Grandma’s')} className="w-full px-3 py-2 border rounded-lg" aria-label={t('Memory title')} />
          <textarea required rows={4} value={story.content} onChange={(e) => setStory({ ...story, content: e.target.value })} placeholder={t('What do you remember?')} className="w-full px-3 py-2 border rounded-lg" aria-label={t('Memory')} />
          <button disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-genesis-600 text-white rounded-lg disabled:opacity-50"><Send className="w-4 h-4" /> {saving ? t('Saving…') : t('Add memory')}</button>
        </form>
      )}
    </div>
  );
};

export const FamilySharing: React.FC = () => {
  useLang();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [shared, setShared] = useState<SharedFamily[]>([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('contributor');
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<SharedFamily | null>(null);

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([supabase.rpc('my_family_members_shared'), supabase.rpc('my_shared_families')]);
    if (a.error) toast.error(a.error.message); else setInvites((a.data ?? []) as Invite[]);
    if (!b.error) setShared((b.data ?? []) as SharedFamily[]);
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const { data, error } = await supabase.from('family_shares').insert({ invitee_name: name.trim() || null, ...asShare(role) }).select('token').single();
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    await navigator.clipboard?.writeText(inviteLink(data.token)).catch(() => undefined);
    toast.success(t('Invite link created and copied. Send it to your relative.'));
    setName('');
    load();
  };

  // An editor is stored as a contributor who can also edit.
  const asShare = (r: Role) => ({ role: r === 'editor' ? 'contributor' : r, can_edit: r === 'editor' });
  const setStatus = async (id: string, patch: { status?: Invite['status']; role?: string; can_edit?: boolean }) => {
    const { error } = await supabase.from('family_shares').update(patch).eq('id', id);
    if (error) toast.error(error.message); else load();
  };

  if (viewing) return <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"><SharedFamilyView family={viewing} onBack={() => setViewing(null)} /></div>;

  const message = (token: string) => encodeURIComponent(t('I’m building our family history on Genesis Heritage. Join me and add your memories: {link}', { link: inviteLink(token) }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><Users className="w-6 h-6 text-genesis-600" /> {t('Share with family')}</h2>
        <p className="text-gray-600 mt-1">{t('Invite relatives to see your family tree and stories, and to add their own memories. Joining is free for them.')}</p>
      </div>

      <form onSubmit={create} className="flex flex-wrap items-end gap-3">
        <label className="text-sm">{t('Who is it for? (optional)')}
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('e.g. Aunt Rosa')} className="mt-1 block px-3 py-2 min-h-[44px] border rounded-lg" />
        </label>
        <label className="text-sm">{t('They can')}
          <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="mt-1 block px-3 py-2 min-h-[44px] border rounded-lg">
            <option value="contributor">{t('view and add memories')}</option>
            <option value="viewer">{t('view only')}</option>
            <option value="editor">{t('view, add memories and edit the tree')}</option>
          </select>
        </label>
        <button disabled={creating} className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-genesis-600 text-white rounded-lg hover:bg-genesis-700 disabled:opacity-50">
          <Link2 className="w-4 h-4" /> {creating ? t('Creating…') : t('Create invite link')}
        </button>
      </form>

      {invites.length > 0 && (
        <ul className="divide-y border rounded-lg">
          {invites.map((i) => (
            <li key={i.id} className="p-3 flex flex-wrap items-center gap-3 justify-between">
              <div>
                <p className="font-medium">{i.member_name ?? i.invitee_name ?? t('Invite link')}</p>
                <p className="text-sm text-gray-500">
                  {t(i.status === 'pending' ? 'Not joined yet' : i.status === 'active' ? 'Joined' : 'Access removed')} · {t(ROLE_LABEL[i.role] ?? 'can view')}
                </p>
              </div>
              {i.status !== 'revoked' && (
                <div className="flex flex-wrap gap-2 text-sm">
                  {i.status === 'pending' && <>
                    <button onClick={() => { navigator.clipboard?.writeText(inviteLink(i.token)); toast.success(t('Link copied')); }} className="flex items-center gap-1 px-3 py-2 min-h-[44px] border rounded-lg"><Copy className="w-3 h-3" /> {t('Copy')}</button>
                    <a href={`mailto:?subject=${encodeURIComponent(t('Join our family history'))}&body=${message(i.token)}`} className="flex items-center gap-1 px-3 py-2 min-h-[44px] border rounded-lg"><Mail className="w-3 h-3" /> {t('Email')}</a>
                    <a href={`https://wa.me/?text=${message(i.token)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-3 py-2 min-h-[44px] border rounded-lg"><MessageCircle className="w-3 h-3" /> WhatsApp</a>
                  </>}
                  <label className="sr-only" htmlFor={`role-${i.id}`}>{t('What {name} can do', { name: i.member_name ?? i.invitee_name ?? t('Invite link') })}</label>
                  <select id={`role-${i.id}`} value={i.role} onChange={(e) => setStatus(i.id, asShare(e.target.value as Role))} className="px-3 py-2 min-h-[44px] border rounded-lg bg-white">
                    <option value="viewer">{t('View only')}</option>
                    <option value="contributor">{t('View and add memories')}</option>
                    <option value="editor">{t('View, add and edit the tree')}</option>
                  </select>
                  <button onClick={() => setStatus(i.id, { status: 'revoked' })} className="px-3 py-2 min-h-[44px] border rounded-lg text-red-600">{t('Remove access')}</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="border-t pt-4">
        <h3 className="font-semibold mb-2">{t('Families shared with me')}</h3>
        {shared.length === 0 ? <p className="text-sm text-gray-500">{t('When a relative sends you an invite link, their family will appear here.')}</p> : (
          <ul className="space-y-2">
            {shared.map((f) => (
              <li key={f.owner_id}>
                <button onClick={() => setViewing(f)} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 w-full text-left">
                  {f.role === 'viewer' ? <Eye className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />} {t("{name}'s family", { name: f.owner_name })}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FamilySharing;
