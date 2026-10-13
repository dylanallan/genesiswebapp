import { describe, expect, it } from 'vitest';
import { buildFamilyMap, uniquePlaces, MapPersonInput } from '../family-map';

const person = (id: string, birthYear: number | null, birthPlace: string | null, parentIds: string[] = [], extra: Partial<MapPersonInput> = {}): MapPersonInput => ({
  id, name: id, birthYear, deathYear: null, birthPlace, deathPlace: null, parentIds, ...extra,
});
const coords = {
  'oaxaca, mexico': { lat: 17.07, lon: -96.72 },
  'los angeles': { lat: 34.05, lon: -118.24 },
  'toronto': { lat: 43.65, lon: -79.38 },
};

describe('family map', () => {
  const people = [
    person('gran', 1902, 'Oaxaca, Mexico', [], { deathYear: 1980, deathPlace: 'Los Angeles' }),
    person('mom', 1940, 'Los Angeles', ['gran']),
    person('me', 1992, 'Toronto', ['mom']),
    person('cousin', 1995, 'Toronto', ['mom']),
    person('unknown', 1950, 'Atlantis', ['gran']),
  ];

  it('lists each place once', () => {
    expect(uniquePlaces(people).sort()).toEqual(['Atlantis', 'Los Angeles', 'Oaxaca, Mexico', 'Toronto']);
  });

  it('pins births and deaths and draws one line per move', () => {
    const map = buildFamilyMap(people, coords);
    expect(map.pins.map((p) => [p.place, p.people.length])).toEqual([['Los Angeles', 2], ['Toronto', 2], ['Oaxaca, Mexico', 1]]);
    expect(map.moves.map((m) => m.label)).toEqual(['Oaxaca, Mexico → Los Angeles (by 1940)', 'Los Angeles → Toronto (by 1992)']);
    expect(map.span).toEqual({ from: 1902, to: 1995 });
  });

  it('shows the journey only up to a chosen year', () => {
    const map = buildFamilyMap(people, coords, 1960);
    expect(map.pins.map((p) => p.place).sort()).toEqual(['Los Angeles', 'Oaxaca, Mexico']);
    expect(map.moves).toHaveLength(1);
  });
});
