import React, { useCallback, useEffect, useState } from 'react';
import { Users, Link2, Copy, Mail, MessageCircle, Eye, BookOpen, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface Invite { id: string; invitee_name: string | null; member_name: string | null; role: 'viewer' | 'contributor'; status: 'pending' | 'active' | 'revoked'; token: string; created_at: string }
interface SharedFamily { owner_id: string; owner_name: string; role: 'viewer' | 'contributor' }
interface SnapshotMember { id: string; first_name: string | null; middle_name: string | null; last_name: string | null; birth_date: string | null; birth_location: string | null; death_date: string | null; death_location: string | null; relationship: string | null; notes: string | null }
interface SnapshotStory { id: string; title: string; content: string; storyteller: string | null; created_at: string }
interface Snapshot { owner_name: string; role: string; members: SnapshotMember[]; stories: SnapshotStory[]; storybooks: Array<{ id: string; title: string; chapters: Array<{ heading: string; body: string }> }> }

export const inviteLink = (token: string) => `${window.location.origin}/join/${token}`;
const fullName = (m: SnapshotMember) => [m.first_name, m.middle_name, m.last_name].filter(Boolean).join(' ') || 'Unknown';
const years = (m: SnapshotMember) => {
  const b = m.birth_date?.slice(0, 4);
  const d = m.death_date?.slice(0, 4);
  return b || d ? `${b ?? '?'} – ${d ?? ''}` : '';
};

const SharedFamilyView: React.FC<{ family: SharedFamily; onBack: () => void }> = ({ family, onBack }) => {
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
    toast.success(`Memory added to ${family.owner_name}'s family`);
    setStory({ title: '', content: '' });
    load();
  };

  if (!snap) return <p className="text-gray-500">Loading {family.owner_name}'s family...</p>;
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-genesis-600 hover:text-genesis-700">← Back</button>
      <h3 className="text-lg font-semibold">{snap.owner_name}'s family</h3>

      <section>
        <h4 className="font-medium mb-2">People ({snap.members.length})</h4>
        {snap.members.length === 0 ? <p className="text-gray-500 text-sm">No one has been added yet.</p> : (
          <ul className="grid sm:grid-cols-2 gap-2">
            {snap.members.slice(0, 500).map((m) => (
              <li key={m.id} className="border rounded-lg p-3">
                <p className="font-medium">{fullName(m)}</p>
                <p className="text-sm text-gray-500">{[years(m), m.birth_location].filter(Boolean).join(' · ')}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {snap.storybooks.length > 0 && (
        <section>
          <h4 className="font-medium mb-2">Storybooks</h4>
          {snap.storybooks.map((b) => (
            <details key={b.id} className="border rounded-lg p-3 mb-2">
              <summary className="cursor-pointer font-medium">{b.title}</summary>
              {b.chapters.map((c, i) => (<div key={i} className="mt-3"><h5 className="font-semibold">{c.heading}</h5><p className="whitespace-pre-line text-gray-700">{c.body}</p></div>))}
            </details>
          ))}
        </section>
      )}

      <section>
        <h4 className="font-medium mb-2">Stories and memories</h4>
        {snap.stories.length === 0 ? <p className="text-gray-500 text-sm">No stories yet.</p> : snap.stories.map((s) => (
          <details key={s.id} className="border rounded-lg p-3 mb-2">
            <summary className="cursor-pointer font-medium">{s.title}{s.storyteller ? ` — told by ${s.storyteller}` : ''}</summary>
            <p className="whitespace-pre-line text-gray-700 mt-2">{s.content}</p>
          </details>
        ))}
      </section>

      {family.role === 'contributor' && (
        <form onSubmit={addStory} className="border rounded-lg p-4 space-y-3 bg-genesis-50">
          <h4 className="font-medium">Add a memory to this family</h4>
          <input required value={story.title} onChange={(e) => setStory({ ...story, title: e.target.value })} placeholder="Title, e.g. Sundays at Grandma's" className="w-full px-3 py-2 border rounded-lg" aria-label="Memory title" />
          <textarea required rows={4} value={story.content} onChange={(e) => setStory({ ...story, content: e.target.value })} placeholder="What do you remember?" className="w-full px-3 py-2 border rounded-lg" aria-label="Memory" />
          <button disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-genesis-600 text-white rounded-lg disabled:opacity-50"><Send className="w-4 h-4" /> {saving ? 'Saving...' : 'Add memory'}</button>
        </form>
      )}
    </div>
  );
};

export const FamilySharing: React.FC = () => {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [shared, setShared] = useState<SharedFamily[]>([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState<'viewer' | 'contributor'>('contributor');
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
    const { data, error } = await supabase.from('family_shares').insert({ invitee_name: name.trim() || null, role }).select('token').single();
    setCreating(false);
    if (error) { toast.error(error.message); return; }
    await navigator.clipboard?.writeText(inviteLink(data.token)).catch(() => undefined);
    toast.success('Invite link created and copied. Send it to your relative.');
    setName('');
    load();
  };

  const setStatus = async (id: string, patch: Partial<Pick<Invite, 'status' | 'role'>>) => {
    const { error } = await supabase.from('family_shares').update(patch).eq('id', id);
    if (error) toast.error(error.message); else load();
  };

  if (viewing) return <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"><SharedFamilyView family={viewing} onBack={() => setViewing(null)} /></div>;

  const message = (token: string) => encodeURIComponent(`I'm building our family history on Genesis Heritage. Join me and add your memories: ${inviteLink(token)}`);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><Users className="w-6 h-6 text-genesis-600" /> Share with family</h2>
        <p className="text-gray-600 mt-1">Invite relatives to see your family tree and stories, and to add their own memories. Joining is free for them.</p>
      </div>

      <form onSubmit={create} className="flex flex-wrap items-end gap-3">
        <label className="text-sm">Who is it for? (optional)
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aunt Rosa" className="mt-1 block px-3 py-2 border rounded-lg" />
        </label>
        <label className="text-sm">They can
          <select value={role} onChange={(e) => setRole(e.target.value as Invite['role'])} className="mt-1 block px-3 py-2 border rounded-lg">
            <option value="contributor">view and add memories</option>
            <option value="viewer">view only</option>
          </select>
        </label>
        <button disabled={creating} className="flex items-center gap-2 px-4 py-2 bg-genesis-600 text-white rounded-lg hover:bg-genesis-700 disabled:opacity-50">
          <Link2 className="w-4 h-4" /> {creating ? 'Creating...' : 'Create invite link'}
        </button>
      </form>

      {invites.length > 0 && (
        <ul className="divide-y border rounded-lg">
          {invites.map((i) => (
            <li key={i.id} className="p-3 flex flex-wrap items-center gap-3 justify-between">
              <div>
                <p className="font-medium">{i.member_name ?? i.invitee_name ?? 'Invite link'}</p>
                <p className="text-sm text-gray-500">
                  {i.status === 'pending' ? 'Not joined yet' : i.status === 'active' ? 'Joined' : 'Access removed'} · {i.role === 'viewer' ? 'can view' : 'can view and add'}
                </p>
              </div>
              {i.status !== 'revoked' && (
                <div className="flex flex-wrap gap-2 text-sm">
                  {i.status === 'pending' && <>
                    <button onClick={() => { navigator.clipboard?.writeText(inviteLink(i.token)); toast.success('Link copied'); }} className="flex items-center gap-1 px-2 py-1 border rounded"><Copy className="w-3 h-3" /> Copy</button>
                    <a href={`mailto:?subject=${encodeURIComponent('Join our family history')}&body=${message(i.token)}`} className="flex items-center gap-1 px-2 py-1 border rounded"><Mail className="w-3 h-3" /> Email</a>
                    <a href={`https://wa.me/?text=${message(i.token)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 px-2 py-1 border rounded"><MessageCircle className="w-3 h-3" /> WhatsApp</a>
                  </>}
                  <button onClick={() => setStatus(i.id, { role: i.role === 'viewer' ? 'contributor' : 'viewer' })} className="px-2 py-1 border rounded">{i.role === 'viewer' ? 'Allow adding' : 'Make view only'}</button>
                  <button onClick={() => setStatus(i.id, { status: 'revoked' })} className="px-2 py-1 border rounded text-red-600">Remove access</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="border-t pt-4">
        <h3 className="font-semibold mb-2">Families shared with me</h3>
        {shared.length === 0 ? <p className="text-sm text-gray-500">When a relative sends you an invite link, their family will appear here.</p> : (
          <ul className="space-y-2">
            {shared.map((f) => (
              <li key={f.owner_id}>
                <button onClick={() => setViewing(f)} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 w-full text-left">
                  {f.role === 'viewer' ? <Eye className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />} {f.owner_name}'s family
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
