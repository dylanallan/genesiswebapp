import { describe, expect, it } from 'vitest';
import { familyFacts, FactPerson } from '../family-facts';

const p = (id: string, first: string, last: string, birthDate: string | null, deathDate: string | null = null, parentIds: string[] = [], birthPlace: string | null = null): FactPerson => ({
  id, firstName: first, lastName: last, name: `${first} ${last}`, birthDate, deathDate, birthPlace, parentIds, childrenIds: [],
});

describe('family facts', () => {
  const tree = [
    p('rosa', 'Rosa', 'Vega', '1902-06-10', '1998-03-01', [], 'Oaxaca, México'),
    p('juan', 'Juan', 'Vega', '1898-01-05', '1960-12-31', [], 'Cork, Ireland'),
    p('a', 'Juan', 'Vega', '1925-02-02', '2000-02-01', ['rosa', 'juan']),
    p('b', 'Ana', 'Vega', '1927-01-01', null, ['rosa', 'juan']),
    p('c', 'Luis', 'Smith', '1930-01-01', null, ['rosa']),
  ];
  const facts = Object.fromEntries(familyFacts(tree).map((f) => [f.id, f]));

  it('finds the highlights', () => {
    expect(facts.people.value).toBe('5');
    expect(facts.earliest).toMatchObject({ value: '1898', personId: 'juan' });
    expect(facts.span.value).toBe('32');
    expect(facts.longest).toMatchObject({ value: '95 years', detail: 'Rosa Vega' });
    expect(facts.average.value).toBe('77 years'); // 95, 62, 74
    expect(facts.biggest).toMatchObject({ value: '3 children', detail: 'Rosa Vega' });
    expect(facts.surname).toMatchObject({ value: 'Vega', detail: '4 people' });
    expect(facts.firstname).toMatchObject({ value: 'Juan', detail: 'Used 2 times' });
    expect(facts.countries).toMatchObject({ value: '2' });
  });

  it('skips facts it cannot back up', () => {
    const f = familyFacts([p('x', 'Solo', 'One', null, null), p('y', 'Bad', 'Dates', '1990-01-01', '1900-01-01')]).map((x) => x.id);
    expect(f).toEqual(['people', 'earliest']);
  });
});
