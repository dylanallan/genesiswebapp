// The "how are we related" sentence in French. The calculator names relationships in English
// ("great-grandmother", "husband of your sister", "your wife's mother"); this turns those names into French with
// the right gender and articles: « Rosa est votre arrière-grand-mère. », « Paul est le mari de la sœur de Juan. »
import type { Relationship } from './relationship';

interface Noun { text: string; f: boolean }

const WORDS: Record<string, [string, boolean]> = {
  son: ['fils', false], daughter: ['fille', true], child: ['enfant', false],
  father: ['père', false], mother: ['mère', true], parent: ['parent', false],
  brother: ['frère', false], sister: ['sœur', true], sibling: ['frère ou sœur', false],
  nephew: ['neveu', false], niece: ['nièce', true], 'nephew or niece': ['neveu ou nièce', false],
  uncle: ['oncle', false], aunt: ['tante', true], 'aunt or uncle': ['oncle ou tante', false],
  husband: ['mari', false], wife: ['épouse', true], spouse: ['conjoint', false],
  'father-in-law': ['beau-père', false], 'mother-in-law': ['belle-mère', true], 'parent-in-law': ['beau-parent', false],
  'brother-in-law': ['beau-frère', false], 'sister-in-law': ['belle-sœur', true], 'sibling-in-law': ['beau-frère ou belle-sœur', false],
  'son-in-law': ['gendre', false], 'daughter-in-law': ['belle-fille', true], 'child-in-law': ['gendre ou belle-fille', false],
  stepson: ['beau-fils', false], stepdaughter: ['belle-fille', true], stepchild: ['enfant du conjoint', false],
  stepfather: ['beau-père', false], stepmother: ['belle-mère', true], 'step-parent': ['beau-parent', false],
  stepbrother: ['quasi-frère', false], stepsister: ['quasi-sœur', true], stepsibling: ['quasi-frère ou quasi-sœur', false],
  'relative by marriage': ['parent par alliance', false],
};

const GRAND: Record<string, [string, boolean]> = {
  son: ['petit-fils', false], daughter: ['petite-fille', true], child: ['petit-enfant', false],
  father: ['grand-père', false], mother: ['grand-mère', true], parent: ['grand-parent', false],
};

// "great-" count → French prefix: 1 arrière-, 2 arrière-arrière-, more as « 4x arrière- ».
const arriere = (n: number) => (n <= 0 ? '' : n <= 2 ? 'arrière-'.repeat(n) : `${n}x arrière-`);
const countGreats = (s: string): [number, string] => {
  const m = s.match(/^(?:(\d+)x great-|great-)?(.*)$/)!;
  return [m[1] ? Number(m[1]) : s.startsWith('great-') ? 1 : 0, m[2]];
};

/** One English relationship word (no "of your" parts) in French. */
export function frNoun(label: string, gender?: string | null): Noun {
  let rest = label, half = false, marriage = false;
  if (rest.endsWith(' by marriage')) { marriage = true; rest = rest.slice(0, -' by marriage'.length); }
  if (rest.startsWith('half-')) { half = true; rest = rest.slice(5); }
  const done = (text: string, f: boolean): Noun => ({ text: (half ? 'demi-' : '') + text + (marriage ? ' par alliance' : ''), f });

  const cousin = rest.match(/^(\w+) cousin(?: (once|twice|three times|(\d+) times) removed)?$/);
  if (cousin) {
    const n = ORDINALS.indexOf(cousin[1]) > 0 ? ORDINALS.indexOf(cousin[1]) : Number.parseInt(cousin[1], 10);
    const f = gender === 'female';
    const c = f ? 'cousine' : 'cousin';
    const base = n === 1 ? `${c} ${f ? 'germaine' : 'germain'}` : n === 2 ? `${c} ${f ? 'issue' : 'issu'} de germain` : `${c} au ${n}e degré`;
    const r = cousin[2] === 'once' ? 1 : cousin[2] === 'twice' ? 2 : cousin[2] === 'three times' ? 3 : Number(cousin[3] ?? 0);
    return done(r ? `${base}, à ${r === 1 ? 'une génération' : `${r} générations`} d’écart` : base, f);
  }

  const [greats, word] = countGreats(rest);
  if (word.startsWith('grand') && GRAND[word.slice(5)]) {
    const [text, f] = GRAND[word.slice(5)];
    return done(arriere(greats) + text, f);
  }
  if (WORDS[word]) {
    const [text, f] = WORDS[word];
    // great-nephew → petit-neveu, great-aunt → grand-tante, 2x great-aunt → arrière-grand-tante.
    if (greats && /^(nephew|niece|nephew or niece)$/.test(word)) return done(arriere(greats - 1) + (f ? 'petite-' : 'petit-') + text, f);
    if (greats && /^(uncle|aunt|aunt or uncle)$/.test(word)) return done(arriere(greats - 1) + 'grand-' + text, f);
    return done(arriere(greats) + text, f);
  }
  return done(label, false);
}

const ORDINALS = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
const startsVowel = (s: string) => /^[aeiouyhéèêàâîôû]/i.test(s);
const withArticle = (n: Noun) => (startsVowel(n.text) ? `l’${n.text}` : `${n.f ? 'la' : 'le'} ${n.text}`);
const ofArticle = (n: Noun) => (startsVowel(n.text) ? `de l’${n.text}` : n.f ? `de la ${n.text}` : `du ${n.text}`);

/** « Rosa est votre arrière-grand-mère. » — the French form of describeRelationship. */
export function describeRelationshipFr(themName: string, r: Relationship | null, meName?: string): string {
  const first = themName.split(' ')[0];
  const meFirst = meName?.split(' ')[0];
  if (!r) return `Nous n’avons pas encore trouvé de lien entre ${meFirst ?? 'vous'} et ${first} dans l’arbre.`;
  if (r.kind === 'self') return 'C’est la même personne.';

  // Outermost word first; the last one belongs to "me": [husband, sister] = the husband of my sister.
  const g = r.gender ?? null;
  let chain: Noun[];
  let m: RegExpMatchArray | null;
  if ((m = r.label.match(/^(husband|wife|spouse) of your (husband|wife|spouse)'s (.+)$/))) {
    chain = [frNoun(m[1]), frNoun(m[3]), frNoun(m[2])];
  } else if ((m = r.label.match(/^your (husband|wife|spouse)'s (.+)$/))) {
    chain = [frNoun(m[2], g), frNoun(m[1])];
  } else if ((m = r.label.match(/^(husband|wife|spouse) of your (.+)$/))) {
    chain = [frNoun(m[1]), frNoun(m[2])];
  } else {
    chain = [frNoun(r.label, g)];
  }

  if (chain.length === 1 && !meFirst) return `${first} est votre ${chain[0].text}.`;
  const last = chain[chain.length - 1];
  const owner = meFirst ? `${ofArticle(last)} de ${meFirst}` : `de votre ${last.text}`;
  const middle = chain.slice(1, -1).map(ofArticle);
  const parts = chain.length === 1 ? [withArticle(chain[0]), `de ${meFirst}`] : [withArticle(chain[0]), ...middle, owner];
  return `${first} est ${parts.join(' ')}.`;
}
