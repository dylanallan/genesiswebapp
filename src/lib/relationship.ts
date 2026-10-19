// Relationship calculator: "How is this person related to me?" Finds the closest shared ancestor and names
// the relationship in plain words (great-aunt, second cousin once removed, sister-in-law...), with the path
// and roughly how much DNA the two people would be expected to share.

import { getLang } from './i18n';
import { describeRelationshipFr } from './relationship-fr';

export interface KinPerson {
  id: string;
  name: string;
  gender: string | null;
  parentIds: string[];
  spouseIds: string[];
}

export interface Relationship {
  label: string; // what `them` is to `me`, e.g. "great-grandmother"
  path: string[]; // names from me up to the shared ancestor(s) and down to them
  sharedAncestors: string[];
  dnaPercent: number | null; // expected autosomal DNA shared, blood relatives only
  kind: 'self' | 'blood' | 'spouse' | 'in-law';
  gender?: string | null; // of `them`, so other languages can pick the right word form
}

const MAX_DEPTH = 15;

// Worked-out answers are remembered per family (per lookup table), so asking about thousands of people in a big
// tree stays fast. A new family list builds a new table, so nothing stale is ever reused.
const ancestorCache = new WeakMap<Map<string, KinPerson>, Map<string, Map<string, number>>>();
const childrenCache = new WeakMap<Map<string, KinPerson>, Map<string, string[]>>();
const tableCache = new WeakMap<KinPerson[], Map<string, KinPerson>>();

function lookup(people: KinPerson[]): Map<string, KinPerson> {
  let byId = tableCache.get(people);
  if (!byId) { byId = new Map(people.map((p) => [p.id, p])); tableCache.set(people, byId); }
  return byId;
}

function ancestors(id: string, byId: Map<string, KinPerson>): Map<string, number> {
  let cache = ancestorCache.get(byId);
  if (!cache) { cache = new Map(); ancestorCache.set(byId, cache); }
  const known = cache.get(id);
  if (known) return known;
  const depth = new Map<string, number>([[id, 0]]);
  let frontier = [id];
  for (let d = 1; d <= MAX_DEPTH && frontier.length; d++) {
    const next: string[] = [];
    for (const x of frontier) {
      for (const p of byId.get(x)?.parentIds ?? []) {
        if (!depth.has(p) && byId.has(p)) { depth.set(p, d); next.push(p); }
      }
    }
    frontier = next;
  }
  cache.set(id, depth);
  return depth;
}

const ordinal = (n: number) => ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'][n] ?? `${n}th`;
const times = (n: number) => (n === 1 ? 'once' : n === 2 ? 'twice' : n === 3 ? 'three times' : `${n} times`);
const greats = (n: number) => (n <= 0 ? '' : n === 1 ? 'great-' : `${n}x great-`);
const word = (g: string | null, male: string, female: string, other: string) => (g === 'male' ? male : g === 'female' ? female : other);

/** Names `them` for me, where the shared ancestor is `dm` generations above me and `dt` above them. */
function bloodLabel(dm: number, dt: number, them: KinPerson, half: boolean): string {
  const g = them.gender;
  const h = half ? 'half-' : '';
  if (dm === 0 && dt === 0) return 'you';
  if (dm === 0) {
    const base = word(g, 'son', 'daughter', 'child');
    return dt === 1 ? base : `${greats(dt - 2)}grand${base}`;
  }
  if (dt === 0) {
    const base = word(g, 'father', 'mother', 'parent');
    return dm === 1 ? base : `${greats(dm - 2)}grand${base}`;
  }
  if (dm === 1 && dt === 1) return h + word(g, 'brother', 'sister', 'sibling');
  if (dm === 1) {
    const base = word(g, 'nephew', 'niece', 'nephew or niece');
    return h + (dt === 2 ? base : `${greats(dt - 2)}${base}`);
  }
  if (dt === 1) {
    const base = word(g, 'uncle', 'aunt', 'aunt or uncle');
    return h + (dm === 2 ? base : `${greats(dm - 2)}${base}`);
  }
  const degree = Math.min(dm, dt) - 1;
  const removed = Math.abs(dm - dt);
  return `${h}${ordinal(degree)} cousin${removed ? ` ${times(removed)} removed` : ''}`;
}

