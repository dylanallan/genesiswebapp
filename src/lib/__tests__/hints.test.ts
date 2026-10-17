import { describe, expect, it } from 'vitest';
import { nextToCheck, searchable, worthShowing, HintPerson } from '../hints';

const p = (id: string, over: Partial<HintPerson> = {}): HintPerson => ({
  id, first_name: 'Rosa', middle_name: null, last_name: 'Vega', birth_date: '1902-03-04', death_date: '1980-01-01',
  birth_location: null, death_location: null, is_living: false, ...over,
});

describe('record hints', () => {
  it('only searches people archives can say something about', () => {
    expect(searchable(p('a'))).toBe(true);
    expect(searchable(p('a', { last_name: '' }))).toBe(false);
    expect(searchable(p('a', { birth_date: null, death_date: null }))).toBe(false);
    expect(searchable(p('a', { birth_date: '1990-01-01', death_date: null, is_living: true }), 2026)).toBe(false); // living
    expect(searchable(p('a', { birth_date: '1910-01-01', death_date: null, is_living: null }), 2026)).toBe(true); // born 100+ years ago
  });

  it('checks never-searched people first, then those with more details, then the oldest', () => {
    const people = [p('old', { birth_date: '1850-01-01' }), p('placed', { birth_location: 'Cork' }), p('seen'), p('young', { birth_date: '1920-01-01' })];
    const checked = new Map([['seen', '2026-10-01T00:00:00Z']]);
    expect(nextToCheck(people, checked).map((x) => x.id)).toEqual(['placed', 'old', 'young', 'seen']);
    expect(nextToCheck(people, checked, 2).map((x) => x.id)).toEqual(['placed', 'old']);
  });

  it('shows only strong and possible matches', () => {
    expect(worthShowing({ score: 80, level: 'strong', evidence: [] })).toBe(true);
    expect(worthShowing({ score: 50, level: 'possible', evidence: [] })).toBe(true);
    expect(worthShowing({ score: 30, level: 'weak', evidence: [] })).toBe(false);
  });
});
