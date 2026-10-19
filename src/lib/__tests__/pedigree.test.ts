import { describe, expect, it } from 'vitest';
import { defaultFocus, pedigree, PedigreePerson, usedGenerations } from '../pedigree';

const p = (id: string, gender: string | null, parentIds: string[] = [], extra: Partial<PedigreePerson> = {}): PedigreePerson => ({
  id, name: id, gender, birthDate: null, deathDate: null, birthPlace: null, parentIds, childrenIds: [], spouseIds: [], ...extra,
});

describe('pedigree chart', () => {
  const people = [
    p('me', 'male', ['mom', 'dad'], { relationship: 'self' }),
    p('mom', 'female', ['gma', 'gpa']),
    p('dad', 'male'),
    p('gma', 'female'),
    p('gpa', 'male'),
  ];

  it('puts fathers above mothers in each generation', () => {
    const slots = pedigree('me', people, 3);
    const at = (gen: number, index: number) => slots.find((s) => s.gen === gen && s.index === index)!;
    expect(at(0, 0).person?.id).toBe('me');
    expect(at(1, 0).person?.id).toBe('dad');
    expect(at(1, 1).person?.id).toBe('mom');
    expect(at(2, 2).person?.id).toBe('gpa');
    expect(at(2, 3).person?.id).toBe('gma');
    expect(at(2, 0)).toMatchObject({ person: null, childId: 'dad', role: 'father' });
    expect(slots).toHaveLength(1 + 2 + 4);
  });

  it('knows how many generations are filled and where to start', () => {
    expect(usedGenerations(pedigree('me', people, 5))).toBe(3);
    expect(defaultFocus(people)).toBe('me');
  });

  it('copes with unknown genders and missing people', () => {
    const slots = pedigree('x', [p('x', null, ['a', 'b', 'ghost']), p('a', null), p('b', null)], 2);
    expect(slots.filter((s) => s.gen === 1).map((s) => s.person?.id)).toEqual(['a', 'b']);
    expect(pedigree('nobody', people, 2)[0].person).toBeNull();
  });
});