interface Blood { dm: number; dt: number; label: string; path: string[]; shared: string[]; dna: number }

function blood(me: KinPerson, them: KinPerson, byId: Map<string, KinPerson>): Blood | null {
  const mine = ancestors(me.id, byId);
  const theirs = ancestors(them.id, byId);
  let best: { dm: number; dt: number } | null = null;
  // Walk the smaller of the two ancestor lists (a person deep in a big tree has few ancestors; "me" may have thousands).
  const pairsOf = mine.size <= theirs.size
    ? [...mine].map(([id, dm]) => [dm, theirs.get(id)] as const)
    : [...theirs].map(([id, dt]) => [mine.get(id), dt] as const);
  for (const [dm, dt] of pairsOf) {
    if (dm === undefined || dt === undefined) continue;
    if (!best || dm + dt < best.dm + best.dt || (dm + dt === best.dm + best.dt && Math.abs(dm - dt) < Math.abs(best.dm - best.dt))) best = { dm, dt };
  }
  if (!best) return null;
  const shared = [...(mine.size <= theirs.size ? mine : theirs).keys()].filter((id) => mine.get(id) === best!.dm && theirs.get(id) === best!.dt);
  // Through one shared ancestor instead of a couple: half relatives. Only say "half" when both lines are fully known.
  const half = best.dm > 0 && best.dt > 0 && shared.length === 1 && hasBothParents(me.id, shared[0], byId) && hasBothParents(them.id, shared[0], byId);
  // Each shared ancestor passes on 0.5^(steps) of DNA. Assume a full couple unless we know it's a half relationship;
  // double cousins share four grandparents.
  const pairs = best.dm > 0 && best.dt > 0 ? (half ? 1 : Math.max(2, shared.length)) : 1;
  return {
    ...best,
    label: bloodLabel(best.dm, best.dt, them, half),
    path: [...lineTo(me.id, shared[0], byId), ...lineTo(them.id, shared[0], byId).reverse().slice(1)].map((id) => byId.get(id)!.name),
    shared,
    dna: pairs * 0.5 ** (best.dm + best.dt) * 100,
  };
}

// The child of the shared ancestor on this line must have two known parents for "half" to be certain.
function hasBothParents(from: string, ancestor: string, byId: Map<string, KinPerson>): boolean {
  const line = lineTo(from, ancestor, byId);
  const child = byId.get(line[line.length - 2] ?? '');
  return !!child && child.parentIds.filter((p) => byId.has(p)).length >= 2;
}

/** Ids from `from` up to `ancestor`, following the shortest parent line. */
function lineTo(from: string, ancestor: string, byId: Map<string, KinPerson>): string[] {
  const prev = new Map<string, string | null>([[from, null]]);
  let frontier = [from];
  while (frontier.length && !prev.has(ancestor)) {
    const next: string[] = [];
    for (const x of frontier) {
      for (const p of byId.get(x)?.parentIds ?? []) {
        if (!prev.has(p) && byId.has(p)) { prev.set(p, x); next.push(p); }
      }
    }
    frontier = next;
  }
  if (!prev.has(ancestor)) return [from];
  const out: string[] = [];
  for (let x: string | null = ancestor; x; x = prev.get(x) ?? null) out.push(x);
  return out.reverse();
}

