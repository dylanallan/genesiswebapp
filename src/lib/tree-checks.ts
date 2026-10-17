// Finds likely mistakes in a family tree (impossible or unlikely dates, broken links, duplicates).
// Pure function so it can be tested and run on very large imported trees in the browser.
import { t } from './i18n';

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
export interface TreeIssue { personId: string; severity: Severity; message: string; otherId?: string } // otherId: the likely duplicate

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

    if (b !== null && b > today.getTime()) add(p, 'error', t('{name} has a birth date in the future.', { name: p.name }));
    if (b !== null && d !== null && d < b) add(p, 'error', t('{name} died ({died}) before being born ({born}).', { name: p.name, died: dy ?? '', born: by ?? '' }));
    if (by && dy && dy - by > 115) add(p, 'warning', t('{name} lived {n} years, which is very unlikely. Check the dates.', { name: p.name, n: dy - by }));
    if (by && !dy && p.isLiving !== false && thisYear - by > 110) {
      add(p, 'warning', t('{name} was born in {year} and has no death date. Mark them as deceased if they have passed away.', { name: p.name, year: by }));
    }
    if (p.parentIds.length > 2) add(p, 'warning', t('{name} has {n} parents linked. Usually there are two.', { name: p.name, n: p.parentIds.length }));
    if (p.parentIds.includes(p.id) || p.spouseIds.includes(p.id)) add(p, 'error', t('{name} is linked to themselves.', { name: p.name }));

    for (const parentId of p.parentIds) {
      const parent = byId.get(parentId);
      if (!parent) continue;
      const pb = time(parent.birthDate);
      const pd = time(parent.deathDate);
      const pby = year(parent.birthDate);
      if (b !== null && pb !== null && pb >= b) {
        add(p, 'error', t('{name} was born before their parent {parent}.', { name: p.name, parent: parent.name }));
      } else if (by && pby) {
        const age = by - pby;
        if (age < 12) add(p, 'error', t('{parent} would have been {age} when {name} was born.', { parent: parent.name, age, name: p.name }));
        else if (age < 15) add(p, 'warning', t('{parent} would have been only {age} when {name} was born.', { parent: parent.name, age, name: p.name }));
        else if (age > 60 && parent.gender === 'female') add(p, 'warning', t('{parent} would have been {age} when {name} was born.', { parent: parent.name, age, name: p.name }));
        else if (age > 80) add(p, 'warning', t('{parent} would have been {age} when {name} was born.', { parent: parent.name, age, name: p.name }));
      }
      // A father can die up to ~9 months before the birth; a mother cannot die before it.
      if (b !== null && pd !== null) {
        const allowance = parent.gender === 'male' ? 280 * DAY : 0;
        if (pd + allowance < b) add(p, 'error', t('{parent} died before {name} was born.', { parent: parent.name, name: p.name }));
      }
      if (p.parentIds.includes(parentId) && p.childrenIds.includes(parentId)) add(p, 'error', t('{name} and {parent} are linked as both parent and child.', { name: p.name, parent: parent.name }));
    }
  }

  // Likely duplicates: same name and same birth year (or both missing a birth year but sharing a parent).
  const seen = new Map<string, CheckPerson>();
  for (const p of people) {
    const key = `${p.name.trim().toLowerCase().replace(/\s+/g, ' ')}|${year(p.birthDate) ?? ''}`;
    const other = seen.get(key);
    if (other && (year(p.birthDate) || p.parentIds.some((id) => other.parentIds.includes(id)))) {
      issues.push({ personId: p.id, otherId: other.id, severity: 'warning', message: year(p.birthDate) ? t('{name} may be listed twice (both born {year}).', { name: p.name, year: year(p.birthDate) ?? '' }) : t('{name} may be listed twice.', { name: p.name }) });
    } else if (!other) seen.set(key, p);
  }
  return issues;
}
