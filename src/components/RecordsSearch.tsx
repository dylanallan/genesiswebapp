import { useState } from 'react';
import { BookmarkPlus, ExternalLink, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { archiveLinks } from '../lib/archive-links';
import { t, useLang } from '../lib/i18n';

interface RecordHit {
  source: string; sourceLabel: string; sourceId: string; title: string;
  snippet?: string; date?: string; url: string; license?: string; attribution: string;
}
interface SourceStatus { id: string; label: string; status: 'ok' | 'error' | 'not_configured'; count: number }

export default function RecordsSearch() {
  useLang();
  const [name, setName] = useState('');
  const [place, setPlace] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<RecordHit[] | null>(null);
  const [sources, setSources] = useState<SourceStatus[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return toast.error(t('Enter at least 2 characters of a name.'));
    setLoading(true);
    setHits(null);
    try {
      const { data, error } = await supabase.functions.invoke('records-search', { body: { name, place, year: year || undefined } });
      if (error) {
        let message = 'Search failed. Please try again.';
        try { const body = await (error as { context?: Response }).context?.json(); if (body?.error) message = body.error; } catch { /* default */ }
        throw new Error(message);
      }
      setHits(data.hits ?? []);
      setSources(data.sources ?? []);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const save = async (h: RecordHit) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return toast.error(t('Please sign in again.'));
    const { error } = await supabase.from('saved_records').upsert({
      user_id: auth.user.id, source: h.source, source_id: h.sourceId, title: h.title, snippet: h.snippet,
      record_date: h.date, url: h.url, license: h.license, attribution: h.attribution,
    }, { onConflict: 'user_id,source,source_id' });
    if (error) return toast.error(t('Could not save this record.'));
    setSaved((s) => new Set(s).add(`${h.source}:${h.sourceId}`));
    toast.success(t('Saved to your research'));
  };

  return (
    <section className="rounded-xl bg-white p-6 shadow border">
      <h2 className="text-xl font-bold mb-1">{t('Historical Records Search')}</h2>
      <p className="text-sm text-gray-600 mb-4">{t('Free to search, no paywall. Searches open archives at once (WikiTree\'s world family tree, newspapers, books and library collections) and shows where each result comes from.')}</p>

      <form onSubmit={search} className="grid gap-3 sm:grid-cols-4">
        <input aria-label={t('Name')} className="border rounded px-3 py-2 sm:col-span-2" placeholder={t('Name (e.g. Maria Gonzalez)')} value={name} onChange={(e) => setName(e.target.value)} required />
        <input aria-label={t('Place')} className="border rounded px-3 py-2" placeholder={t('Place (optional)')} value={place} onChange={(e) => setPlace(e.target.value)} />
        <input aria-label={t('Year')} className="border rounded px-3 py-2" placeholder={t('Year (optional)')} inputMode="numeric" value={year} onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))} />
        <button disabled={loading} className="sm:col-span-4 inline-flex items-center justify-center gap-2 rounded bg-genesis-600 px-4 py-2 text-white disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}{loading ? t('Searching archives…') : t('Search records')}
        </button>
      </form>

      {hits && (
        <div className="mt-5">
          <p className="mb-3 text-xs text-gray-500">
            {sources.map((s) => t('{source}: {status}', { source: t(s.label), status: s.status === 'ok' ? s.count : s.status === 'not_configured' ? t('not set up') : t('unavailable') })).join(' · ')}
          </p>
          {hits.length === 0 ? <p className="text-gray-600">{t('No records found. Try a different spelling, or remove the place or year.')}</p> : (
            <ul className="space-y-3">
              {hits.map((h) => {
                const key = `${h.source}:${h.sourceId}`;
                return (
                  <li key={key} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <a href={h.url} target="_blank" rel="noopener noreferrer" className="font-medium text-genesis-700 hover:underline inline-flex items-center gap-1">{h.title}<ExternalLink className="h-3 w-3" /></a>
                        {h.date && <span className="ml-2 text-xs text-gray-500">{h.date}</span>}
                        {h.snippet && <p className="mt-1 text-sm text-gray-700">{h.snippet}</p>}
                        <p className="mt-1 text-xs text-gray-500">{h.sourceLabel} · {h.attribution}{h.license ? ` · ${h.license}` : ''}</p>
                      </div>
                      <button onClick={() => save(h)} disabled={saved.has(key)} className="shrink-0 inline-flex items-center gap-1 rounded border px-2 py-1 text-sm disabled:opacity-50" aria-label={t('Save {title}', { title: h.title })}>
                        <BookmarkPlus className="h-4 w-4" />{saved.has(key) ? t('Saved') : t('Save')}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {hits && (
        <details className="mt-6 rounded-lg border p-4" open={hits.length < 5}>
          <summary className="cursor-pointer font-medium">{t('Search more free archives for “{name}”', { name })}</summary>
          <p className="mt-1 mb-3 text-sm text-gray-600">{t('These official archives are free to search on their own websites. Each link opens a search for this name.')}</p>
          {Object.entries(archiveLinks(name, place, year).reduce<Record<string, ReturnType<typeof archiveLinks>>>((acc, l) => {
            (acc[l.region] ??= []).push(l);
            return acc;
          }, {})).map(([region, links]) => (
            <div key={region} className="mb-3">
              <h3 className="text-sm font-semibold text-gray-700">{t(region)}</h3>
              <ul className="mt-1 space-y-1">
                {links.map((l) => (
                  <li key={l.label} className="text-sm">
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-genesis-700 hover:underline inline-flex items-center gap-1">{t(l.label)}<ExternalLink className="h-3 w-3" /></a>
                    {l.note && <span className="ml-2 text-gray-500">{t(l.note)}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </details>
      )}
    </section>
  );
}