const IN_LAW_THROUGH_SPOUSE: Record<string, (g: string | null) => string> = {
  father: () => 'father-in-law', mother: () => 'mother-in-law', parent: () => 'parent-in-law',
  brother: () => 'brother-in-law', sister: () => 'sister-in-law', sibling: () => 'sibling-in-law',
  son: () => 'stepson', daughter: () => 'stepdaughter', child: () => 'stepchild',
};
const SPOUSE_OF_RELATIVE: Record<string, (g: string | null) => string> = {
  brother: (g) => word(g, 'brother-in-law', 'sister-in-law', 'sibling-in-law'),
  sister: (g) => word(g, 'brother-in-law', 'sister-in-law', 'sibling-in-law'),
  sibling: (g) => word(g, 'brother-in-law', 'sister-in-law', 'sibling-in-law'),
  son: (g) => word(g, 'son-in-law', 'daughter-in-law', 'child-in-law'),
  daughter: (g) => word(g, 'son-in-law', 'daughter-in-law', 'child-in-law'),
  child: (g) => word(g, 'son-in-law', 'daughter-in-law', 'child-in-law'),
  father: (g) => word(g, 'stepfather', 'stepmother', 'step-parent'),
  mother: (g) => word(g, 'stepfather', 'stepmother', 'step-parent'),
  parent: (g) => word(g, 'stepfather', 'stepmother', 'step-parent'),
  uncle: (g) => word(g, 'uncle', 'aunt', 'aunt or uncle') + ' by marriage',
  aunt: (g) => word(g, 'uncle', 'aunt', 'aunt or uncle') + ' by marriage',
};

export function findRelationship(meId: string, themId: string, people: KinPerson[]): Relationship | null {
  const r = relate(meId, themId, people);
  return r && { ...r, gender: lookup(people).get(themId)?.gender ?? null };
}

function relate(meId: string, themId: string, people: KinPerson[]): Relationship | null {
  const byId = lookup(people);
  const me = byId.get(meId), them = byId.get(themId);
  if (!me || !them) return null;
  if (me.id === them.id) return { label: 'you', path: [me.name], sharedAncestors: [], dnaPercent: 100, kind: 'self' };

  const b = blood(me, them, byId);
  if (b) {
    return { label: b.label, path: b.path, sharedAncestors: b.shared.map((id) => byId.get(id)!.name), dnaPercent: Math.round(b.dna * 100) / 100, kind: 'blood' };
  }
  if (me.spouseIds.includes(them.id) || them.spouseIds.includes(me.id)) {
    return { label: word(them.gender, 'husband', 'wife', 'spouse'), path: [me.name, them.name], sharedAncestors: [], dnaPercent: null, kind: 'spouse' };
  }
  // Their spouse is my blood relative (my brother's wife, my son's husband...).
  for (const sid of them.spouseIds) {
    const s = byId.get(sid);
    const rel = s && blood(me, s, byId);
    if (!s || !rel) continue;
    const named = SPOUSE_OF_RELATIVE[rel.label.replace(/^half-/, '')];
    const label = named ? named(them.gender) : `${word(them.gender, 'husband', 'wife', 'spouse')} of your ${rel.label}`;
    return { label, path: [...rel.path, them.name], sharedAncestors: [], dnaPercent: null, kind: 'in-law' };
  }
  // They are my spouse's blood relative (my wife's mother, my husband's sister...).
  for (const sid of me.spouseIds) {
    const s = byId.get(sid);
    const rel = s && blood(s, them, byId);
    if (!s || !rel) continue;
    const named = IN_LAW_THROUGH_SPOUSE[rel.label.replace(/^half-/, '')];
    const label = named ? named(them.gender) : `your ${word(s.gender, 'husband', 'wife', 'spouse')}'s ${rel.label}`;
    return { label, path: [me.name, ...rel.path], sharedAncestors: [], dnaPercent: null, kind: 'in-law' };
  }
  // Step-siblings: one of their parents is married to one of my parents.
  for (const mp of me.parentIds) {
    const parent = byId.get(mp);
    for (const tp of them.parentIds) {
      if (parent && parent.spouseIds.includes(tp) && !me.parentIds.includes(tp)) {
        return { label: word(them.gender, 'stepbrother', 'stepsister', 'stepsibling'), path: [me.name, parent.name, byId.get(tp)!.name, them.name], sharedAncestors: [], dnaPercent: null, kind: 'in-law' };
      }
    }
  }
  // Married to my spouse's relative (my wife's brother's wife...).
  for (const sid of me.spouseIds) {
    const s = byId.get(sid);
    if (!s) continue;
    for (const tsid of them.spouseIds) {
      const ts = byId.get(tsid);
      const rel = ts && blood(s, ts, byId);
      if (!ts || !rel) continue;
      const sibling = /^(half-)?(brother|sister|sibling)$/.test(rel.label);
      const label = sibling ? word(them.gender, 'brother-in-law', 'sister-in-law', 'sibling-in-law')
        : `${word(them.gender, 'husband', 'wife', 'spouse')} of your ${word(s.gender, 'husband', 'wife', 'spouse')}'s ${rel.label}`;
      return { label, path: [me.name, ...rel.path, them.name], sharedAncestors: [], dnaPercent: null, kind: 'in-law' };
    }
  }
  // Anything further: find the shortest chain through parents, children and marriages.
  const chain = marriageChain(me.id, them.id, byId);
  return chain ? { label: 'relative by marriage', path: chain.map((id) => byId.get(id)!.name), sharedAncestors: [], dnaPercent: null, kind: 'in-law' } : null;
}

