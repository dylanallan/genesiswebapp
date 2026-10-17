// Descendants of one person: children, grandchildren and so on, each with their spouses, for the "Descendants" view.
import { PedigreePerson } from './pedigree';

export interface DescNode { person: PedigreePerson; spouses: PedigreePerson[]; children: DescNode[]; gen: number }

export function descendants(rootId: string, people: PedigreePerson[], maxGen = 6): { root: DescNode | null; count: number; generations: number } {
  const byId = new Map(people.map((p) => [p.id, p]));
  // Children can be recorded on either side, so use both the child's parents and the parent's children list.
  const kids = new Map<string, Set<string>>();
  for (const p of people) {
    for (const par of p.parentIds) if (byId.has(par)) (kids.get(par) ?? kids.set(par, new Set()).get(par)!).add(p.id);
    for (const c of p.childrenIds) if (byId.has(c)) (kids.get(p.id) ?? kids.set(p.id, new Set()).get(p.id)!).add(c);
  }
  const seen = new Set<string>();
  let count = 0, generations = 0;
  const build = (id: string, gen: number): DescNode => {
    seen.add(id);
    const person = byId.get(id)!;
    generations = Math.max(generations, gen);
    const children = gen >= maxGen ? [] : [...(kids.get(id) ?? [])]
      .filter((c) => !seen.has(c))
      .map((c) => byId.get(c)!)
      .sort((a, b) => (a.birthDate ?? '9999').localeCompare(b.birthDate ?? '9999') || a.name.localeCompare(b.name))
      .map((c) => { count++; return build(c.id, gen + 1); });
    const spouses = person.spouseIds.map((s) => byId.get(s)).filter((s): s is PedigreePerson => !!s);
    return { person, spouses, children, gen };
  };
  if (!byId.has(rootId)) return { root: null, count: 0, generations: 0 };
  return { root: build(rootId, 0), count, generations };
}
