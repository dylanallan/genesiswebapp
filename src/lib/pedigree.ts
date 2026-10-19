// Lays out an ancestor (pedigree) chart: the focus person, their parents, grandparents and so on.
// Slot i of generation g has its father at slot 2i and mother at slot 2i+1 of generation g+1.

export interface PedigreePerson {
  id: string;
  name: string;
  gender: string | null;
  birthDate: string | null;
  deathDate: string | null;
  birthPlace: string | null;
  parentIds: string[];
  childrenIds: string[];
  spouseIds: string[];
  relationship?: string | null;
}

export interface PedigreeSlot {
  gen: number;
  index: number;
  person: PedigreePerson | null;
  childId: string | null; // the person in the generation before, whose parent this slot is
  role: 'focus' | 'father' | 'mother' | 'parent';
}

/** Father first, then mother; people with unknown gender fill whichever side is free. */
export function orderedParents(p: PedigreePerson, byId: Map<string, PedigreePerson>): [PedigreePerson | null, PedigreePerson | null] {
  const parents = p.parentIds.map((id) => byId.get(id)).filter((x): x is PedigreePerson => !!x).slice(0, 2);
  let father = parents.find((x) => x.gender === 'male') ?? null;
  let mother = parents.find((x) => x.gender === 'female' && x !== father) ?? null;
  for (const x of parents) {
    if (x === father || x === mother) continue;
    if (!father) father = x; else if (!mother) mother = x;
  }
  return [father, mother];
}

export function pedigree(focusId: string, people: PedigreePerson[], generations = 5): PedigreeSlot[] {
  const byId = new Map(people.map((p) => [p.id, p]));
  const focus = byId.get(focusId) ?? null;
  const slots: PedigreeSlot[] = [{ gen: 0, index: 0, person: focus, childId: null, role: 'focus' }];
  let previous = slots;
  for (let gen = 1; gen < generations; gen++) {
    const next: PedigreeSlot[] = [];
    for (const child of previous) {
      const [father, mother] = child.person ? orderedParents(child.person, byId) : [null, null];
      const childId = child.person?.id ?? null;
      next.push({ gen, index: child.index * 2, person: father, childId, role: father ? (father.gender === 'female' ? 'parent' : 'father') : 'father' });
      next.push({ gen, index: child.index * 2 + 1, person: mother, childId, role: mother ? (mother.gender === 'male' ? 'parent' : 'mother') : 'mother' });
    }
    slots.push(...next);
    previous = next;
  }
  return slots;
}

/** How many generations actually have someone in them (so the chart doesn't draw empty columns). */
export function usedGenerations(slots: PedigreeSlot[]): number {
  return slots.reduce((max, s) => (s.person ? Math.max(max, s.gen + 1) : max), 1);
}

/** The person to start the chart from: the user themself if marked, otherwise the youngest person with parents. */
export function defaultFocus(people: PedigreePerson[]): string | null {
  const self = people.find((p) => /^(self|me|myself)$/i.test(p.relationship ?? ''));
  if (self) return self.id;
  const withParents = people.filter((p) => p.parentIds.length).sort((a, b) => (b.birthDate ?? '').localeCompare(a.birthDate ?? ''));
  return withParents[0]?.id ?? people[0]?.id ?? null;
}
