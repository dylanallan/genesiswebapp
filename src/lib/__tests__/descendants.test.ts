import { describe, expect, it } from 'vitest';
import { descendants } from '../descendants';
import { PedigreePerson } from '../pedigree';

const p = (id: string, birthDate: string | null, parentIds: string[] = [], extra: Partial<PedigreePerson> = {}): PedigreePerson => ({
  id, name: id, gender: null, birthDate, deathDate: null, birthPlace: null, parentIds, childrenIds: [], spouseIds: [], ...extra,
});

describe('descendants', () => {
  it('builds the family downwards, oldest child first, with spouses', () => {
    const t = [
      p('rosa', '1900-01-02', [], { spouseIds: ['juan'] }), p('juan', '1898-03-03', [], { spouseIds: ['rosa'] }),
      p('luis', '1930-05-05', ['rosa', 'juan']), p('ana', '1925-02-02', ['rosa']), p('maya', '1960-01-01', ['ana']),
    ];
    const d = descendants('rosa', t);
    expect(d.count).toBe(3);
    expect(d.generations).toBe(2);
    expect(d.root!.spouses.map((s) => s.name)).toEqual(['juan']);
    expect(d.root!.children.map((c) => c.person.name)).toEqual(['ana', 'luis']);
    expect(d.root!.children[0].children[0].person.name).toBe('maya');
  });
  it('uses children lists too, stops at loops and at the generation limit', () => {
    const t = [p('a', null, ['c'], { childrenIds: ['b'] }), p('b', null), p('c', null, ['a'])];
    const d = descendants('a', t);
    expect(d.root!.children.map((c) => c.person.name).sort()).toEqual(['b', 'c']);
    expect(d.count).toBe(2);
    expect(descendants('a', t, 0).count).toBe(0);
    expect(descendants('zz', t).root).toBeNull();
  });
});
