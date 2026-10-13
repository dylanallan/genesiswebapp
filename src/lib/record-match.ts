// Scores how well a found record matches a person in the tree, and says WHY: every point of agreement or
// conflict is listed as evidence, so people (and the AI explainer) can judge it instead of trusting a black box.

export interface MatchPerson {
  name: string;
  birthYear: number | null;
  deathYear: number | null;
  birthPlace: string | null;
  deathPlace: string | null;
}

export interface RecordFacts {
  title: string;
  snippet?: string;
  date?: string;
  facts?: { birthYear?: number | null; deathYear?: number | null; birthPlace?: string | null; deathPlace?: string | null };
}

export interface Evidence { kind: 'support' | 'conflict' | 'note'; text: string }
export interface MatchResult { score: number; level: 'strong' | 'possible' | 'weak' | 'unlikely'; evidence: Evidence[] }

const SPECIAL: Record<string, string> = { 'ł': 'l', 'ø': 'o', 'ß': 'ss', 'æ': 'ae', 'œ': 'oe', 'đ': 'd', 'þ': 'th', 'ð': 'd', 'ı': 'i' };

/** Lower-case, accents removed, punctuation dropped: "José-María O'Néill" -> "josemaria oneill". Other alphabets are kept. */
export function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[łøßæœđþðı]/g, (c) => SPECIAL[c] ?? c).normalize('NFD').replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\s]/gu, '').replace(/\s+/g, ' ').trim();
}

/** American Soundex, so spelling variants like Smith/Smyth or Meyer/Maier still match. */
export function soundex(word: string): string {
  const w = normalizeName(word).replace(/\s/g, '').toUpperCase();
  if (!w) return '';
  const codes: Record<string, string> = { B: '1', F: '1', P: '1', V: '1', C: '2', G: '2', J: '2', K: '2', Q: '2', S: '2', X: '2', Z: '2', D: '3', T: '3', L: '4', M: '5', N: '5', R: '6' };
  let out = w[0];
  let last = codes[w[0]] ?? '';
  for (const ch of w.slice(1)) {
    const code = codes[ch] ?? '';
    if (code && code !== last) out += code;
    if (ch !== 'H' && ch !== 'W') last = code;
  }
  return (out + '000').slice(0, 4);
}

const NICKNAMES: Record<string, string[]> = {
  william: ['bill', 'will', 'billy', 'wm'], robert: ['bob', 'rob', 'bobby'], elizabeth: ['liz', 'beth', 'betty', 'eliza', 'bess'],
  margaret: ['maggie', 'peggy', 'meg', 'marge'], john: ['jack', 'johnny', 'jno'], james: ['jim', 'jimmy', 'jas'],
  catherine: ['kate', 'kathy', 'cathy', 'kitty'], mary: ['molly', 'polly', 'mae', 'maria', 'marie'], richard: ['dick', 'rick'],
  charles: ['charlie', 'chas', 'chuck'], thomas: ['tom', 'tommy', 'thos'], joseph: ['joe', 'jos', 'jose'], francisco: ['paco', 'pancho'],
  jose: ['pepe', 'joseph'], guadalupe: ['lupe'], dolores: ['lola'], ignacio: ['nacho'], alexander: ['alex', 'sandy', 'alejandro'],
};
const sameGiven = (a: string, b: string) =>
  a === b || (NICKNAMES[a] ?? []).includes(b) || (NICKNAMES[b] ?? []).includes(a) || (a.length > 2 && b.length > 2 && (a.startsWith(b) || b.startsWith(a)));

