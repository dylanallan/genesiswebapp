import assert from 'node:assert/strict'
import { originAllowed } from './cors.ts'

const allowed = ['https://genesisheritage.netlify.app', 'https://*--genesisheritage.netlify.app', 'http://localhost:5173']

Deno.test('exact origins match exactly', () => {
  assert.equal(originAllowed('https://genesisheritage.netlify.app', allowed), true)
  assert.equal(originAllowed('http://localhost:5173', allowed), true)
  assert.equal(originAllowed('https://genesisheritage.netlify.app.evil.com', allowed), false)
  assert.equal(originAllowed('', allowed), false)
})

Deno.test('a star covers one host-name part, nothing more', () => {
  assert.equal(originAllowed('https://deploy-preview-5--genesisheritage.netlify.app', allowed), true)
  assert.equal(originAllowed('https://evil.com/--genesisheritage.netlify.app', allowed), false)
  assert.equal(originAllowed('https://a.b--genesisheritage.netlify.app', allowed), false)
  assert.equal(originAllowed('https://x--genesisheritage.netlify.app.evil.com', allowed), false)
})
