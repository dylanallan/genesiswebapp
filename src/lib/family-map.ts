// Turns a family tree plus place coordinates into map pins (who was born or died where) and migration
// lines (from a parent's birthplace to their child's), so a family's journey can be drawn over time.

export interface MapPersonInput {
  id: string;
  name: string;
  birthYear: number | null;
  deathYear: number | null;
  birthPlace: string | null;
  deathPlace: string | null;
  parentIds: string[];
}

export interface Coords { lat: number; lon: number }
export interface MapPin { key: string; place: string; coords: Coords; people: Array<{ id: string; name: string; event: 'born' | 'died'; year: number | null }>; firstYear: number | null }
export interface MapMove { childId: string; from: Coords; to: Coords; label: string; year: number | null }

export const placeKey = (place: string) => place.trim().toLowerCase().replace(/\s+/g, ' ');

export function uniquePlaces(people: MapPersonInput[]): string[] {
  const map = new Map<string, string>();
  for (const p of people) for (const place of [p.birthPlace, p.deathPlace]) if (place && place.trim().length > 1) map.set(placeKey(place), place.trim());
  return [...map.values()];
}

export function buildFamilyMap(people: MapPersonInput[], coords: Record<string, Coords | null>, upToYear: number | null = null) {
  const visible = (year: number | null) => upToYear === null || year === null || year <= upToYear;
  const pins = new Map<string, MapPin>();
  const at = (place: string | null) => (place ? coords[placeKey(place)] ?? null : null);
  const addPin = (place: string, c: Coords, person: MapPersonInput, event: 'born' | 'died', year: number | null) => {
    const key = placeKey(place);
    const pin = pins.get(key) ?? { key, place, coords: c, people: [], firstYear: null };
    pin.people.push({ id: person.id, name: person.name, event, year });
    if (year !== null && (pin.firstYear === null || year < pin.firstYear)) pin.firstYear = year;
    pins.set(key, pin);
  };

  for (const p of people) {
    const b = at(p.birthPlace);
    if (b && p.birthPlace && visible(p.birthYear)) addPin(p.birthPlace, b, p, 'born', p.birthYear);
    const d = at(p.deathPlace);
    if (d && p.deathPlace && p.deathYear !== null && visible(p.deathYear)) addPin(p.deathPlace, d, p, 'died', p.deathYear);
  }

  const byId = new Map(people.map((p) => [p.id, p]));
  const moves: MapMove[] = [];
  const seen = new Set<string>();
  for (const child of people) {
    const to = at(child.birthPlace);
    if (!to || !visible(child.birthYear)) continue;
    for (const parentId of child.parentIds) {
      const parent = byId.get(parentId);
      const from = parent ? at(parent.birthPlace) : null;
      if (!parent || !from) continue;
      if (Math.abs(from.lat - to.lat) < 0.05 && Math.abs(from.lon - to.lon) < 0.05) continue; // same town: no move
      const k = `${placeKey(parent.birthPlace!)}>${placeKey(child.birthPlace!)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      moves.push({ childId: child.id, from, to, year: child.birthYear, label: `${parent.birthPlace} → ${child.birthPlace}${child.birthYear ? ` (by ${child.birthYear})` : ''}` });
    }
  }

  const years = people.flatMap((p) => [p.birthYear, p.deathYear]).filter((y): y is number => y !== null);
  return {
    pins: [...pins.values()].sort((a, b) => b.people.length - a.people.length),
    moves,
    span: years.length ? { from: Math.min(...years), to: Math.max(...years) } : null,
  };
}
