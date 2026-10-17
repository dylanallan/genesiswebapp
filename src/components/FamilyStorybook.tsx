import React, { useEffect, useState } from 'react';
import { BookOpen, Sparkles, Printer, Download, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { chatApi } from '../api/chat';
import { Chapter, StoryPerson, chapterRequest, planChapters, storybookHtml } from '../lib/storybook';
import { downloadFile } from './TreeImport';
import { loadAllFamilyRows } from '../lib/family';
import { useSaveGuard } from '../lib/use-save-guard';
import { BookSize, photoCaption, printBookHtml } from '../lib/storybook-print';
import { currentUserId, signedUrl } from '../lib/storage';
import { locale, t, useLang } from '../lib/i18n';

interface SavedBook { id: string; title: string; chapters: Chapter[]; created_at: string }

const year = (d: string | null) => (d ? Number(d.slice(0, 4)) || null : null);

interface MemberRow { first_name: string | null; middle_name: string | null; last_name: string | null; birth_date: string | null; death_date: string | null; birth_location: string | null; death_location: string | null; relationship: string | null; occupation: string[] | null; notes: string | null }
interface EventRow { date: string | null; event_date: string | null; title: string; description: string | null }

async function gatherFamily() {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id ?? '';
  const [memberRows, stories, recipes, events] = await Promise.all([
    loadAllFamilyRows<MemberRow>('first_name,middle_name,last_name,birth_date,death_date,birth_location,death_location,relationship,occupation,notes'),
    supabase.from('cultural_stories').select('title,content,storyteller').eq('user_id', uid).limit(50),
    supabase.from('recipes').select('name,origin,story').eq('user_id', uid).limit(50),
    supabase.from('timeline_events').select('date,event_date,title,description').eq('user_id', uid).limit(100),
  ]);
  const people: StoryPerson[] = memberRows.map((m) => ({
    name: [m.first_name, m.middle_name, m.last_name].filter(Boolean).join(' ') || t('Unknown'),
    birthYear: year(m.birth_date),
    deathYear: year(m.death_date),
    birthPlace: m.birth_location,
    deathPlace: m.death_location,
    relationship: m.relationship,
    occupation: Array.isArray(m.occupation) ? m.occupation : [],
    notes: m.notes,
  }));
  return {
    people,
    extras: {
      stories: stories.data ?? [],
      recipes: recipes.data ?? [],
      events: ((events.data ?? []) as EventRow[]).map((e) => ({ date: e.date ?? e.event_date ?? '', title: e.title, description: e.description })),
    },
  };
}

// Everything the printed book adds to the written chapters: each saved story in full, and family photos.
async function gatherForPrint() {
  const uid = await currentUserId();
  const [{ people }, stories, files] = await Promise.all([
    gatherFamily(),
    supabase.from('cultural_stories').select('title,content,storyteller').eq('user_id', uid).order('created_at', { ascending: true }).limit(50),
    supabase.storage.from('family-photos').list(uid, { limit: 24, sortBy: { column: 'created_at', order: 'asc' } }),
  ]);
  const images = ((files.data ?? []) as Array<{ name: string }>).filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f.name));
  const photos = (await Promise.all(images.map(async (f) => {
    try { return { url: await signedUrl('family-photos', `${uid}/${f.name}`), caption: photoCaption(f.name) }; } catch { return null; }
  }))).filter((p): p is { url: string; caption: string } => p !== null);
  return { people, stories: (stories.data ?? []) as Array<{ title: string; content: string; storyteller: string | null }>, photos };
}

