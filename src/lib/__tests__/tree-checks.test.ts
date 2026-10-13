import { describe, expect, it } from 'vitest';
import { checkTree, CheckPerson } from '../tree-checks';

const p = (id: string, name: string, birthDate: string | null, extra: Partial<CheckPerson> = {}): CheckPerson => ({
  id, name, birthDate, deathDate: null, isLiving: true, gender: null, parentIds: [], spouseIds: [], childrenIds: [], ...extra,
});
const today = new Date('2026-10-13T00:00:00Z');
const messages = (people: CheckPerson[]) => checkTree(people, today).map((i) => i.message);

describe('tree checkup', () => {
  it('finds impossible dates', () => {
    expect(messages([p('a', 'Ana', '1950-01-01', { deathDate: '1940-01-01', isLiving: false })])).toContain('Ana died (1940) before being born (1950).');
    expect(messages([p('a', 'Ana', '2030-01-01')])).toContain('Ana has a birth date in the future.');
  });

  it('checks parents against children', () => {
    const mom = p('m', 'Rosa', '1960-05-01', { gender: 'female', deathDate: '1985-01-01', isLiving: false });
    const kid = p('k', 'Luis', '1990-01-01', { parentIds: ['m'] });
    const early = p('e', 'Eva', '1955-01-01', { parentIds: ['m'] });
    const young = p('y', 'Yo', '1970-01-01', { parentIds: ['m'] });
    const out = messages([mom, kid, early, young]);
    expect(out).toContain('Rosa died before Luis was born.');
    expect(out).toContain('Eva was born before their parent Rosa.');
    expect(out).toContain('Rosa would have been 10 when Yo was born.');
  });

  it('allows a father to die shortly before the birth', () => {
    const dad = p('d', 'Juan', '1950-01-01', { gender: 'male', deathDate: '1979-10-01', isLiving: false });
    expect(messages([dad, p('k', 'Kid', '1980-03-01', { parentIds: ['d'] })])).toEqual([]);
  });

  it('flags very old people without a death date and likely duplicates', () => {
    const out = messages([p('a', 'Old Tom', '1880-01-01'), p('b', 'Maria Vega', '1931-02-02'), p('c', 'Maria  Vega', '1931-07-07')]);
    expect(out.some((m) => m.startsWith('Old Tom was born in 1880'))).toBe(true);
    expect(out).toContain('Maria  Vega may be listed twice (both born 1931).');
  });

  it('is quiet for a sensible tree', () => {
    const gm = p('g', 'Gran', '1930-01-01', { gender: 'female', deathDate: '2010-01-01', isLiving: false });
    const mom = p('m', 'Mom', '1960-01-01', { gender: 'female', parentIds: ['g'] });
    expect(messages([gm, mom, p('me', 'Me', '1992-01-01', { parentIds: ['m'] })])).toEqual([]);
  });
});
