import { describe, expect, it } from 'vitest';
import { quickTreeRows } from '../../components/GetStarted';

const e = (name: string) => ({ name, birthDate: '', birthPlace: '' });

describe('quick tree', () => {
  it('links you, your parents and grandparents', () => {
    let n = 0;
    const rows = quickTreeRows({ me: e('Dylan Batchelor'), mother: e('Ana María López'), father: e(''), mgm: e('Rosa'), mgf: e(''), pgm: e(''), pgf: e('') }, () => `id${++n}`);
    const by = Object.fromEntries(rows.map((r) => [r.relationship, r]));
    expect(rows).toHaveLength(3);
    expect(by.self.parent_ids).toEqual([by.mother.id]);
    expect(by.mother.children_ids).toEqual([by.self.id]);
    expect(by.mother.parent_ids).toEqual([by['maternal grandmother'].id]);
    expect(by.mother).toMatchObject({ first_name: 'Ana', middle_name: 'María', last_name: 'López', gender: 'female' });
    expect(by['maternal grandmother']).toMatchObject({ first_name: 'Rosa', last_name: '', children_ids: [by.mother.id] });
  });
});