export const FamilyStorybook: React.FC = () => {
  useLang();
  const [size, setSize] = useState<BookSize>('6x9');
  const [preparing, setPreparing] = useState(false);
  const [title, setTitle] = useState('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [saved, setSaved] = useState<SavedBook[]>([]);
  const [savedId, setSavedId] = useState<string | null>(null);

  const loadSaved = async () => {
    const { data } = await supabase.from('storybooks').select('id,title,chapters,created_at').order('created_at', { ascending: false });
    setSaved((data ?? []) as SavedBook[]);
  };
  useEffect(() => {
    loadSaved();
    supabase.from('family_members').select('last_name').limit(200).then(({ data }: { data: Array<{ last_name: string | null }> | null }) => {
      const counts = new Map<string, number>();
      for (const r of data ?? []) if (r.last_name) counts.set(r.last_name, (counts.get(r.last_name) ?? 0) + 1);
      const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      setTitle((cur) => cur || (top ? t('The {name} Family Story', { name: top }) : t('Our Family Story')));
    });
  }, []);

  const generate = async () => {
    setSavedId(null);
    setChapters([]);
    try {
      setProgress(t('Gathering your family…'));
      const { people, extras } = await gatherFamily();
      if (people.length === 0 && extras.stories.length === 0) {
        toast.error(t('Add some people to your family tree (or import your tree) first, then come back to make your book.'));
        setProgress(null);
        return;
      }
      const plans = planChapters(people, extras);
      const written: Chapter[] = [];
      for (let i = 0; i < plans.length; i++) {
        setProgress(t('Writing chapter {n} of {total}: {heading}…', { n: i + 1, total: plans.length, heading: t(plans[i].heading) }));
        const res = await chatApi.sendMessage(chapterRequest(title, plans[i], i, plans.length), { persist: false });
        if (res.provider === 'error') {
          if (written.length === 0) throw new Error(res.response);
          toast.warning(t('Stopped after {n} chapters: {reason}', { n: written.length, reason: res.response }));
          break;
        }
        written.push({ heading: plans[i].heading, body: res.response.trim() });
        setChapters([...written]);
      }
      toast.success(t('Your storybook is ready. Save it so your family can read it.'));
    } catch (e) {
      toast.error(t('Could not write the book: {reason}', { reason: (e as Error).message }));
    } finally {
      setProgress(null);
    }
  };

  const guard = useSaveGuard(); // a second quick tap must not save twice
  const save = guard(async () => {
    const { data, error } = await supabase.from('storybooks').insert({ title, chapters }).select('id').single();
    if (error) { toast.error(error.message); return; }
    setSavedId(data.id);
    toast.success(t('Saved. Relatives you share your family with can read it too.'));
    loadSaved();
  });

  // The whole book in a new window; it prints once its photos have loaded (or after 8 seconds at most).
  const print = async (bookTitle: string, bookChapters: Chapter[]) => {
    const w = window.open('', '_blank');
    if (!w) { toast.error(t('Please allow pop-ups to print your book.')); return; }
    w.document.write(`<p style="font:16px Georgia,serif;padding:2rem">${t('Preparing your book…')}</p>`);
    setPreparing(true);
    try {
      const extra = await gatherForPrint().catch(() => ({ people: [], stories: [], photos: [] }));
      w.document.open();
      w.document.write(printBookHtml({ title: bookTitle, chapters: bookChapters, size, ...extra }));
      w.document.close();
      const pending = Array.from(w.document.images).filter((img) => !img.complete)
        .map((img) => new Promise((done) => { img.onload = img.onerror = done; }));
      await Promise.race([Promise.all(pending), new Promise((done) => setTimeout(done, 8000))]);
      w.focus();
      w.print();
    } finally {
      setPreparing(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm(t('Delete this saved storybook?'))) return;
    const { error } = await supabase.from('storybooks').delete().eq('id', id);
    if (error) toast.error(error.message); else loadSaved();
  };

  const show = (b: SavedBook) => { setTitle(b.title); setChapters(b.chapters); setSavedId(b.id); };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2"><BookOpen className="w-6 h-6 text-genesis-600" /> {t('Family storybook')}</h2>
        <p className="text-gray-600 mt-1">{t('Turn your family tree, stories and recipes into a beautiful book you can print, save as a PDF, or share. It makes a wonderful gift.')}</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm flex-1 min-w-[220px]">{t('Book title')}
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-lg" />
        </label>
        <button onClick={generate} disabled={progress !== null || !title.trim()} className="flex items-center gap-2 px-4 py-2 bg-genesis-600 text-white rounded-lg hover:bg-genesis-700 disabled:opacity-50">
          <Sparkles className="w-4 h-4" /> {progress ? t('Writing…') : chapters.length ? t('Write a new version') : t('Write my family storybook')}
        </button>
      </div>
      {progress && <p className="text-sm text-genesis-700" role="status">{progress}</p>}
      <p className="text-xs text-gray-500">{t('The AI only retells what you have saved. It does not make up relatives. Check the facts before you print.')}</p>

      {chapters.length > 0 && (
        <article className="border rounded-lg p-6 bg-amber-50/40 font-serif space-y-6">
          <h1 className="text-3xl text-center">{title}</h1>
          {chapters.map((c, i) => (
            <section key={i}>
              <h2 className="text-xl font-semibold border-b pb-1 mb-2">{t(c.heading)}</h2>
              {c.body.split(/\n{2,}/).map((p, j) => <p key={j} className="mb-3 leading-relaxed">{p}</p>)}
            </section>
          ))}
          <div className="flex flex-wrap items-center gap-3 font-sans">
            {!savedId && <button onClick={save} className="flex items-center gap-2 px-4 py-2 bg-genesis-600 text-white rounded-lg"><Save className="w-4 h-4" /> {t('Save book')}</button>}
            <label className="text-sm flex items-center gap-2">{t('Page size')}
              <select value={size} onChange={(e) => setSize(e.target.value as BookSize)} className="px-2 py-2 border rounded-lg">
                <option value="6x9">{t('Book (6 × 9 in)')}</option>
                <option value="letter">{t('Letter (8.5 × 11 in)')}</option>
              </select>
            </label>
            <button onClick={() => print(title, chapters)} disabled={preparing} className="flex items-center gap-2 px-4 py-2 border rounded-lg disabled:opacity-50"><Printer className="w-4 h-4" /> {preparing ? t('Preparing your book…') : t('Print or save as a book')}</button>
            <button onClick={() => downloadFile(`${title.replace(/\W+/g, '-')}.html`, storybookHtml(title, chapters), 'text/html')} className="flex items-center gap-2 px-4 py-2 border rounded-lg"><Download className="w-4 h-4" /> {t('Download')}</button>
          </div>
          <p className="text-xs text-gray-500 font-sans">{t('The printed book adds a cover, contents, page numbers, each saved story in full, your family photos and a family page. In the print window, choose “Save as PDF” to keep a copy or send it to a print shop.')}</p>
        </article>
      )}

      {saved.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="font-semibold mb-2">{t('Saved books')}</h3>
          <ul className="space-y-2">
            {saved.map((b) => (
              <li key={b.id} className="flex items-center justify-between border rounded-lg px-3 py-2">
                <button onClick={() => show(b)} className="text-left hover:text-genesis-700">{b.title} <span className="text-sm text-gray-500">· {new Date(b.created_at).toLocaleDateString(locale())}</span></button>
                <button onClick={() => remove(b.id)} aria-label={t('Delete {title}', { title: b.title })} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FamilyStorybook;
