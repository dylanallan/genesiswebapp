// "Family facts": friendly highlights worked out from the tree (longest life, biggest family, most common names...).
import { countryOf } from './heritage-mix';

export interface FactPerson {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  birthDate: string | null;
  deathDate: string | null;
  birthPlace: string | null;
  parentIds: string[];
  childrenIds: string[];
}

export interface Fact { id: string; title: string; value: string; detail: string; personId?: string }

const yearOf = (d: string | null) => (d ? Number(d.slice(0, 4)) || null : null);

/** Age at death in whole years. */
function lifespan(p: FactPerson): number | null {
  const b = p.birthDate, d = p.deathDate;
  if (!b || !d) return null;
  const by = yearOf(b), dy = yearOf(d);
  if (!by || !dy || dy < by || dy - by > 122) return null;
  const years = dy - by - (d.slice(5) < b.slice(5) ? 1 : 0);
  return years < 0 ? null : years;
}

function topCount(values: string[]): [string, number] | null {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: [string, number] | null = null;
  for (const [k, n] of counts) if (!best || n > best[1] || (n === best[1] && k < best[0])) best = [k, n];
  return best && best[1] > 1 ? best : null;
}

export function familyFacts(people: FactPerson[]): Fact[] {
  const facts: Fact[] = [];
  const byId = new Map(people.map((p) => [p.id, p]));

  facts.push({ id: 'people', title: 'People in your tree', value: String(people.length), detail: people.length === 1 ? 'Just getting started' : 'And counting' });

  const born = people.filter((p) => yearOf(p.birthDate)).sort((a, b) => (a.birthDate! < b.birthDate! ? -1 : 1));
  if (born.length) {
    const oldest = born[0];
    facts.push({ id: 'earliest', title: 'Earliest ancestor', value: String(yearOf(oldest.birthDate)), detail: `${oldest.name}${oldest.birthPlace ? `, born in ${oldest.birthPlace}` : ''}`, personId: oldest.id });
    const span = yearOf(born[born.length - 1].birthDate)! - yearOf(oldest.birthDate)!;
    if (span > 0) facts.push({ id: 'span', title: 'Years your tree covers', value: String(span), detail: `From ${yearOf(oldest.birthDate)} to ${yearOf(born[born.length - 1].birthDate)}` });
  }

  const lives = people.map((p) => ({ p, years: lifespan(p) })).filter((x): x is { p: FactPerson; years: number } => x.years !== null);
  if (lives.length) {
    const longest = lives.reduce((a, b) => (b.years > a.years ? b : a));
    facts.push({ id: 'longest', title: 'Longest life', value: `${longest.years} years`, detail: longest.p.name, personId: longest.p.id });
    if (lives.length >= 3) {
      const avg = Math.round(lives.reduce((s, x) => s + x.years, 0) / lives.length);
      facts.push({ id: 'average', title: 'Average lifespan', value: `${avg} years`, detail: `Across ${lives.length} ancestors with both dates` });
    }
  }

  // Count children from both sides of the link, since trees record them either way.
  const kids = new Map<string, Set<string>>();
  for (const p of people) {
    for (const par of p.parentIds) if (byId.has(par)) (kids.get(par) ?? kids.set(par, new Set()).get(par)!).add(p.id);
    for (const c of p.childrenIds) if (byId.has(c)) (kids.get(p.id) ?? kids.set(p.id, new Set()).get(p.id)!).add(c);
  }
  let biggest: [string, number] | null = null;
  for (const [id, set] of kids) if (!biggest || set.size > biggest[1]) biggest = [id, set.size];
  if (biggest && biggest[1] >= 2) {
    const p = byId.get(biggest[0])!;
    facts.push({ id: 'biggest', title: 'Biggest family', value: `${biggest[1]} children`, detail: p.name, personId: p.id });
  }

  const surname = topCount(people.map((p) => p.lastName.trim()));
  if (surname) facts.push({ id: 'surname', title: 'Most common surname', value: surname[0], detail: `${surname[1]} people` });
  const first = topCount(people.map((p) => p.firstName.trim()));
  if (first) facts.push({ id: 'firstname', title: 'Most passed-down first name', value: first[0], detail: `Used ${first[1]} times` });

  const countries = new Set(people.map((p) => countryOf(p.birthPlace)).filter(Boolean));
  if (countries.size) facts.push({ id: 'countries', title: 'Countries of birth', value: String(countries.size), detail: [...countries].slice(0, 5).join(', ') + (countries.size > 5 ? '…' : '') });

  return facts;
}
