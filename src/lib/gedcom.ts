// GEDCOM is the standard family-tree file every genealogy site exports (Ancestry, MyHeritage,
// FamilySearch, Gramps...). This turns one into family_members rows and back again.

export interface GedcomPerson {
  xref: string; // e.g. "@I12@"
  firstName: string;
  middleName: string | null;
  lastName: string;
  gender: string | null;
  birthDate: string | null; // exact ISO date only
  birthPlace: string | null;
  deathDate: string | null;
  deathPlace: string | null;
  isLiving: boolean;
  occupation: string[];
  notes: string[]; // anything we could not store in a typed column, e.g. "Born: ABT 1890"
  parents: string[]; // xrefs
  spouses: string[];
  children: string[];
}

export interface GedcomParseResult {
  people: GedcomPerson[];
  familyCount: number;
  source: string | null; // program that wrote the file, e.g. "Ancestry.com Family Trees"
}

interface Node { level: number; xref: string | null; tag: string; value: string; children: Node[] }

const LINE = /^\s*(\d+)\s+(@[^@]+@\s+)?(\S+)(?:\s(.*))?$/;

function parseNodes(text: string): Node[] {
  const roots: Node[] = [];
  const stack: Node[] = [];
  for (const raw of text.replace(/^\uFEFF/, '').split(/\r\n|\r|\n/)) {
    const m = LINE.exec(raw);
    if (!m) continue;
    const node: Node = { level: Number(m[1]), xref: m[2]?.trim() ?? null, tag: m[3].toUpperCase(), value: m[4] ?? '', children: [] };
    // Long values are split over CONT (new line) and CONC (same line) records.
    if ((node.tag === 'CONT' || node.tag === 'CONC') && stack.length) {
      const parent = stack[Math.min(node.level - 1, stack.length - 1)];
      if (parent) parent.value += (node.tag === 'CONT' ? '\n' : '') + node.value;
      continue;
    }
    while (stack.length > node.level) stack.pop();
    if (node.level === 0) roots.push(node);
    else stack[stack.length - 1]?.children.push(node);
    stack[node.level] = node;
    stack.length = node.level + 1;
  }
  return roots;
}

const child = (n: Node, tag: string) => n.children.find((c) => c.tag === tag);
const all = (n: Node, tag: string) => n.children.filter((c) => c.tag === tag);
const clean = (s: string | undefined) => (s ?? '').replace(/\s+/g, ' ').trim();

const MONTHS: Record<string, string> = {
  JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
  JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
};

/** "12 MAR 1890" -> "1890-03-12". Anything less exact (ABT 1890, MAR 1890, BET ...) returns null. */
export function exactDate(value: string): string | null {
  const m = /^(\d{1,2})\s+([A-Z]{3})\s+(\d{4})$/i.exec(value.trim());
  if (!m) return null;
  const month = MONTHS[m[2].toUpperCase()];
  if (!month) return null;
  const day = m[1].padStart(2, '0');
  const iso = `${m[3]}-${month}-${day}`;
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.getUTCDate() !== Number(m[1]) ? null : iso;
}

/** "1890-03-12" -> "12 MAR 1890" */
export function gedcomDate(iso: string): string {
  const [y, mo, d] = iso.split('-');
  const month = Object.keys(MONTHS).find((k) => MONTHS[k] === mo);
  return month ? `${Number(d)} ${month} ${y}` : iso;
}

function splitName(n: Node | undefined): { first: string; middle: string | null; last: string } {
  if (!n) return { first: 'Unknown', middle: null, last: '' };
  const given = clean(child(n, 'GIVN')?.value);
  const surname = clean(child(n, 'SURN')?.value);
  const m = /^([^/]*)\/([^/]*)\/?(.*)$/.exec(n.value);
  const givenParts = (given || clean(m ? m[1] : n.value)).split(' ').filter(Boolean);
  const last = surname || clean(m?.[2]);
  return {
    first: givenParts.shift() ?? 'Unknown',
    middle: givenParts.length ? givenParts.join(' ') : null,
    last,
  };
}

