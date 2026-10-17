import { describe, expect, it } from 'vitest';
import { lifeStoryRequest, lifeTimeline, LifePerson } from '../life-story';

const p = (id: string, name: string, birthDate: string | null, extra: Partial<LifePerson> = {}): LifePerson => ({
  id, name, gender: null, birthDate, deathDate: null, birthPlace: null, deathPlace: null, parentIds: [], spouseIds: [], childrenIds: [], ...extra,
});

describe('life story timeline', () => {
  const people = [
    p('rosa', 'Rosa Vega', '1902-03-01', { gender: 'female', birthPlace: 'Oaxaca, México', deathDate: '1980-06-01', deathPlace: 'Los Angeles, California', parentIds: ['mama'], spouseIds: ['juan'], childrenIds: ['luis'] }),
    p('mama', 'Carmen Ruiz', '1880-01-01', { gender: 'female', deathDate: '1931-01-01' }),
    p('juan', 'Juan Vega', '1898-01-01', { gender: 'male', deathDate: '1965-01-01' }),
    p('luis', 'Luis Vega', '1930-05-05', { gender: 'male', birthPlace: 'Los Angeles' }),
  ];

  it('lists family events in order with ages', () => {
    const family = lifeTimeline('rosa', people).filter((e) => e.kind === 'family').map((e) => `${e.year} ${e.age} ${e.text}`);
    expect(family).toEqual([
      '1902 0 Rosa is born in Oaxaca, México',
      '1930 28 Son Luis Vega is born in Los Angeles',
      '1931 29 Mother Carmen Ruiz dies',
      '1965 63 Spouse Juan Vega dies',
      '1980 78 Rosa dies in Los Angeles, California at about 78',
    ]);
  });

  it('adds world events she lived through, including ones for her region', () => {
    const world = lifeTimeline('rosa', people).filter((e) => e.kind === 'world').map((e) => e.text);
    expect(world).toContain('The Mexican Revolution (1910–1920)');
    expect(world).toContain('The Second World War (1939–1945)');
    expect(world.some((t) => t.includes('Ireland'))).toBe(false);
    expect(world.some((t) => t.includes('COVID'))).toBe(false);
  });

  it('builds a prompt that forbids invented facts', () => {
    const job = lifeStoryRequest(people[0], lifeTimeline('rosa', people), ['She loved to sing.']);
    expect(job.task).toBe('life_story');
    expect(job.input.name).toBe('Rosa Vega');
    expect(job.input.events).toContain('1930 (age 28): Son Luis Vega is born');
    expect(job.input.memories).toContain('She loved to sing.');
    expect(JSON.stringify(job)).not.toContain('Never invent'); // the instructions stay on the server
  });
});
