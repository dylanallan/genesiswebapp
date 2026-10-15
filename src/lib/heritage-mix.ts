// "Where your family comes from": a heritage breakdown worked out from the tree, no DNA test needed.
// Each person is half their father's line and half their mother's. Following each line back, the share
// lands on the earliest known ancestor's birth country. A missing parent's half is "not yet known".

export interface MixPerson {
  id: string;
  name: string;
  birthPlace: string | null;
  parentIds: string[];
}

export interface MixShare { country: string; percent: number; ancestors: string[] }
export interface HeritageMix { shares: MixShare[]; unknown: number; generations: number }

const MAX_GEN = 12;

const ALIASES: Record<string, string> = {
  usa: 'United States', us: 'United States', 'u.s.a.': 'United States', 'u.s.': 'United States', 'united states of america': 'United States', america: 'United States',
  uk: 'United Kingdom', 'great britain': 'United Kingdom', britain: 'United Kingdom',
  méxico: 'Mexico', mexico: 'Mexico', españa: 'Spain', deutschland: 'Germany', italia: 'Italy', polska: 'Poland', éire: 'Ireland',
  'republic of ireland': 'Ireland', nederland: 'Netherlands', holland: 'Netherlands', 'the netherlands': 'Netherlands', sverige: 'Sweden', norge: 'Norway',
  danmark: 'Denmark', suomi: 'Finland', brasil: 'Brazil', perú: 'Peru', 'república dominicana': 'Dominican Republic', 'puerto rico': 'Puerto Rico',
  philippines: 'Philippines', pilipinas: 'Philippines', россия: 'Russia', 'russian empire': 'Russia', 'österreich': 'Austria', schweiz: 'Switzerland', suisse: 'Switzerland',
  'new zealand': 'New Zealand', 'south africa': 'South Africa', 'czech republic': 'Czechia', 'czechoslovakia': 'Czechia',
};

const CANADA = ['ontario', 'quebec', 'québec', 'nova scotia', 'new brunswick', 'manitoba', 'british columbia', 'prince edward island', 'saskatchewan', 'alberta',
  'newfoundland', 'newfoundland and labrador', 'yukon', 'northwest territories', 'nunavut', 'on', 'qc', 'ns', 'nb', 'mb', 'bc', 'pe', 'pei', 'sk', 'ab', 'nl'];
const US_STATES = ['alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois',
  'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska',
  'nevada', 'new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode island',
  'south carolina', 'south dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west virginia', 'wisconsin', 'wyoming', 'district of columbia',
  'al', 'ak', 'az', 'ar', 'ca', 'co', 'ct', 'de', 'fl', 'ga', 'hi', 'id', 'il', 'in', 'ia', 'ks', 'ky', 'la', 'me', 'md', 'ma', 'mi', 'mn', 'ms', 'mo', 'mt', 'ne',
  'nv', 'nh', 'nj', 'nm', 'ny', 'nc', 'nd', 'oh', 'ok', 'or', 'pa', 'ri', 'sc', 'sd', 'tn', 'tx', 'ut', 'vt', 'va', 'wa', 'wv', 'wi', 'wy', 'dc'];
// Georgia the country and Georgia the US state share a name; with nothing else to go on we pick the state.
// Likewise two-letter codes such as CA, DE or IN are read as US states and Canadian provinces first, because that is
// how North American records are usually written. Other common country codes are recognised below.
const COUNTRY_CODES: Record<string, string> = {
  gb: 'United Kingdom', ie: 'Ireland', fr: 'France', es: 'Spain', it: 'Italy', pl: 'Poland', mx: 'Mexico', br: 'Brazil', nl: 'Netherlands',
  au: 'Australia', nz: 'New Zealand', ph: 'Philippines', cn: 'China', jp: 'Japan', kr: 'South Korea', ru: 'Russia', ua: 'Ukraine', se: 'Sweden',
  no: 'Norway', dk: 'Denmark', fi: 'Finland', pt: 'Portugal', ch: 'Switzerland', at: 'Austria', be: 'Belgium', cu: 'Cuba', jm: 'Jamaica',
  ht: 'Haiti', vn: 'Vietnam', za: 'South Africa', ng: 'Nigeria', gh: 'Ghana', ke: 'Kenya', pk: 'Pakistan', bd: 'Bangladesh', lk: 'Sri Lanka',
  cl: 'Chile', ve: 'Venezuela', ec: 'Ecuador', gt: 'Guatemala', hn: 'Honduras', sv: 'El Salvador', cz: 'Czechia', hu: 'Hungary', ro: 'Romania',
  gr: 'Greece', tr: 'Turkey', lb: 'Lebanon', eg: 'Egypt', is: 'Iceland', lt: 'Lithuania', lv: 'Latvia', ee: 'Estonia', sk: 'Slovakia', hr: 'Croatia',
};

const titleCase = (s: string) => s.replace(/(^|[\s-])(\p{L})/gu, (_m, a: string, b: string) => a + b.toUpperCase());

/** The country part of a place such as "Cork, County Cork, Ireland" or "Toronto, ON". */
export function countryOf(place: string | null): string | null {
  if (!place) return null;
  const parts = place.split(',').map((p) => p.trim().replace(/\.$/, '')).filter(Boolean);
  if (!parts.length) return null;
  const last = parts[parts.length - 1].toLowerCase();
  if (ALIASES[last]) return ALIASES[last];
  if (CANADA.includes(last)) return 'Canada';
  if (US_STATES.includes(last)) return 'United States';
  if (last.length === 2 && COUNTRY_CODES[last]) return COUNTRY_CODES[last];
  if (/^\d+$/.test(last)) return null;
  return titleCase(parts[parts.length - 1]);
}

export function heritageMix(focusId: string, people: MixPerson[]): HeritageMix | null {
  const byId = new Map(people.map((p) => [p.id, p]));
  if (!byId.has(focusId)) return null;
  const share = new Map<string, { w: number; ancestors: Set<string> }>();
  let unknown = 0;
  let generations = 0;

  const walk = (id: string, weight: number, gen: number, line: Set<string>) => {
    const p = byId.get(id)!;
    generations = Math.max(generations, gen);
    const parents = p.parentIds.filter((x) => byId.has(x) && !line.has(x)).slice(0, 2);
    if (!parents.length || gen >= MAX_GEN) {
      const c = countryOf(p.birthPlace);
      if (!c) { unknown += weight; return; }
      const s = share.get(c) ?? { w: 0, ancestors: new Set<string>() };
      s.w += weight;
      s.ancestors.add(p.name);
      share.set(c, s);
      return;
    }
    const next = new Set(line).add(id);
    for (const x of parents) walk(x, weight / 2, gen + 1, next);
    if (parents.length === 1) unknown += weight / 2;
  };
  walk(focusId, 1, 0, new Set());

  const round = (n: number) => Math.round(n * 1000) / 10;
  const shares = [...share].map(([country, s]) => ({ country, percent: round(s.w), ancestors: [...s.ancestors] }))
    .sort((a, b) => b.percent - a.percent || a.country.localeCompare(b.country));
  return { shares, unknown: round(unknown), generations };
}
