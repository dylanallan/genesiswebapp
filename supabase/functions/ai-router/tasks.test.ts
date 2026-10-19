import assert from 'node:assert/strict'
const assertStringIncludes = (s: string, part: string) => assert.ok(s.includes(part), `expected to include: ${part}`)

import { taskPrompt } from './tasks.ts'

Deno.test('builds a storybook chapter from facts only', () => {
  const p = taskPrompt('storybook_chapter', { book: 'The Vegas', heading: 'Roots', number: 2, total: 5, facts: 'Rosa Vega, born 1902 in Oaxaca' })!
  assertStringIncludes(p, 'chapter 2 of 5')
  assertStringIncludes(p, '"The Vegas"')
  assertStringIncludes(p, 'Rosa Vega, born 1902 in Oaxaca')
})

Deno.test('keeps chapter numbers in range', () => {
  const p = taskPrompt('storybook_chapter', { book: 'B', heading: 'H', number: 99, total: 3, facts: 'x' })!
  assertStringIncludes(p, 'chapter 3 of 3')
})

Deno.test('explains records and writes life stories', () => {
  assertStringIncludes(taskPrompt('record_explain', { subject: 'Rosa Vega, born 1902', records: '1. "Baptism"' })!, 'researching: Rosa Vega, born 1902.')
  const life = taskPrompt('life_story', { name: 'Rosa Vega', events: '- 1902: Born', memories: '- Loved tamales' })!
  assertStringIncludes(life, 'Family memories:')
})

Deno.test('refuses unknown jobs and missing facts', () => {
  assert.equal(taskPrompt('anything', { facts: 'x' }), null)
  assert.equal(taskPrompt('toString', {}), null)
  assert.equal(taskPrompt('life_story', { name: 'Rosa' }), null)
  assert.equal(taskPrompt('record_explain', null), null)
  assert.ok(taskPrompt('life_story', { name: 'Rosa', events: 'x'.repeat(20000) })!.length < 7000)
})
