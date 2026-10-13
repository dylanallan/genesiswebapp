// Finds likely mistakes in a family tree (impossible or unlikely dates, broken links, duplicates).
// Pure function so it can be tested and run on very large imported trees in the browser.

export interface CheckPerson {
  id: string;
  name: string;
  birthDate: string | null; // ISO date
  deathDate: string | null;
  isLiving: boolean | null;
  gender: string | null;
  parentIds: string[];
  spouseIds: string[];
  childrenIds: string[];
}

export type Severity = 'error' | 'warning';
export interface TreeIssue { personId: string; severity: Severity; message: string }

const year = (d: string | null) => (d ? Number(d.slice(0, 4)) || null : null);
const time = (d: string | null) => (d ? new Date(`${d.slice(0, 10)}T00:00:00Z`).getTime() : null);
const DAY = 86_400_000;

export function checkTree(people: CheckPerson[], today = new Date()): TreeIssue[] {
  const byId = new Map(people.map((p) => [p.id, p]));
  const issues: TreeIssue[] = [];
  const add = (p: CheckPerson, severity: Severity, message: string) => issues.push({ personId: p.id, severity, message });
  const thisYear = today.getUTCFullYear();

  for (const p of people) {
    const b = time(p.birthDate);
    const d = time(p.deathDate);
    const by = year(p.birthDate);
    const dy = year(p.deathDate);

    if (b !== null && b > today.getTime()) add(p, 'error', `${p.name} has a birth date in the future.`);
    if (b !== null && d !== null && d < b) add(p, 'error', `${p.name} died (${dy}) before being born (${by}).`);
    if (by && dy && dy - by > 115) add(p, 'warning', `${p.name} lived ${dy - by} years, which is very unlikely. Check the dates.`);
    if (by && !dy && p.isLiving !== false && thisYear - by > 110) {
      add(p, 'warning', `${p.name} was born in ${by} and has no death date. Mark them as deceased if they have passed away.`);
    }
    if (p.parentIds.length > 2) add(p, 'warning', `${p.name} has ${p.parentIds.length} parents linked. Usually there are two.`);
    if (p.parentIds.includes(p.id) || p.spouseIds.includes(p.id)) add(p, 'error', `${p.name} is linked to themselves.`);

    for (const parentId of p.parentIds) {
      const parent = byId.get(parentId);
      if (!parent) continue;
      const pb = time(parent.birthDate);
      const pd = time(parent.deathDate);
      const pby = year(parent.birthDate);
      if (b !== null && pb !== null && pb >= b) {
        add(p, 'error', `${p.name} was born before their parent ${parent.name}.`);
      } else if (by && pby) {
        const age = by - pby;
        if (age < 12) add(p, 'error', `${parent.name} would have been ${age} when ${p.name} was born.`);
        else if (age < 15) add(p, 'warning', `${parent.name} would have been only ${age} when ${p.name} was born.`);
        else if (age > 60 && parent.gender === 'female') add(p, 'warning', `${parent.name} would have been ${age} when ${p.name} was born.`);
        else if (age > 80) add(p, 'warning', `${parent.name} would have been ${age} when ${p.name} was born.`);
      }
      // A father can die up to ~9 months before the birth; a mother cannot die before it.
      if (b !== null && pd !== null) {
        const allowance = parent.gender === 'male' ? 280 * DAY : 0;
        if (pd + allowance < b) add(p, 'error', `${parent.name} died before ${p.name} was born.`);
      }
      if (p.parentIds.includes(parentId) && p.childrenIds.includes(parentId)) add(p, 'error', `${p.name} and ${parent.name} are linked as both parent and child.`);
    }
  }

  // Likely duplicates: same name and same birth year (or both missing a birth year but sharing a parent).
  const seen = new Map<string, CheckPerson>();
  for (const p of people) {
    const key = `${p.name.trim().toLowerCase().replace(/\s+/g, ' ')}|${year(p.birthDate) ?? ''}`;
    const other = seen.get(key);
    if (other && (year(p.birthDate) || p.parentIds.some((id) => other.parentIds.includes(id)))) {
      add(p, 'warning', `${p.name} may be listed twice${year(p.birthDate) ? ` (both born ${year(p.birthDate)})` : ''}.`);
    } else if (!other) seen.set(key, p);
  }
  return issues;
}
