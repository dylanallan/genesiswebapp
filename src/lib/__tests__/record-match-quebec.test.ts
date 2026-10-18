import { describe, expect, it } from 'vitest';
import { frenchKey, givenNames, scoreMatch, surnameSet } from '../record-match';

const base = { birthYear: null, deathYear: null, birthPlace: null, deathPlace: null };

describe('Quebec and Acadian names', () => {
  it('treats French spelling variants as the same surname', () => {
    for (const [a, b] of [['Thibodeau', 'Thibaudeau'], ['Thibodeau', 'Thibodeaux'], ['Ouellet', 'Ouellette'], ['Lévesque', 'Levesque'],
      ['Gagnon', 'Gagnion'], ['Tremblay', 'Tremblai'], ['Boucher', 'Bouchez']]) {
      expect(frenchKey(a), `${a} / ${b}`).toBe(frenchKey(b));
    }
    expect(frenchKey('Gagnon')).not.toBe(frenchKey('Tremblay'));
  });

  it('knows "dit" names and birth names', () => {
    expect(surnameSet({ name: 'Pierre Boucher dit Boisbuisson', ...base })).toEqual(['boucher', 'boisbuisson']);
    expect(surnameSet({ name: 'Marie Gagnon', otherSurnames: ['Tremblay'], ...base })).toEqual(['gagnon', 'tremblay']);
    const r = scoreMatch({ name: 'Pierre Boucher dit Boisbuisson', ...base }, { title: 'Baptême de Pierre Boisbuisson' });
    expect(r.evidence.some((e) => e.kind === 'support' && e.text.includes('boisbuisson'))).toBe(true);
    expect(r.evidence.some((e) => e.text.includes('does not appear') && e.text.includes('Boucher'))).toBe(false);
    // A married woman appears under her birth name in Quebec records.
    const w = scoreMatch({ name: 'Marie-Rose Gagnon', otherSurnames: ['Tremblay'], ...base }, { title: 'Rose Tremblay, sépulture' });
    expect(w.evidence.filter((e) => e.kind === 'conflict')).toEqual([]);
  });

  it('matches the name people actually used, not the customary Marie or Joseph', () => {
    expect(givenNames('Marie-Louise Gagnon')).toEqual(['marielouise', 'marie', 'louise']);
    const r = scoreMatch({ name: 'Marie-Louise Gagnon', ...base }, { title: 'Louise Gagnon' });
    expect(r.evidence.some((e) => e.kind === 'support' && e.text.includes('louise'))).toBe(true);
    // "Marie" alone in a record is not evidence that it's Marie-Louise.
    const m = scoreMatch({ name: 'Marie-Louise Gagnon', ...base }, { title: 'Marie Gagnon' });
    expect(m.evidence.some((e) => e.kind === 'conflict' && e.text.startsWith('First name'))).toBe(true);
  });

  it('matches a French spelling variant found in the record', () => {
    const r = scoreMatch({ name: 'Joseph Thibodeau', ...base }, { title: 'Joseph Thibaudeau, Acadie' });
    expect(r.evidence.some((e) => e.text.includes('sounds the same'))).toBe(true);
  });
});
