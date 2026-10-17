// Large, messy trees like real imports: 10,000+ people, loops (someone listed as their own ancestor),
// links to people who aren't there, duplicates and odd dates. Every tool must stay fast and never hang.
import { describe, expect, it } from 'vitest';
import { findRelationship } from '../relationship';
import { checkTree } from '../tree-checks';
import { heritageMix } from '../heritage-mix';
import { familyFacts } from '../family-facts';
import { descendants } from '../descendants';
import { upcomingDays } from '../on-this-day';
import { parseGedcom, toGedcom } from '../gedcom';
import { lifeTimeline } from '../life-story';
import { planChapters } from '../storybook';

interface P {
  id: string; name: string; firstName: string; lastName: string; gender: string | null;
  birthDate: string | null; deathDate: string | null; birthPlace: string | null; deathPlace: string | null;
  isLiving: boolean | null; parentIds: string[]; spouseIds: string[]; childrenIds: string[]; relationship?: string | null;
}

const PLACES = ['Cork, Ireland', 'Oaxaca, México', 'Toronto, ON', 'Lagos, Nigeria', 'Kraków, Poland', null, 'Somewhere unknown'];
const SURNAMES = ['Vega', 'Kelly', "O'Néill", 'Nowak', 'Okafor', 'Smith', 'Müller-Łącka'];

function bigTree(generations = 14): P[] {
  const people: P[] = [];
  const add = (gen: number, i: number): P => {
    const year = 2000 - gen * 28 + (i % 7);
    const p: P = {
      id: `g${gen}-${i}`, firstName: `Name${i}`, lastName: SURNAMES[i % SURNAMES.length], name: `Name${i} ${SURNAMES[i % SURNAMES.length]}`,
      gender: i % 2 ? 'female' : 'male', birthDate: i % 11 === 0 ? null : `${year}-0${(i % 9) + 1}-1${i % 9}`,
      deathDate: gen > 3 && i % 3 ? `${year + 70}-01-01` : null, birthPlace: PLACES[i % PLACES.length], deathPlace: null,
      isLiving: gen <= 3, parentIds: [], spouseIds: [], childrenIds: [],
    };
    people.push(p);
    return p;
  };
  // A full pedigree: 2^generations - 1 direct ancestors of one person (8,191 people for 13 generations).
  const byGen: P[][] = [[add(0, 0)]];
  byGen[0][0].relationship = 'self';
  byGen[0][0].birthDate = '1995-06-15';
  for (let g = 1; g < generations; g++) {
    byGen[g] = [];
    for (const child of byGen[g - 1]) {
      const dad = add(g, byGen[g].length), mum = add(g, byGen[g].length + 1);
      dad.spouseIds.push(mum.id); mum.spouseIds.push(dad.id);
      child.parentIds.push(dad.id, mum.id);
      dad.childrenIds.push(child.id); mum.childrenIds.push(child.id);
      byGen[g].push(dad, mum);
    }
  }
  // Brothers and sisters for the first few generations, to push past 10,000 people with cousins.
  for (let g = 1; g < 9; g++) {
    for (const parent of byGen[g].filter((_, i) => i % 2 === 0)) {
      for (let s = 0; s < 3; s++) {
        const sib = add(g - 1, 100000 + people.length);
        sib.parentIds.push(parent.id, parent.spouseIds[0]);
        parent.childrenIds.push(sib.id);
      }
    }
  }
  // Mistakes real imports contain.
  const top = byGen[generations - 1];
  top[0].parentIds.push(byGen[2][0].id);                        // a loop: an old ancestor "born of" a grandparent
  top[1].parentIds.push('missing-person');                      // a link to nobody
  top[2].parentIds.push(top[2].id);                             // their own parent
  people.push({ ...top[3], id: 'dup-1', childrenIds: [] });     // a duplicate
  people.push({ ...top[4], id: 'bad-date', birthDate: 'abt 1850', deathDate: '1700-01-01' });
  return people;
}

const time = <T>(fn: () => T): [T, number] => { const t = performance.now(); const r = fn(); return [r, performance.now() - t]; };

describe('big messy trees', () => {
  const people = bigTree();
  const me = people[0];

  it('builds a realistic test family of over 10,000 people', () => {
    expect(people.length).toBeGreaterThan(10_000);
  });

  it('finds relationships quickly, even across loops', () => {
    const far = people.find((p) => p.id.startsWith('g13-'))!;
    const cousin = people.find((p) => p.id.startsWith('g0-1'))!;
    const [r1, t1] = time(() => findRelationship(me.id, far.id, people));
    const [r2, t2] = time(() => findRelationship(me.id, cousin.id, people));
    expect(r1).not.toBeNull();
    expect(r2).not.toBeNull();
    expect(t1 + t2).toBeLessThan(1500);
  });

  it('checks the whole tree in well under two seconds and flags the mistakes', () => {
    const [issues, t] = time(() => checkTree(people, new Date('2026-10-17')));
    expect(t).toBeLessThan(2000);
    expect(issues.length).toBeGreaterThan(0);
  });

  it('works out heritage, facts, descendants and upcoming days fast', () => {
    const [mix, t1] = time(() => heritageMix(me.id, people));
    const [facts, t2] = time(() => familyFacts(people));
    const oldest = people.find((p) => p.id === 'g8-0')!;
    const [desc, t3] = time(() => descendants(oldest.id, people));
    const [days, t4] = time(() => upcomingDays(people, new Date('2026-10-17')));
    expect(mix).not.toBeNull();
    expect(facts.length).toBeGreaterThan(0);
    expect(desc.count).toBeGreaterThan(0);
    expect(Array.isArray(days)).toBe(true);
    expect(t1 + t2 + t3 + t4).toBeLessThan(2000);
  });

  it('builds a life story and storybook plan without hanging', () => {
    const [events, t1] = time(() => lifeTimeline(me.id, people));
    const story = people.slice(0, 5000).map((p) => ({
      name: p.name, birthYear: p.birthDate ? Number(p.birthDate.slice(0, 4)) : null, deathYear: null, birthPlace: p.birthPlace,
      deathPlace: null, relationship: null, occupation: [], notes: null,
    }));
    const [plans, t2] = time(() => planChapters(story, { stories: [], recipes: [], events: [] }));
    expect(events.length).toBeGreaterThan(0);
    expect(plans.length).toBeGreaterThan(0);
    expect(t1 + t2).toBeLessThan(1500);
  });

  it('exports and re-imports the whole tree as GEDCOM', () => {
    const rows = people.map((p) => ({
      id: p.id, first_name: p.firstName, middle_name: null, last_name: p.lastName, gender: p.gender, birth_date: p.birthDate,
      birth_location: p.birthPlace, death_date: p.deathDate, death_location: null, is_living: p.isLiving, notes: null,
      parent_ids: p.parentIds, spouse_ids: p.spouseIds,
    }));
    const [ged, t1] = time(() => toGedcom(rows));
    const [back, t2] = time(() => parseGedcom(ged));
    expect(back.people.length).toBe(people.length);
    expect(t1 + t2).toBeLessThan(3000);
  });
});
