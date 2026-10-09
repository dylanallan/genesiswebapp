import assert from 'node:assert/strict'
import { assertPublicHttpsUrl } from './net.ts'

Deno.test('allows public https URLs', () => {
  assert.equal(assertPublicHttpsUrl('https://example.com/webhook').hostname, 'example.com')
  assert.equal(assertPublicHttpsUrl('https://n8n.my-company.io').hostname, 'n8n.my-company.io')
})

Deno.test('blocks plain http and invalid URLs', () => {
  assert.throws(() => assertPublicHttpsUrl('http://example.com'), /https/)
  assert.throws(() => assertPublicHttpsUrl('not a url'), /Invalid URL/)
})

Deno.test('blocks private, loopback, link-local and metadata addresses', () => {
  for (const url of [
    'https://localhost', 'https://127.0.0.1', 'https://10.0.0.5', 'https://192.168.1.1',
    'https://172.16.0.1', 'https://169.254.169.254/latest/meta-data', 'https://100.64.0.1',
    'https://[::1]', 'https://[fd00::1]', 'https://db.internal', 'https://printer.local', 'https://2130706433',
  ]) {
    assert.throws(() => assertPublicHttpsUrl(url), /not allowed/, url)
  }
})