export function parseGedcom(text: string): GedcomParseResult {
  const roots = parseNodes(text);
  const head = roots.find((r) => r.tag === 'HEAD');
  const source = head ? clean(child(child(head, 'SOUR') ?? head, 'NAME')?.value) || clean(child(head, 'SOUR')?.value) || null : null;

  const people = new Map<string, GedcomPerson>();
  for (const r of roots) {
    if (r.tag !== 'INDI' || !r.xref) continue;
    const name = splitName(child(r, 'NAME'));
    const notes: string[] = [];
    const event = (tag: string, label: string) => {
      const e = child(r, tag);
      const raw = clean(e && child(e, 'DATE')?.value);
      const iso = raw ? exactDate(raw) : null;
      if (raw && !iso) notes.push(`${label}: ${raw}`);
      return { date: iso, place: clean(e && child(e, 'PLAC')?.value) || null, present: !!e };
    };
    const birth = event('BIRT', 'Born');
    const death = event('DEAT', 'Died');
    const burial = child(r, 'BURI');
    for (const n of all(r, 'NOTE')) if (!n.value.startsWith('@') && n.value.trim()) notes.push(n.value.trim());
    const sex = clean(child(r, 'SEX')?.value).toUpperCase();
    people.set(r.xref, {
      xref: r.xref,
      firstName: name.first,
      middleName: name.middle,
      lastName: name.last,
      gender: sex === 'M' ? 'male' : sex === 'F' ? 'female' : null,
      birthDate: birth.date,
      birthPlace: birth.place,
      deathDate: death.date,
      deathPlace: death.place,
      isLiving: !death.present && !burial,
      occupation: all(r, 'OCCU').map((o) => clean(o.value)).filter(Boolean),
      notes,
      parents: [], spouses: [], children: [],
    });
  }

  let familyCount = 0;
  const link = (list: string[], xref: string) => { if (!list.includes(xref)) list.push(xref); };
  for (const r of roots) {
    if (r.tag !== 'FAM') continue;
    familyCount++;
    const partners = [child(r, 'HUSB')?.value, child(r, 'WIFE')?.value].map(clean).filter((x) => people.has(x));
    const kids = all(r, 'CHIL').map((c) => clean(c.value)).filter((x) => people.has(x));
    for (const p of partners) {
      for (const q of partners) if (q !== p) link(people.get(p)!.spouses, q);
      for (const k of kids) {
        link(people.get(p)!.children, k);
        link(people.get(k)!.parents, p);
      }
    }
  }

  return { people: [...people.values()], familyCount, source };
}

/** Rows ready for supabase.from('family_members').insert(), with fresh ids and links resolved. */
export function toFamilyRows(people: GedcomPerson[], newId: () => string = () => crypto.randomUUID()) {
  const ids = new Map(people.map((p) => [p.xref, newId()]));
  const map = (xrefs: string[]) => xrefs.map((x) => ids.get(x)!).filter(Boolean);
  return people.map((p) => ({
    id: ids.get(p.xref)!,
    first_name: p.firstName,
    middle_name: p.middleName,
    last_name: p.lastName,
    gender: p.gender,
    birth_date: p.birthDate,
    birth_location: p.birthPlace,
    death_date: p.deathDate,
    death_location: p.deathPlace,
    is_living: p.isLiving,
    occupation: p.occupation,
    notes: p.notes.length ? p.notes.join('\n') : null,
    relationship: null,
    source: 'user',
    confidence: 100,
    parent_ids: map(p.parents),
    spouse_ids: map(p.spouses),
    children_ids: map(p.children),
  }));
}

