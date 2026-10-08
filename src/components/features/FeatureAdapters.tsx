// Adapters that give dashboard features the data and open/close wiring they need.
// Each one loads real data for the signed-in user; nothing here is placeholder content.
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { FamilyTreeVisualizer } from '../FamilyTreeVisualizer';
import { EnterpriseROICalculator } from '../EnterpriseROICalculator';
import EnterpriseMetricsPanel from '../EnterpriseMetricsPanel';
import { VideoPlayer } from '../VideoPlayer';
import { AudioPlayer } from '../AudioPlayer';
import { MediaPlayer } from '../MediaPlayer';
import { ConversationSummarizer } from '../ConversationSummarizer';

// ---------- Family tree ----------
type TreeMember = Parameters<typeof FamilyTreeVisualizer>[0]['familyMembers'][number];

const fromRow = (r: any): TreeMember => ({
  id: r.id,
  name: [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' '),
  relationship: r.relationship ?? '',
  birthDate: r.birth_date ?? undefined,
  birthPlace: r.birth_location ?? undefined,
  deathDate: r.death_date ?? undefined,
  deathPlace: r.death_location ?? undefined,
  notes: r.notes ?? undefined,
  confidence: (r.confidence ?? 100) / 100, // stored 0-100, shown 0-1
  source: r.source ?? 'user',
  parentIds: r.parent_ids ?? [],
  spouseIds: r.spouse_ids ?? [],
  childrenIds: r.children_ids ?? [],
});

const toRow = (m: TreeMember) => {
  const parts = m.name.trim().split(/\s+/);
  const first = parts.shift() ?? m.name;
  return {
    first_name: first,
    last_name: parts.length ? parts.pop() : null,
    middle_name: parts.length ? parts.join(' ') : null,
    relationship: m.relationship || null,
    birth_date: m.birthDate || null,
    birth_location: m.birthPlace || null,
    death_date: m.deathDate || null,
    death_location: m.deathPlace || null,
    is_living: !m.deathDate,
    notes: m.notes || null,
    source: m.source ?? 'user',
    confidence: Math.round((m.confidence ?? 1) * 100),
    parent_ids: m.parentIds ?? [],
    spouse_ids: m.spouseIds ?? [],
    children_ids: m.childrenIds ?? [],
  };
};

export function FamilyTreeFeature() {
  const [members, setMembers] = useState<TreeMember[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('family_members').select('*').order('birth_date', { ascending: true, nullsFirst: false });
    if (error) toast.error('Could not load your family tree.');
    setMembers((data ?? []).map(fromRow));
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const run = async (op: PromiseLike<{ error: unknown }>, ok: string) => {
    const { error } = await op;
    if (error) return toast.error('That change could not be saved. Please try again.');
    toast.success(ok);
    void load();
  };

  if (loading) return <p className="p-6 text-gray-600">Loading your family tree…</p>;
  const pending = members.filter((m) => m.source === 'ai');
  return (
    <FamilyTreeVisualizer
      familyMembers={members.filter((m) => m.source !== 'ai')}
      pendingMembers={pending}
      onAddMember={(m) => run(supabase.from('family_members').insert(toRow(m)), 'Family member added')}
      onUpdateMember={(m) => run(supabase.from('family_members').update(toRow(m)).eq('id', m.id), 'Saved')}
      onDeleteMember={(id) => run(supabase.from('family_members').delete().eq('id', id), 'Removed')}
      onValidateMember={(m) => run(supabase.from('family_members').update({ source: 'validated' }).eq('id', m.id), 'Confirmed')}
      onRejectMember={(id) => run(supabase.from('family_members').delete().eq('id', id), 'Suggestion dismissed')}
    />
  );
}

// ---------- ROI calculator ----------
export function ROICalculatorFeature() {
  const [v, setV] = useState({ employeeCount: 10, averageSalary: 60000, hoursSavedPerWeek: 5, increasedRevenue: 0 });
  const field = (key: keyof typeof v, label: string, step = 1) => (
    <label className="text-sm">
      <span className="block text-gray-700 mb-1">{label}</span>
      <input type="number" min={0} step={step} className="w-full border rounded px-2 py-1" value={v[key]}
        onChange={(e) => setV({ ...v, [key]: Math.max(0, Number(e.target.value) || 0) })} />
    </label>
  );
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4 rounded-xl border bg-white p-4">
        {field('employeeCount', 'Employees')}
        {field('averageSalary', 'Average salary ($/yr)', 1000)}
        {field('hoursSavedPerWeek', 'Hours saved / person / week', 0.5)}
        {field('increasedRevenue', 'Extra revenue ($/yr)', 1000)}
      </div>
      <EnterpriseROICalculator {...v} />
    </div>
  );
}