/** Words that start with a capital letter in the original text (names, places), normalised. */
const nameWords = (raw: string) => (raw.match(/\p{Lu}[\p{L}'’-]*/gu) ?? []).map(normalizeName).filter(Boolean);

const YEAR = /\b(1[5-9]\d\d|20[0-2]\d)\b/g;
const words = (s: string | null | undefined) => new Set(normalizeName(s ?? '').split(' ').filter((w) => w.length > 2));

export function scoreMatch(person: MatchPerson, record: RecordFacts): MatchResult {
  const evidence: Evidence[] = [];
  let score = 0;
  const text = `${record.title} ${record.snippet ?? ''}`;
  const norm = normalizeName(text);

  // Names
  const parts = normalizeName(person.name).split(' ').filter(Boolean);
  const surname = parts.length > 1 ? parts[parts.length - 1] : parts[0] ?? '';
  const given = parts.length > 1 ? parts[0] : '';
  const recordWords = norm.split(' ');
  if (surname && recordWords.includes(surname)) { score += 30; evidence.push({ kind: 'support', text: `Surname "${surname}" matches exactly.` }); }
  // Sound-alike matching only against capitalised, name-like words, so "Moore" doesn't match the word "more".
  else if (surname && soundex(surname) && nameWords(text).some((w) => w.length >= 3 && soundex(w) === soundex(surname))) {
    score += 18; evidence.push({ kind: 'support', text: `Surname sounds the same (a spelling variant of "${surname}").` });
  } else if (surname) { score -= 25; evidence.push({ kind: 'conflict', text: `Surname "${surname}" does not appear.` }); }
  if (given) {
    if (recordWords.includes(given)) { score += 20; evidence.push({ kind: 'support', text: `First name "${given}" matches.` }); }
    else if (recordWords.some((w) => sameGiven(w, given))) { score += 12; evidence.push({ kind: 'support', text: `First name is a known variant or nickname of "${given}".` }); }
    else { score -= 10; evidence.push({ kind: 'conflict', text: `First name "${given}" does not appear.` }); }
  }

  // Dates: structured facts first, otherwise years mentioned in the text.
  const facts = record.facts ?? {};
  const compareYear = (label: string, mine: number | null, theirs: number | null | undefined) => {
    if (!mine || !theirs) return;
    const diff = Math.abs(mine - theirs);
    if (diff === 0) { score += 20; evidence.push({ kind: 'support', text: `${label} year ${theirs} matches exactly.` }); }
    else if (diff <= 2) { score += 12; evidence.push({ kind: 'support', text: `${label} year ${theirs} is within ${diff} year${diff > 1 ? 's' : ''} (common in old records).` }); }
    else if (diff <= 5) { score += 2; evidence.push({ kind: 'note', text: `${label} year ${theirs} differs by ${diff} years.` }); }
    else { score -= 25; evidence.push({ kind: 'conflict', text: `${label} year ${theirs} is ${diff} years away from ${mine}.` }); }
  };
  compareYear('Birth', person.birthYear, facts.birthYear);
  compareYear('Death', person.deathYear, facts.deathYear);
  if (facts.birthYear == null && facts.deathYear == null) {
    const years = [...text.matchAll(YEAR)].map((m) => Number(m[1]));
    const recordYear = record.date ? Number(record.date.slice(0, 4)) || null : null;
    if (recordYear) years.push(recordYear);
    const lifeStart = person.birthYear ?? (person.deathYear ? person.deathYear - 100 : null);
    const lifeEnd = person.deathYear ?? (person.birthYear ? person.birthYear + 100 : null);
    if (person.birthYear && years.some((y) => Math.abs(y - person.birthYear!) <= 1)) { score += 10; evidence.push({ kind: 'support', text: `Mentions a year close to the birth year (${person.birthYear}).` }); }
    else if (lifeStart && lifeEnd && years.length && years.every((y) => y < lifeStart - 5 || y > lifeEnd + 5)) {
      score -= 15; evidence.push({ kind: 'conflict', text: `Its dates (${[...new Set(years)].slice(0, 3).join(', ')}) fall outside this person's lifetime.` });
    }
  }

  // Places: any shared place word (town, region or country).
  const comparePlace = (label: string, mine: string | null, theirs: string | null | undefined) => {
    if (!mine) return;
    const a = words(mine);
    const shared = [...words(theirs ?? text)].filter((w) => a.has(w));
    if (shared.length) { score += theirs ? 15 : 8; evidence.push({ kind: 'support', text: `${label} place matches: ${shared.slice(0, 3).join(', ')}.` }); }
    else if (theirs) { score -= 8; evidence.push({ kind: 'conflict', text: `${label} place "${theirs}" differs from "${mine}".` }); }
  };
  comparePlace('Birth', person.birthPlace, facts.birthPlace);
  if (facts.deathPlace) comparePlace('Death', person.deathPlace, facts.deathPlace);

  score = Math.max(0, Math.min(100, score));
  const conflicts = evidence.filter((e) => e.kind === 'conflict').length;
  const level = score >= 70 && conflicts === 0 ? 'strong' : score >= 45 ? 'possible' : score >= 25 ? 'weak' : 'unlikely';
  return { score, level, evidence };
}

/** Prompt for the AI explainer: it must reason only from the evidence given and say what would confirm it. */
export function verificationPrompt(person: MatchPerson, findings: Array<{ title: string; source: string; url: string; result: MatchResult }>): string {
  const me = [person.name, person.birthYear && `born ${person.birthYear}`, person.birthPlace && `in ${person.birthPlace}`,
    person.deathYear && `died ${person.deathYear}`, person.deathPlace && `in ${person.deathPlace}`].filter(Boolean).join(', ');
  const list = findings.slice(0, 8).map((f, i) =>
    `${i + 1}. "${f.title}" (${f.source}) score ${f.result.score}/100 [${f.result.level}]\n   ${f.result.evidence.map((e) => `${e.kind}: ${e.text}`).join('\n   ')}`).join('\n');
  return [
    `You are a careful professional genealogist. A family historian is researching: ${me}.`,
    'Below are records found in public archives, each with an automatic match score and the evidence for and against.',
    'In plain, friendly language for a non-expert:',
    '1. Say which records are most likely about this same person and why, and which are probably someone else.',
    '2. Point out any conflicts (different dates or places) and what could explain them (spelling, record errors, a different person).',
    '3. Suggest the 2-3 most useful next steps to confirm or rule out the best matches (specific record types and places to check).',
    'Use ONLY the information below. Never invent facts. Keep it under 250 words, no tables.',
    '',
    list,
  ].join('\n');
}
