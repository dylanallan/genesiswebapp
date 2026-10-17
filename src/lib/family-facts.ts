// "Family facts": friendly highlights worked out from the tree (longest life, biggest family, most common names...).
import { countryOf } from './heritage-mix';
import { t } from './i18n';

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

  facts.push({ id: 'people', title: t('People in your tree'), value: String(people.length), detail: people.length === 1 ? t('Just getting started') : t('And counting') });

  const born = people.filter((p) => yearOf(p.birthDate)).sort((a, b) => (a.birthDate! < b.birthDate! ? -1 : 1));
  if (born.length) {
    const oldest = born[0];
    facts.push({ id: 'earliest', title: t('Earliest ancestor'), value: String(yearOf(oldest.birthDate)), detail: oldest.birthPlace ? t('{name}, born in {place}', { name: oldest.name, place: oldest.birthPlace }) : oldest.name, personId: oldest.id });
    const span = yearOf(born[born.length - 1].birthDate)! - yearOf(oldest.birthDate)!;
    if (span > 0) facts.push({ id: 'span', title: t('Years your tree covers'), value: String(span), detail: t('From {from} to {to}', { from: yearOf(oldest.birthDate) ?? '', to: yearOf(born[born.length - 1].birthDate) ?? '' }) });
  }

  const lives = people.map((p) => ({ p, years: lifespan(p) })).filter((x): x is { p: FactPerson; years: number } => x.years !== null);
  if (lives.length) {
    const longest = lives.reduce((a, b) => (b.years > a.years ? b : a));
    facts.push({ id: 'longest', title: t('Longest life'), value: t('{n} years', { n: longest.years }), detail: longest.p.name, personId: longest.p.id });
    if (lives.length >= 3) {
      const avg = Math.round(lives.reduce((s, x) => s + x.years, 0) / lives.length);
      facts.push({ id: 'average', title: t('Average lifespan'), value: t('{n} years', { n: avg }), detail: t('Across {n} ancestors with both dates', { n: lives.length }) });
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
    facts.push({ id: 'biggest', title: t('Biggest family'), value: t('{n} children', { n: biggest[1] }), detail: p.name, personId: p.id });
  }

  const surname = topCount(people.map((p) => p.lastName.trim()));
  if (surname) facts.push({ id: 'surname', title: t('Most common surname'), value: surname[0], detail: t('{n} people', { n: surname[1] }) });
  const first = topCount(people.map((p) => p.firstName.trim()));
  if (first) facts.push({ id: 'firstname', title: t('Most passed-down first name'), value: first[0], detail: t('Used {n} times', { n: first[1] }) });

  const countries = new Set(people.map((p) => countryOf(p.birthPlace)).filter(Boolean));
  if (countries.size) facts.push({ id: 'countries', title: t('Countries of birth'), value: String(countries.size), detail: [...countries].slice(0, 5).join(', ') + (countries.size > 5 ? '…' : '') });

  return facts;
}