// ---------- Account metrics (real counts for this user) ----------
export function MetricsFeature() {
  const [metrics, setMetrics] = useState<Parameters<typeof EnterpriseMetricsPanel>[0]['metrics'] | null>(null);
  useEffect(() => {
    (async () => {
      let ok = 0;
      const count = async (table: string) => {
        const { count: n, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (!error) ok += 1;
        return error ? 0 : n ?? 0;
      };
      const started = performance.now();
      const [family, saved, artifacts, workflows] = await Promise.all([
        count('family_members'), count('saved_records'), count('cultural_artifacts'), count('workflows'),
      ]);
      const responseTime = Math.round(performance.now() - started);
      const today = new Date().toISOString().slice(0, 10);
      const { data: usage } = await supabase.from('ai_usage_daily').select('count').eq('day', today).maybeSingle();
      setMetrics({
        totalUsers: family, businessProcesses: saved, culturalArtifacts: artifacts, activeAutomations: workflows,
        aiRequests: usage?.count ?? 0, systemHealth: Math.round((ok / 4) * 100), responseTime,
      });
    })();
  }, []);
  if (!metrics) return <p className="p-6 text-gray-600">Loading your activity…</p>;
  return <EnterpriseMetricsPanel metrics={metrics} />;
}

// ---------- Media players: play a file from your device or a link ----------
function useMediaSource() {
  const [src, setSrc] = useState('');
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<'audio' | 'video'>('video');
  useEffect(() => () => { if (src.startsWith('blob:')) URL.revokeObjectURL(src); }, [src]);
  const picker = (accept: string) => (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4">
      <label className="text-sm">
        <span className="mr-2 text-gray-700">Choose a file</span>
        <input type="file" accept={accept} onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setKind(f.type.startsWith('audio') ? 'audio' : 'video');
          setTitle(f.name);
          setSrc(URL.createObjectURL(f));
        }} />
      </label>
      <span className="text-gray-400 text-sm">or</span>
      <input aria-label="Media link" className="flex-1 min-w-[200px] border rounded px-2 py-1 text-sm" placeholder="Paste a https:// link to an audio or video file"
        onKeyDown={(e) => {
          if (e.key !== 'Enter') return;
          const url = (e.target as HTMLInputElement).value.trim();
          if (!/^https:\/\//.test(url)) return toast.error('Please paste a link starting with https://');
          setKind(/\.(mp3|wav|m4a|ogg|aac)(\?|$)/i.test(url) ? 'audio' : 'video');
          setTitle(url.split('/').pop() ?? 'Media');
          setSrc(url);
        }} />
    </div>
  );
  return { src, title, kind, picker };
}

export function VideoFeature() {
  const { src, title, picker } = useMediaSource();
  return <div>{picker('video/*')}{src ? <VideoPlayer src={src} title={title} /> : <p className="text-gray-600">Pick a family video to watch it here.</p>}</div>;
}
export function AudioFeature() {
  const { src, title, picker } = useMediaSource();
  return <div>{picker('audio/*')}{src ? <AudioPlayer src={src} title={title} /> : <p className="text-gray-600">Pick a recording to listen to it here.</p>}</div>;
}
export function MediaFeature() {
  const { src, title, kind, picker } = useMediaSource();
  return <div>{picker('audio/*,video/*')}{src ? <MediaPlayer src={src} type={kind} title={title} /> : <p className="text-gray-600">Pick an audio or video file to play it here.</p>}</div>;
}

// ---------- Conversation summarizer: pick one of your saved chats ----------
export function SummarizerFeature({ onClose }: { onClose: () => void }) {
  const [conversations, setConversations] = useState<Array<{ id: string; title: string }>>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: string; content: string; timestamp?: Date }>>([]);

  useEffect(() => {
    supabase.from('conversations').select('id,title').order('updated_at', { ascending: false }).limit(50)
      .then(({ data }: { data: Array<{ id: string; title: string }> | null }) => setConversations(data ?? []));
  }, []);
  useEffect(() => {
    if (!selected) return;
    supabase.from('messages').select('role,content,created_at').eq('conversation_id', selected).order('created_at')
      .then(({ data }: { data: Array<{ role: string; content: string; created_at: string }> | null }) =>
        setMessages((data ?? []).map((m) => ({ role: m.role, content: m.content, timestamp: new Date(m.created_at) }))));
  }, [selected]);

  if (selected && messages.length) {
    return <ConversationSummarizer isOpen onClose={() => { setSelected(null); setMessages([]); }} sessionId={selected} messages={messages} />;
  }
  return (
    <div className="rounded-xl border bg-white p-6">
      <h2 className="text-lg font-semibold mb-3">Summarize a conversation</h2>
      {conversations.length === 0 ? (
        <p className="text-gray-600">You have no saved conversations yet. Chat with the AI Assistant first, then come back to summarize it.</p>
      ) : (
        <ul className="divide-y">
          {conversations.map((c) => (
            <li key={c.id}><button className="w-full text-left py-2 hover:text-blue-700" onClick={() => setSelected(c.id)}>{c.title || 'Untitled conversation'}</button></li>
          ))}
        </ul>
      )}
      <button className="mt-4 text-sm text-gray-600 underline" onClick={onClose}>Back</button>
    </div>
  );
}
