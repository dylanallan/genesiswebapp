// Federated historical-records search over OPEN, free, legal sources (official APIs / public-domain collections).
// Each connector returns normalized hits that keep their source, license and attribution.
// We deliberately do NOT scrape sites whose terms forbid it (Ancestry, MyHeritage, Find a Grave, ...).

export interface RecordQuery {
  name: string // free text, e.g. "Maria Gonzalez"
  place?: string
  year?: number
}

export interface RecordHit {
  source: string // connector id
  sourceLabel: string // human-readable
  sourceId: string
  title: string
  snippet?: string
  date?: string
  url: string
  license?: string // license or rights statement when the source provides one
  attribution: string
}

export interface Connector {
  id: string
  label: string
  needsKey?: string // env var that must be set for this connector to run
  search(q: RecordQuery, signal: AbortSignal): Promise<RecordHit[]>
}

const UA = `GenesisHeritage/1.0 (${Deno.env.get('CONTACT_EMAIL') ?? 'contact-not-set'})`
const getJson = async (url: string, signal: AbortSignal, headers: Record<string, string> = {}) => {
  const res = await fetch(url, { signal, headers: { 'User-Agent': UA, Accept: 'application/json', ...headers } })
  if (!res.ok) throw new Error(`${res.status} from ${new URL(url).host}`)
  return await res.json()
}
const text = (v: unknown): string => (Array.isArray(v) ? text(v[0]) : typeof v === 'string' ? v : '')
const clip = (s: string, n = 240) => (s.length > n ? s.slice(0, n - 1) + '…' : s)
const terms = (q: RecordQuery) => [q.name, q.place, q.year].filter(Boolean).join(' ')

// Wikidata (CC0): notable people and places, with life dates in the description.
const wikidata: Connector = {
  id: 'wikidata',
  label: 'Wikidata',
  async search(q, signal) {
    const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=en&uselang=en&type=item&limit=8&origin=*&search=${encodeURIComponent(q.name)}`
    const data = await getJson(url, signal)
    return (data.search ?? []).map((r: any): RecordHit => ({
      source: 'wikidata', sourceLabel: 'Wikidata', sourceId: r.id,
      title: r.label ?? r.id, snippet: r.description, url: `https://www.wikidata.org/wiki/${r.id}`,
      license: 'CC0 1.0', attribution: 'Wikidata contributors',
    }))
  },
}

// Library of Congress – Chronicling America: digitized US newspapers 1777-1963 (public domain).
const chroniclingAmerica: Connector = {
  id: 'chronicling-america',
  label: 'Chronicling America (Library of Congress)',
  async search(q, signal) {
    const url = `https://www.loc.gov/collections/chronicling-america/?fo=json&c=8&q=${encodeURIComponent(terms(q))}`
    const data = await getJson(url, signal)
    return (data.results ?? []).map((r: any): RecordHit => ({
      source: 'chronicling-america', sourceLabel: 'Chronicling America', sourceId: String(r.id ?? r.url),
      title: text(r.title) || 'Newspaper page', snippet: clip(text(r.description) || text(r.partof_title)),
      date: text(r.date), url: String(r.url ?? r.id).replace(/^http:/, 'https:'),
      license: 'Public domain (no known copyright restrictions)', attribution: 'Library of Congress',
    }))
  },
}

// Internet Archive: digitized books, local histories, family genealogies, directories.
const internetArchive: Connector = {
  id: 'internet-archive',
  label: 'Internet Archive',
  async search(q, signal) {
    const query = `(${terms(q)}) AND (genealogy OR family OR history OR census OR directory)`
    const url = `https://archive.org/advancedsearch.php?output=json&rows=8&fl%5B%5D=identifier&fl%5B%5D=title&fl%5B%5D=description&fl%5B%5D=date&fl%5B%5D=licenseurl&q=${encodeURIComponent(query)}`
    const data = await getJson(url, signal)
    return (data.response?.docs ?? []).map((d: any): RecordHit => ({
      source: 'internet-archive', sourceLabel: 'Internet Archive', sourceId: d.identifier,
      title: text(d.title) || d.identifier, snippet: clip(text(d.description).replace(/<[^>]+>/g, '')),
      date: text(d.date).slice(0, 10), url: `https://archive.org/details/${d.identifier}`,
      license: text(d.licenseurl) || 'See item page', attribution: 'Internet Archive',
    }))
  },
}

// Digital Public Library of America (free key): US libraries, archives, museums.
const dpla: Connector = {
  id: 'dpla',
  label: 'Digital Public Library of America',
  needsKey: 'DPLA_API_KEY',
  async search(q, signal) {
    const url = `https://api.dp.la/v2/items?page_size=8&api_key=${Deno.env.get('DPLA_API_KEY')}&q=${encodeURIComponent(terms(q))}`
    const data = await getJson(url, signal)
    return (data.docs ?? []).map((d: any): RecordHit => ({
      source: 'dpla', sourceLabel: 'DPLA', sourceId: d.id,
      title: text(d.sourceResource?.title) || 'Untitled', snippet: clip(text(d.sourceResource?.description)),
      date: text(d.sourceResource?.date?.displayDate), url: text(d.isShownAt) || `https://dp.la/item/${d.id}`,
      license: text(d.sourceResource?.rights) || 'See item page', attribution: text(d.dataProvider) || 'DPLA contributor',
    }))
  },
}

// Europeana (free key): European archives, libraries, museums.
const europeana: Connector = {
  id: 'europeana',
  label: 'Europeana',
  needsKey: 'EUROPEANA_API_KEY',
  async search(q, signal) {
    const url = `https://api.europeana.eu/record/v2/search.json?rows=8&wskey=${Deno.env.get('EUROPEANA_API_KEY')}&query=${encodeURIComponent(terms(q))}`
    const data = await getJson(url, signal)
    return (data.items ?? []).map((d: any): RecordHit => ({
      source: 'europeana', sourceLabel: 'Europeana', sourceId: d.id,
      title: text(d.title) || 'Untitled', snippet: clip(text(d.dcDescription)),
      date: text(d.year), url: text(d.guid) || `https://www.europeana.eu/item${d.id}`,
      license: text(d.rights), attribution: text(d.dataProvider) || 'Europeana contributor',
    }))
  },
}

export const CONNECTORS: Connector[] = [wikidata, chroniclingAmerica, internetArchive, dpla, europeana]

export interface SearchOutcome {
  hits: RecordHit[]
  sources: Array<{ id: string; label: string; status: 'ok' | 'error' | 'not_configured'; count: number; error?: string }>
}

// Runs every configured connector in parallel with a hard timeout; one failing source never breaks the rest.
export async function searchAll(q: RecordQuery, timeoutMs = 8000): Promise<SearchOutcome> {
  const outcome: SearchOutcome = { hits: [], sources: [] }
  await Promise.all(
    CONNECTORS.map(async (c) => {
      if (c.needsKey && !Deno.env.get(c.needsKey)) {
        outcome.sources.push({ id: c.id, label: c.label, status: 'not_configured', count: 0 })
        return
      }
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), timeoutMs)
      try {
        const hits = await c.search(q, ctrl.signal)
        outcome.hits.push(...hits)
        outcome.sources.push({ id: c.id, label: c.label, status: 'ok', count: hits.length })
      } catch (e) {
        console.error(`records connector ${c.id} failed:`, (e as Error).message)
        outcome.sources.push({ id: c.id, label: c.label, status: 'error', count: 0, error: 'Source unavailable' })
      } finally {
        clearTimeout(timer)
      }
    }),
  )
  return outcome
}