function marriageChain(from: string, to: string, byId: Map<string, KinPerson>): string[] | null {
  let children = childrenCache.get(byId);
  if (!children) {
    const built = new Map<string, string[]>();
    for (const p of byId.values()) for (const par of p.parentIds) { const list = built.get(par); if (list) list.push(p.id); else built.set(par, [p.id]); }
    childrenCache.set(byId, built);
    children = built;
  }
  const prev = new Map<string, string | null>([[from, null]]);
  let frontier = [from];
  for (let step = 0; step < 12 && frontier.length && !prev.has(to); step++) {
    const next: string[] = [];
    for (const x of frontier) {
      const p = byId.get(x)!;
      for (const n of [...p.parentIds, ...p.spouseIds, ...(children.get(x) ?? [])]) {
        if (byId.has(n) && !prev.has(n)) { prev.set(n, x); next.push(n); }
      }
    }
    frontier = next;
  }
  if (!prev.has(to)) return null;
  const out: string[] = [];
  for (let x: string | null = to; x; x = prev.get(x) ?? null) out.push(x);
  return out.reverse();
}

/** "Rosa is your great-grandmother" style sentence. Pass `meName` when "me" isn't the user, to get "Rosa is Juan's mother". */
export function describeRelationship(themName: string, r: Relationship | null, meName?: string): string {
  if (getLang() === 'fr') return describeRelationshipFr(themName, r, meName);
  const first = themName.split(' ')[0];
  const mine = meName ? `${meName.split(' ')[0]}'s` : 'your';
  if (!r) return `We couldn't find a link between ${meName ? meName.split(' ')[0] : 'you'} and ${first} in the tree yet.`;
  if (r.kind === 'self') return 'This is the same person.';
  if (r.label.startsWith('your ')) return `${first} is ${mine}${r.label.slice(4)}.`;
  const label = r.label.replace(/ of your /, ` of ${mine} `);
  return `${first} is ${/ of /.test(label) ? 'the' : mine} ${label}.`;
}

/** Groups a relationship name for simple filters (Parent, Sibling, Cousin...). */
export function relationCategory(label: string): string {
  const l = label.toLowerCase();
  if (/grand(father|mother|parent)/.test(l)) return 'Grandparent';
  if (/^(step)?(father|mother|parent)$/.test(l)) return 'Parent';
  if (/(brother|sister|sibling)$/.test(l) && !/in-law/.test(l)) return 'Sibling';
  if (/grand(son|daughter|child)/.test(l)) return 'Grandchild';
  if (/^(step)?(son|daughter|child)$/.test(l)) return 'Child';
  if (/cousin/.test(l)) return 'Cousin';
  if (/(aunt|uncle)/.test(l)) return 'Aunt/Uncle';
  if (/(husband|wife|spouse)$/.test(l)) return 'Spouse';
  return 'Other';
}
