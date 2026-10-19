// Builds one person's life timeline from the family tree (births, deaths, children, losses) and adds the
// world events they lived through, clearly marked as background, like Ancestry's LifeStory but free.
import type { AITask } from '../api/chat';
import { t } from './i18n';

export interface LifePerson {
  id: string;
  name: string;
  gender: string | null;
  birthDate: string | null;
  deathDate: string | null;
  birthPlace: string | null;
  deathPlace: string | null;
  parentIds: string[];
  spouseIds: string[];
  childrenIds: string[];
}

export interface LifeEvent { year: number; date: string | null; age: number | null; kind: 'family' | 'world'; text: string }

interface WorldEvent { from: number; to?: number; text: string; regions?: string[] } // regions: words matched against places

// A short list of widely known events. Region-specific ones only show for people who lived there.
export const WORLD_EVENTS: WorldEvent[] = [
  { from: 1845, to: 1852, text: 'The Great Famine in Ireland drives about a million people to emigrate', regions: ['ireland', 'irish'] },
  { from: 1861, to: 1865, text: 'The American Civil War', regions: ['united states', 'usa', 'america'] },
  { from: 1867, text: 'Canada becomes a country (Confederation)', regions: ['canada', 'ontario', 'quebec', 'nova scotia', 'new brunswick'] },
  { from: 1892, to: 1954, text: 'Ellis Island receives millions of immigrants to the United States', regions: ['new york', 'new jersey', 'pennsylvania', 'massachusetts', 'ellis island'] },
  { from: 1910, to: 1920, text: 'The Mexican Revolution', regions: ['mexico', 'méxico'] },
  { from: 1914, to: 1918, text: 'The First World War' },
  { from: 1918, to: 1920, text: 'The influenza pandemic ("Spanish flu") spreads around the world' },
  { from: 1929, to: 1939, text: 'The Great Depression' },
  { from: 1936, to: 1939, text: 'The Spanish Civil War', regions: ['spain', 'españa'] },
  { from: 1939, to: 1945, text: 'The Second World War' },
  { from: 1942, to: 1964, text: 'The Bracero Program brings Mexican workers to the United States', regions: ['mexico', 'méxico'] },
  { from: 1947, text: 'Independence and Partition of India and Pakistan', regions: ['india', 'pakistan', 'punjab', 'bengal'] },
  { from: 1950, to: 1953, text: 'The Korean War' },
  { from: 1955, to: 1968, text: 'The US civil rights movement', regions: ['united states', 'usa', 'america'] },
  { from: 1969, text: 'People walk on the Moon for the first time' },
  { from: 1989, text: 'The Berlin Wall falls' },
  { from: 2020, to: 2022, text: 'The COVID-19 pandemic' },
];

const yearOf = (d: string | null) => (d ? Number(d.slice(0, 4)) || null : null);

export function lifeTimeline(focusId: string, people: LifePerson[], thisYear = new Date().getFullYear()): LifeEvent[] {
  const byId = new Map(people.map((p) => [p.id, p]));
  const me = byId.get(focusId);
  if (!me) return [];
  const born = yearOf(me.birthDate);
  const died = yearOf(me.deathDate);
  const end = died ?? (born ? Math.min(thisYear, born + 100) : null);
  const age = (y: number) => (born ? y - born : null);
  const events: LifeEvent[] = [];
  const add = (date: string | null, text: string) => {
    const y = yearOf(date);
    if (y) events.push({ year: y, date, age: age(y), kind: 'family', text });
  };
  const first = me.name.split(' ')[0];

  add(me.birthDate, me.birthPlace ? t('{name} is born in {place}', { name: first, place: me.birthPlace }) : t('{name} is born', { name: first }));
  for (const id of me.childrenIds) {
    const c = byId.get(id);
    if (c) {
      const role = c.gender === 'female' ? 'Daughter' : c.gender === 'male' ? 'Son' : 'Child';
      add(c.birthDate, c.birthPlace ? t(`${role} {name} is born in {place}`, { name: c.name, place: c.birthPlace }) : t(`${role} {name} is born`, { name: c.name }));
    }
  }
  for (const id of me.parentIds) {
    const p = byId.get(id);
    const d = yearOf(p?.deathDate ?? null);
    if (p && d && (!born || d >= born)) add(p.deathDate, t(`${p.gender === 'female' ? 'Mother' : p.gender === 'male' ? 'Father' : 'Parent'} {name} dies`, { name: p.name }));
  }
  for (const id of me.spouseIds) {
    const s = byId.get(id);
    const d = yearOf(s?.deathDate ?? null);
    if (s && d && (!born || d >= born) && (!died || d <= died)) add(s.deathDate, t('Spouse {name} dies', { name: s.name }));
  }
  if (died) {
    const vars = { name: first, place: me.deathPlace ?? '', age: born ? died - born : 0 };
    add(me.deathDate, me.deathPlace
      ? (born ? t('{name} dies in {place} at about {age}', vars) : t('{name} dies in {place}', vars))
      : (born ? t('{name} dies at about {age}', vars) : t('{name} dies', vars)));
  }

  if (born && end) {
    const places = `${me.birthPlace ?? ''} ${me.deathPlace ?? ''}`.toLowerCase();
    for (const w of WORLD_EVENTS) {
      const overlaps = w.from <= end && (w.to ?? w.from) >= born;
      const relevant = !w.regions || w.regions.some((r) => places.includes(r));
      if (overlaps && relevant) {
        const y = Math.max(w.from, born);
        events.push({ year: y, date: null, age: age(y), kind: 'world', text: w.to ? `${t(w.text)} (${w.from}–${w.to})` : t(w.text) });
      }
    }
  }
  return events.sort((a, b) => a.year - b.year || (a.kind === 'family' ? -1 : 1));
}

/** A life story as an AI job: the person, their life events and any family memories. */
export function lifeStoryRequest(person: LifePerson, events: LifeEvent[], stories: string[]): AITask {
  return {
    task: 'life_story',
    input: {
      name: person.name,
      events: events.map((e) => `- ${e.year}${e.age !== null ? ` (age ${e.age})` : ''}: ${e.text}${e.kind === 'world' ? ' [world event]' : ''}`).join('\n').slice(0, 5500),
      memories: stories.map((s) => `- ${s.replace(/\s+/g, ' ').slice(0, 600)}`).join('\n').slice(0, 2000),
    },
  };
}
