// Loads the datasets listed in data/manifest.json into the shared knowledge_base table, with
// embeddings, so the AI assistant can cite them. Every dataset must declare its source and license;
// anything else is refused. Re-running replaces a dataset's previous rows (idempotent).
//
// Run (Deno):  deno run -A scripts/ingest_data.ts
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY
//
// Manifest entry: { "file": "my-dataset.csv", "title": "...", "source": "https://...", "license": "CC0-1.0" }
// Supported files: .csv (rows grouped into chunks), .md / .txt (split by paragraphs).
import { createClient } from 'npm:@supabase/supabase-js@2'
import OpenAI from 'npm:openai@4.28.0'

interface Dataset { file: string; title: string; source: string; license: string }

const env = (k: string) => {
  const v = Deno.env.get(k)
  if (!v) throw new Error(`Missing environment variable ${k}`)
  return v
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let field = '', row: string[] = [], quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++ } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field); field = ''
      if (row.some((v) => v !== '')) rows.push(row)
      row = []
    } else field += c
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  const [header, ...body] = rows
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])))
}

function chunksFor(ds: Dataset, text: string): string[] {
  if (ds.file.endsWith('.csv')) {
    const rows = parseCsv(text)
    const out: string[] = []
    for (let i = 0; i < rows.length; i += 20) {
      out.push(`${ds.title} (rows ${i + 1}-${Math.min(i + 20, rows.length)})\n` +
        rows.slice(i, i + 20).map((r) => Object.entries(r).map(([k, v]) => `${k}: ${v}`).join('; ')).join('\n'))
    }
    return out
  }
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
  const out: string[] = []
  let cur = ''
  for (const p of paras) {
    if ((cur + '\n\n' + p).length > 4000 && cur) { out.push(cur); cur = p } else cur = cur ? `${cur}\n\n${p}` : p
  }
  if (cur) out.push(cur)
  return out.map((c) => `${ds.title}\n${c}`)
}

if (import.meta.main) {
  const root = new URL('../data/', import.meta.url)
  const manifest = JSON.parse(await Deno.readTextFile(new URL('manifest.json', root))) as { datasets: Dataset[] }
  if (!manifest.datasets?.length) {
    console.log('data/manifest.json lists no datasets; nothing to ingest.')
    Deno.exit(0)
  }
  const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'))
  const openai = new OpenAI({ apiKey: env('OPENAI_API_KEY') })

  for (const ds of manifest.datasets) {
    if (!ds.file || !ds.title || !/^https?:\/\//.test(ds.source ?? '') || !ds.license) {
      throw new Error(`Dataset ${ds.file ?? '(unnamed)'} needs file, title, an http(s) source and a license`)
    }
    if (ds.file.includes('..') || ds.file.startsWith('samples/')) throw new Error(`Refusing to ingest ${ds.file}`)
    const text = await Deno.readTextFile(new URL(ds.file, root))
    const chunks = chunksFor(ds, text)
    console.log(`${ds.file}: ${chunks.length} chunks`)

    await db.from('knowledge_base').delete().eq('metadata->>file', ds.file)
    for (let i = 0; i < chunks.length; i += 50) {
      const batch = chunks.slice(i, i + 50)
      const emb = await openai.embeddings.create({ model: 'text-embedding-3-small', input: batch, encoding_format: 'float' })
      const { error } = await db.from('knowledge_base').insert(batch.map((content, j) => ({
        content,
        content_length: content.length,
        content_tokens: Math.round(content.length / 4),
        embedding: emb.data[j].embedding,
        source: ds.source,
        metadata: { file: ds.file, title: ds.title, license: ds.license, chunk: i + j },
      })))
      if (error) throw error
    }
  }
  console.log('Ingestion complete.')
}

export { chunksFor, parseCsv }
