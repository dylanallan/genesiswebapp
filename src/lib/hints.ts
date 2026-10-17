// Record hints: which people to search next, and which found records are worth showing.
// The scoring itself is record-match.ts; this decides the order and the bar.
import type { MatchResult } from './record-match';

export interface HintPerson {
  id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  birth_date: string | null;
  death_date: string | null;
  birth_location: string | null;
  death_location: string | null;
  is_living: boolean | null;
}

const year = (d: string | null) => (d ? Number(d.slice(0, 4)) || null : null);

/** People archives can say something about: a first and last name, a date, and not someone living today. */
export function searchable(p: HintPerson, thisYear = new Date().getFullYear()): boolean {
  if (!p.first_name?.trim() || !p.last_name?.trim()) return false;
  const born = year(p.birth_date), died = year(p.death_date);
  if (!born && !died) return false;
  // Records about living people are rare and private; start with those who have passed or were born long ago.
  return p.is_living === false || !!died || (born !== null && thisYear - born >= 100);
}

/**
 * The next people to search: never-checked first, then the longest ago; among equals, those with the most
 * details (a place narrows the search), then the oldest (more records survive about them).
 */
export function nextToCheck(people: HintPerson[], checked: Map<string, string>, count = 10): HintPerson[] {
  const detail = (p: HintPerson) => (p.birth_location ? 2 : 0) + (p.death_location ? 1 : 0) + (p.middle_name ? 1 : 0);
  return people
    .filter((p) => searchable(p))
    .sort((a, b) => {
      const ca = checked.get(a.id) ?? '', cb = checked.get(b.id) ?? '';
      if (ca !== cb) return ca < cb ? -1 : 1; // '' (never) sorts first
      if (detail(a) !== detail(b)) return detail(b) - detail(a);
      return (year(a.birth_date) ?? 9999) - (year(b.birth_date) ?? 9999);
    })
    .slice(0, count);
}

/** Only strong and possible matches become hints; weak ones would bury the good ones. */
export const worthShowing = (r: MatchResult) => r.level === 'strong' || r.level === 'possible';
