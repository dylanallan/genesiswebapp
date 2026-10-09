import assert from 'node:assert/strict'
import { calculateAudioDuration, detectSoundEffects, formatSSML, generatePrompt, selectVoice, validateRequest } from './index.ts'

Deno.test('validateRequest accepts a person story', () => {
  validateRequest({ data: { person: { name: 'John Smith', birthDate: '1900-01-01' } } })
})

Deno.test('validateRequest rejects missing data and missing names', () => {
  assert.throws(() => validateRequest({ data: {} }), /Story data is required/)
  assert.throws(() => validateRequest({ data: { person: { name: '  ' } } }), /Person name is required/)
})

Deno.test('validateRequest only accepts languages that have voices', () => {
  validateRequest({ data: { custom: { title: 't', content: 'c' } }, options: { language: 'en-US' } })
  assert.throws(() => validateRequest({ data: { custom: { title: 't', content: 'c' } }, options: { language: 'fr-FR' } }), /Available: /)
})

Deno.test('selectVoice prefers a recommended voice of the requested gender', () => {
  assert.equal(selectVoice('en-US', 'female'), 'en-US-Neural2-C')
  assert.equal(selectVoice('en-GB', 'male'), 'en-GB-Neural2-B')
})

Deno.test('formatSSML escapes markup and adds pauses', () => {
  const ssml = formatSSML('Tom & Jerry <arrived>. Then left.')
  assert.ok(ssml.startsWith('<speak>'))
  assert.ok(ssml.includes('Tom &amp; Jerry &lt;arrived&gt;.'))
  assert.ok(ssml.includes('<break time="300ms"/>'))
})

Deno.test('generatePrompt uses only provided facts', () => {
  const prompt = generatePrompt({ person: { name: 'Ada', birthPlace: 'London' } }, { style: 'historical', tone: 'formal' })
  assert.match(prompt, /Ada/)
  assert.match(prompt, /London/)
  assert.match(prompt, /do not invent/)
})

Deno.test('duration and sound effects', () => {
  assert.equal(calculateAudioDuration(Array(150).fill('word').join(' '), 1), 60)
  assert.ok(detectSoundEffects('They married in spring').some((fx) => fx.file === 'wedding.mp3'))
})
