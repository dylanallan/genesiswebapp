import assert from 'node:assert/strict'
import { compatibleKey, orderByPreference } from './ai-providers.ts'

const names = ['omniroute', 'gemini', 'groq', 'anthropic']
const order = (o: string | undefined) => orderByPreference(names, (n) => n, o)

Deno.test('keeps the default order when none is set', () => {
  assert.deepEqual(order(undefined), names)
  assert.deepEqual(order(' '), names)
})

Deno.test('listed providers go first, the rest keep their order after them', () => {
  assert.deepEqual(order('Anthropic, groq'), ['anthropic', 'groq', 'omniroute', 'gemini'])
})

Deno.test('OmniRoute is used once its URL is set, with or without a key', () => {
  Deno.env.delete('OMNIROUTE_BASE_URL')
  Deno.env.delete('OMNIROUTE_API_KEY')
  assert.equal(compatibleKey('omniroute'), undefined)
  Deno.env.set('OMNIROUTE_BASE_URL', 'https://ai.example.com/v1')
  assert.equal(compatibleKey('omniroute'), 'none')
  Deno.env.set('OMNIROUTE_API_KEY', 'sk-test')
  assert.equal(compatibleKey('omniroute'), 'sk-test')
  Deno.env.delete('OMNIROUTE_BASE_URL')
  Deno.env.delete('OMNIROUTE_API_KEY')
})

Deno.test('free services need their own key', () => {
  Deno.env.delete('GROQ_API_KEY')
  assert.equal(compatibleKey('groq'), undefined)
  Deno.env.set('GROQ_API_KEY', 'gsk-test')
  assert.equal(compatibleKey('groq'), 'gsk-test')
  Deno.env.delete('GROQ_API_KEY')
})
