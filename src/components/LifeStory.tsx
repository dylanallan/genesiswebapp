import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BookHeart, Sparkles, Globe2, Users, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { loadAllFamilyRows } from '../lib/family';
import { chatApi } from '../api/chat';
import { t, useLang } from '../lib/i18n';
import { LifePerson, lifeStoryRequest, lifeTimeline } from '../lib/life-story';

interface Row {
  id: string; first_name: string | null; middle_name: string | null; last_name: string | null; gender: string | null;
  birth_date: string | null; death_date: string | null; birth_location: string | null; death_location: string | null;
  parent_ids: string[] | null; spouse_ids: string[] | null; children_ids: string[] | null;
}
interface Story { id: string; title: string; content: string; storyteller: string | null }

const toPerson = (r: Row): LifePerson => ({
  id: r.id, name: [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ') || t('Unknown'), gender: r.gender,
  birthDate: r.birth_date, deathDate: r.death_date, birthPlace: r.birth_location, deathPlace: r.death_location,
  parentIds: r.parent_ids ?? [], spouseIds: r.spouse_ids ?? [], childrenIds: r.children_ids ?? [],
});

export const LifeStory: React.FC = () => {
  useLang();
  const [searchParams, setSearchParams] = useSearchParams();
  const [people, setPeople] = useState<LifePerson[]>([]);
  const [personId, setPersonId] = useState<string | null>(searchParams.get('person'));
  const [stories, setStories] = useState<Story[]>([]);
  const [filter, setFilter] = useState('');
  const [story, setStory] = useState('');
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const linked = searchParams.get('person');
  useEffect(() => {
    if (!linked) return;
    setPersonId(linked);
    setSearchParams({}, { replace: true }); // use the link once, so clicking it again later still works
  }, [linked, setSearchParams]);

  useEffect(() => {
    loadAllFamilyRows<Row>('id,first_name,middle_name,last_name,gender,birth_date,death_date,birth_location,death_location,parent_ids,spouse_ids,children_ids')
      .then((rows) => setPeople(rows.map(toPerson)))
      .catch(() => toast.error(t('Could not load your family tree.')));
  }, []);

  useEffect(() => { setStory(''); }, [personId]);
  useEffect(() => {
    setStories([]);
    if (!personId) return;
    supabase.from('cultural_stories').select('id,title,content,storyteller').eq('family_member_id', personId).order('created_at', { ascending: false })
      .then(({ data }: { data: Story[] | null }) => setStories(data ?? []));
  }, [personId, reload]);

  const person = people.find((p) => p.id === personId) ?? null;
  const events = useMemo(() => (person ? lifeTimeline(person.id, people) : []), [person, people]);
  const byId = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  const write = async () => {
    if (!person) return;
    setBusy(true);
    const res = await chatApi.sendMessage(lifeStoryRequest(person, events, stories.map((s) => `${s.title}: ${s.content}`)), { persist: false });
    setBusy(false);
    if (res.provider === 'error') toast.error(res.response); else setStory(res.response.trim());
  };

  const save = async () => {
    if (!person || !story) return;
    const { error } = await supabase.from('cultural_stories').insert({
      title: t('The life of {name}', { name: person.name }), content: story, storyteller: t('Written with AI from family records'), family_member_id: person.id, themes: ['life story'],
    });
    if (error) { toast.error(error.message); return; }
    toast.success(t('Saved to the Story Library and to their page'));
    setReload((n) => n + 1);
  };

  if (!person) {
    const f = filter.trim().toLowerCase();
    const shown = (f ? people.filter((p) => p.name.toLowerCase().includes(f)) : people).slice(0, 200);
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2"><BookHeart className="w-6 h-6 text-genesis-600" /> {t('Life stories')}</h2>
        <p className="text-gray-600">{t('Choose someone to see their life as a timeline, with the world events they lived through and every memory saved about them.')}</p>
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t('Find a person')} aria-label={t('Find a person')} className="w-full px-3 py-2 border rounded-lg" />
        {people.length === 0 ? <p className="text-sm text-gray-500">{t('Add people to your family tree first.')}</p> : (
          <ul className="max-h-96 overflow-y-auto divide-y border rounded-lg">
            {shown.map((p) => (
              <li key={p.id}><button onClick={() => setPersonId(p.id)} className="w-full text-left px-3 py-2 hover:bg-gray-50">{p.name} <span className="text-sm text-gray-500">{p.birthDate?.slice(0, 4) ?? ''}</span></button></li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const years = [person.birthDate?.slice(0, 4), person.deathDate?.slice(0, 4)];
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
      <button onClick={() => setPersonId(null)} className="text-sm text-genesis-700 hover:underline">← {t('Choose someone else')}</button>
      <div>
        <h2 className="text-2xl font-semibold font-serif">{person.name}</h2>
        <p className="text-gray-600">{years[0] || years[1] ? `${years[0] ?? '?'} – ${years[1] ?? ''}` : t('Dates not known yet')}{person.birthPlace ? ` · ${t('born in {place}', { place: person.birthPlace })}` : ''}</p>
        {[['Parents', person.parentIds], ['Spouse', person.spouseIds], ['Children', person.childrenIds]].map(([label, ids]) => (ids as string[]).length > 0 && (
          <p key={label as string} className="text-sm mt-1 flex flex-wrap items-center gap-1"><Users className="w-4 h-4 text-gray-400" /> {t(label as string)}:
            {(ids as string[]).map((id) => byId.get(id)).filter(Boolean).map((p) => (
              <button key={p!.id} onClick={() => setPersonId(p!.id)} className="px-2 py-0.5 bg-gray-100 rounded-full hover:bg-genesis-50">{p!.name}</button>
            ))}
          </p>
        ))}
      </div>

      {events.length === 0 ? <p className="text-gray-500">{t("Add a birth date to see {name}'s life as a timeline.", { name: person.name.split(' ')[0] })}</p> : (
        <ol className="relative border-l-2 border-genesis-200 ml-2 space-y-3">
          {events.map((e, i) => (
            <li key={i} className="ml-4">
              <span className={`absolute -left-[7px] mt-1.5 w-3 h-3 rounded-full ${e.kind === 'world' ? 'bg-amber-400' : 'bg-genesis-600'}`} />
              <p className="text-sm text-gray-500">{e.year}{e.age !== null && e.age >= 0 ? ` · ${t('age {n}', { n: e.age })}` : ''}</p>
              <p className={e.kind === 'world' ? 'text-amber-900 flex items-center gap-1' : 'text-gray-900'}>
                {e.kind === 'world' && <Globe2 className="w-4 h-4 shrink-0" />}{e.text}
              </p>
            </li>
          ))}
        </ol>
      )}
      <p className="text-xs text-gray-500">{t('Gold dots are world events from their lifetime, shown as background. They don’t mean the person took part.')}</p>

      {stories.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">{t('Memories about {name}', { name: person.name.split(' ')[0] })}</h3>
          {stories.map((s) => (
            <details key={s.id} className="border rounded-lg p-3 mb-2">
              <summary className="cursor-pointer">{s.title}{s.storyteller ? ` · ${s.storyteller}` : ''}</summary>
              <p className="whitespace-pre-line text-gray-700 mt-2">{s.content}</p>
            </details>
          ))}
        </div>
      )}

      <div className="border-t pt-4 space-y-3">
        <button onClick={write} disabled={busy || events.length === 0} className="flex items-center gap-2 px-4 py-2 bg-genesis-600 text-white rounded-lg disabled:opacity-50">
          <Sparkles className="w-4 h-4" /> {busy ? t('Writing…') : t("Write {name}'s life story", { name: person.name.split(' ')[0] })}
        </button>
        {story && (
          <div className="bg-amber-50/50 border rounded-lg p-4 space-y-3">
            <p className="whitespace-pre-line font-serif leading-relaxed">{story}</p>
            <p className="text-xs text-gray-500">{t('Written by AI from the facts above. Please check it before sharing.')}</p>
            <button onClick={save} className="flex items-center gap-2 px-3 py-2 border rounded-lg"><Save className="w-4 h-4" /> {t('Save to their page')}</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LifeStory;
