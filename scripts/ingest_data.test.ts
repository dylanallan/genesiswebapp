import assert from 'node:assert/strict'
import { chunksFor, parseCsv } from './ingest_data.ts'

Deno.test('parseCsv handles quotes, commas and CRLF', () => {
  const rows = parseCsv('name,place\r\n"Smith, John","Boston ""MA"""\r\nAda,London\n')
  assert.deepEqual(rows, [{ name: 'Smith, John', place: 'Boston "MA"' }, { name: 'Ada', place: 'London' }])
})

Deno.test('csv rows are grouped 20 per chunk with the dataset title', () => {
  const csv = 'a,b\n' + Array.from({ length: 45 }, (_, i) => `${i},x`).join('\n')
  const chunks = chunksFor({ file: 'x.csv', title: 'Test', source: 'https://example.org', license: 'CC0-1.0' }, csv)
  assert.equal(chunks.length, 3)
  assert.match(chunks[0], /^Test \(rows 1-20\)/)
})
