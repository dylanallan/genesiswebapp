import { describe, expect, it } from 'vitest';
import { chooseKeeper, mergedFields, suggestChoices, suggestSide, MergeRow } from '../merge';

const row = (id: string, over: Partial<MergeRow> = {}): MergeRow => ({
  id, first_name: 'Mary', middle_name: null, last_name: 'Kelly', gender: null,
  birth_date: null, birth_location: null, death_date: null, death_location: null, notes: null,
  parent_ids: [], spouse_ids: [], children_ids: [], ...over,
});

describe('merge helpers', () => {
  it('keeps the record with more family links and details', () => {
    const a = row('a');
    const b = row('b', { parent_ids: ['p1', 'p2'], birth_date: '1901-03-04' });
    expect(chooseKeeper(a, b).map((r) => r.id)).toEqual(['b', 'a']);
    expect(chooseKeeper(b, a).map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('fills an empty detail from the other record', () => {
    expect(suggestSide('birth_location', row('k'), row('r', { birth_location: 'Cork' }))).toBe('remove');
    expect(suggestSide('birth_location', row('k', { birth_location: 'Cork' }), row('r'))).toBe('keep');
  });

  it('prefers an exact date over a 1 January guess in the same year', () => {
    expect(suggestSide('birth_date', row('k', { birth_date: '1901-01-01' }), row('r', { birth_date: '1901-03-04' }))).toBe('remove');
    expect(suggestSide('birth_date', row('k', { birth_date: '1901-01-01' }), row('r', { birth_date: '1903-03-04' }))).toBe('keep');
  });

  it('prefers the fuller place name', () => {
    expect(suggestSide('birth_location', row('k', { birth_location: 'Cork' }), row('r', { birth_location: 'Cork, Ireland' }))).toBe('remove');
  });

  it('builds the details to save from the choices', () => {
    const k = row('k', { birth_date: '1901-01-01', last_name: 'Kelly ' });
    const r = row('r', { birth_date: '1901-03-04', birth_location: 'Cork' });
    const out = mergedFields(k, r, suggestChoices(k, r));
    expect(out.birth_date).toBe('1901-03-04');
    expect(out.birth_location).toBe('Cork');
    expect(out.last_name).toBe('Kelly');
    expect(out.notes).toBe('');
  });
});
