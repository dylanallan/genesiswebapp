import assert from 'node:assert/strict'
import { CONNECTORS, parseGallica, parseNara, parseOpenArch, searchAll } from './records-connectors.ts'

Deno.test('reads Gallica Dublin Core records and keeps only real Gallica links', () => {
  const xml = `<srw:searchRetrieveResponse><srw:records>
    <srw:record><srw:recordData><oai_dc:dc>
      <dc:title>Généalogie des familles Tremblay &amp; Gagnon</dc:title>
      <dc:date>1898</dc:date><dc:type>monographie imprimée</dc:type>
      <dc:identifier>https://gallica.bnf.fr/ark:/12148/bpt6k000001</dc:identifier>
      <dc:rights>domaine public</dc:rights>
    </oai_dc:dc></srw:recordData></srw:record>
    <srw:record><srw:recordData><oai_dc:dc><dc:title>No link</dc:title></oai_dc:dc></srw:recordData></srw:record>
  </srw:records></srw:searchRetrieveResponse>`
  const hits = parseGallica(xml)
  assert.equal(hits.length, 1)
  assert.equal(hits[0].title, 'Généalogie des familles Tremblay & Gagnon')
  assert.equal(hits[0].url, 'https://gallica.bnf.fr/ark:/12148/bpt6k000001')
  assert.equal(hits[0].date, '1898')
  assert.equal(hits[0].license, 'domaine public')
})

Deno.test('reads National Archives search hits and links to the catalog page', () => {
  const hits = parseNara({ body: { hits: { hits: [
    { _source: { record: { naId: 12345, title: 'Passenger list, SS Example, 1912' } } },
    { _source: { record: {} } },
  ] } } })
  assert.equal(hits.length, 1)
  assert.equal(hits[0].url, 'https://catalog.archives.gov/id/12345')
  assert.equal(hits[0].title, 'Passenger list, SS Example, 1912')
  assert.deepEqual(parseNara({}), [])
})

Deno.test('untested sources stay off until switched on', async () => {
  assert.ok(CONNECTORS.some((c) => c.id === 'gallica' && c.enabledBy))
  const realFetch = globalThis.fetch
  globalThis.fetch = (() => Promise.reject(new Error('offline'))) as typeof fetch
  try {
    const { sources } = await searchAll({ name: 'Rosa Tremblay' }, 50)
    assert.equal(sources.find((s) => s.id === 'gallica')?.status, 'not_configured')
    assert.equal(sources.find((s) => s.id === 'nara')?.status, 'not_configured')
    assert.equal(sources.find((s) => s.id === 'openarch')?.status, 'not_configured')
  } finally {
    globalThis.fetch = realFetch
  }
})

Deno.test('reads Open Archives results, links each record and cites the archive', () => {
  const hits = parseOpenArch({ response: { number_found: 3, docs: [
    { pid: 'p1', identifier: 'C0DDBB5D', archive_code: 'nha', archive_org: 'Noord-Hollands Archief', personname: 'Jan de Vries',
      relationtype: 'Bruidegom', eventtype: 'Marriage', eventdate: { day: 3, month: 5, year: 1851 }, eventplace: ['Haarlem'], sourcetype: 'BS Huwelijk' },
    { personname: 'Has own link', url: 'https://www.openarchieven.nl/hga:8AA6', eventdate: '1820' },
    { personname: 'No way to link' },
  ] } })
  assert.equal(hits.length, 2)
  assert.equal(hits[0].url, 'https://www.openarchieven.nl/nha:C0DDBB5D')
  assert.equal(hits[0].date, '1851-05-03')
  assert.equal(hits[0].attribution, 'Noord-Hollands Archief')
  assert.match(hits[0].snippet ?? '', /Marriage, Haarlem/)
  assert.equal(hits[1].url, 'https://www.openarchieven.nl/hga:8AA6')
  assert.deepEqual(parseOpenArch({}), [])
})