export interface ExportPerson {
  id: string;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  gender?: string | null;
  birth_date: string | null;
  birth_location: string | null;
  death_date: string | null;
  death_location: string | null;
  is_living?: boolean | null;
  notes: string | null;
  parent_ids: string[] | null;
  spouse_ids: string[] | null;
}

const gedLines = (level: number, tag: string, value: string) => {
  const [first, ...rest] = value.split('\n');
  return [`${level} ${tag} ${first}`.trimEnd(), ...rest.map((l) => `${level + 1} CONT ${l}`.trimEnd())];
};

/** Writes a GEDCOM 5.5.1 file that Ancestry, MyHeritage, FamilySearch and Gramps can all import. */
export function toGedcom(rows: ExportPerson[]): string {
  const xref = new Map(rows.map((r, i) => [r.id, `@I${i + 1}@`]));
  const out = ['0 HEAD', '1 SOUR GENESIS_HERITAGE', '2 NAME Genesis Heritage', '1 GEDC', '2 VERS 5.5.1', '2 FORM LINEAGE-LINKED', '1 CHAR UTF-8'];

  // A family is one couple (or single parent) plus their children.
  const families = new Map<string, { partners: string[]; children: string[] }>();
  const famKey = (ids: string[]) => [...ids].sort().join('+');
  for (const r of rows) {
    const parents = (r.parent_ids ?? []).filter((id) => xref.has(id));
    if (parents.length) {
      const key = famKey(parents);
      const fam = families.get(key) ?? { partners: parents, children: [] };
      fam.children.push(r.id);
      families.set(key, fam);
    }
    for (const s of r.spouse_ids ?? []) {
      if (!xref.has(s)) continue;
      const key = famKey([r.id, s]);
      if (!families.has(key)) families.set(key, { partners: [r.id, s], children: [] });
    }
  }
  const famXref = new Map([...families.keys()].map((k, i) => [k, `@F${i + 1}@`]));

  for (const r of rows) {
    out.push(`0 ${xref.get(r.id)} INDI`);
    const given = [r.first_name, r.middle_name].filter(Boolean).join(' ');
    out.push(`1 NAME ${given} /${r.last_name ?? ''}/`.replace(/\s+/g, ' '));
    if (r.gender === 'male' || r.gender === 'female') out.push(`1 SEX ${r.gender === 'male' ? 'M' : 'F'}`);
    if (r.birth_date || r.birth_location) {
      out.push('1 BIRT');
      if (r.birth_date) out.push(`2 DATE ${gedcomDate(r.birth_date)}`);
      if (r.birth_location) out.push(`2 PLAC ${r.birth_location}`);
    }
    if (r.death_date || r.death_location || r.is_living === false) {
      out.push(r.death_date || r.death_location ? '1 DEAT' : '1 DEAT Y');
      if (r.death_date) out.push(`2 DATE ${gedcomDate(r.death_date)}`);
      if (r.death_location) out.push(`2 PLAC ${r.death_location}`);
    }
    if (r.notes) out.push(...gedLines(1, 'NOTE', r.notes));
    for (const [key, f] of families) {
      if (f.children.includes(r.id)) out.push(`1 FAMC ${famXref.get(key)}`);
      if (f.partners.includes(r.id)) out.push(`1 FAMS ${famXref.get(key)}`);
    }
  }

  const genderOf = new Map(rows.map((r) => [r.id, r.gender]));
  for (const [key, f] of families) {
    out.push(`0 ${famXref.get(key)} FAM`);
    const [a, b] = f.partners;
    const aIsWife = genderOf.get(a) === 'female' || (b !== undefined && genderOf.get(b) === 'male');
    const [husb, wife] = aIsWife ? [b, a] : [a, b];
    if (husb) out.push(`1 HUSB ${xref.get(husb)}`);
    if (wife) out.push(`1 WIFE ${xref.get(wife)}`);
    for (const c of f.children) out.push(`1 CHIL ${xref.get(c)}`);
  }
  out.push('0 TRLR');
  return out.join('\n') + '\n';
}
