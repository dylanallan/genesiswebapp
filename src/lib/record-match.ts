// Scores how well a found record matches a person in the tree, and says WHY: every point of agreement or
// conflict is listed as evidence, so people (and the AI explainer) can judge it instead of trusting a black box.
import type { AITask } from '../api/chat';
import { t } from './i18n';

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
  const shown = person.name.trim().split(/\s+/); // original spelling, for the evidence wording
  const surnameShown = shown.length > 1 ? shown[shown.length - 1] : shown[0] ?? surname;
  const givenShown = shown.length > 1 ? shown[0] : given;
  const recordWords = norm.split(' ');
  if (surname && recordWords.includes(surname)) { score += 30; evidence.push({ kind: 'support', text: t('Surname “{name}” matches exactly.', { name: surnameShown }) }); }
  // Sound-alike matching only against capitalised, name-like words, so "Moore" doesn't match the word "more".
  else if (surname && soundex(surname) && nameWords(text).some((w) => w.length >= 3 && soundex(w) === soundex(surname))) {
    score += 18; evidence.push({ kind: 'support', text: t('Surname sounds the same (a spelling variant of “{name}”).', { name: surnameShown }) });
  } else if (surname) { score -= 25; evidence.push({ kind: 'conflict', text: t('Surname “{name}” does not appear.', { name: surnameShown }) }); }
  if (given) {
    if (recordWords.includes(given)) { score += 20; evidence.push({ kind: 'support', text: t('First name “{name}” matches.', { name: givenShown }) }); }
    else if (recordWords.some((w) => sameGiven(w, given))) { score += 12; evidence.push({ kind: 'support', text: t('First name is a known variant or nickname of “{name}”.', { name: givenShown }) }); }
    else { score -= 10; evidence.push({ kind: 'conflict', text: t('First name “{name}” does not appear.', { name: givenShown }) }); }
  }

  // Dates: structured facts first, otherwise years mentioned in the text.
  const facts = record.facts ?? {};
  const compareYear = (label: string, mine: number | null, theirs: number | null | undefined) => {
    if (!mine || !theirs) return;
    const diff = Math.abs(mine - theirs);
    if (diff === 0) { score += 20; evidence.push({ kind: 'support', text: t('{label} year {year} matches exactly.', { label: t(label), year: theirs }) }); }
    else if (diff <= 2) { score += 12; evidence.push({ kind: 'support', text: diff > 1 ? t('{label} year {year} is within {n} years (common in old records).', { label: t(label), year: theirs, n: diff }) : t('{label} year {year} is within 1 year (common in old records).', { label: t(label), year: theirs }) }); }
    else if (diff <= 5) { score += 2; evidence.push({ kind: 'note', text: t('{label} year {year} differs by {n} years.', { label: t(label), year: theirs, n: diff }) }); }
    else { score -= 25; evidence.push({ kind: 'conflict', text: t('{label} year {year} is {n} years away from {mine}.', { label: t(label), year: theirs, n: diff, mine }) }); }
  };
  compareYear('Birth', person.birthYear, facts.birthYear);
  compareYear('Death', person.deathYear, facts.deathYear);
  if (facts.birthYear == null && facts.deathYear == null) {
    const years = [...text.matchAll(YEAR)].map((m) => Number(m[1]));
    const recordYear = record.date ? Number(record.date.slice(0, 4)) || null : null;
    if (recordYear) years.push(recordYear);
    const lifeStart = person.birthYear ?? (person.deathYear ? person.deathYear - 100 : null);
    const lifeEnd = person.deathYear ?? (person.birthYear ? person.birthYear + 100 : null);
    if (person.birthYear && years.some((y) => Math.abs(y - person.birthYear!) <= 1)) { score += 10; evidence.push({ kind: 'support', text: t('Mentions a year close to the birth year ({year}).', { year: person.birthYear }) }); }
    else if (lifeStart && lifeEnd && years.length && years.every((y) => y < lifeStart - 5 || y > lifeEnd + 5)) {
      score -= 15; evidence.push({ kind: 'conflict', text: t('Its dates ({years}) fall outside this person’s lifetime.', { years: [...new Set(years)].slice(0, 3).join(', ') }) });
    }
  }

  // Places: any shared place word (town, region or country).
  const comparePlace = (label: string, mine: string | null, theirs: string | null | undefined) => {
    if (!mine) return;
    const a = words(mine);
    const shared = [...words(theirs ?? text)].filter((w) => a.has(w));
    if (shared.length) {
      score += theirs ? 15 : 8;
      evidence.push({ kind: 'support', text: theirs ? t('{label} place “{theirs}” matches “{mine}”.', { label: t(label), theirs, mine }) : t('Mentions {place}.', { place: mine }) });
    }
    else if (theirs) { score -= 8; evidence.push({ kind: 'conflict', text: t('{label} place “{theirs}” differs from “{mine}”.', { label: t(label), theirs, mine }) }); }
  };
  comparePlace('Birth', person.birthPlace, facts.birthPlace);
  if (facts.deathPlace) comparePlace('Death', person.deathPlace, facts.deathPlace);

  score = Math.max(0, Math.min(100, score));
  const conflicts = evidence.filter((e) => e.kind === 'conflict').length;
  const level = score >= 70 && conflicts === 0 ? 'strong' : score >= 45 ? 'possible' : score >= 25 ? 'weak' : 'unlikely';
  return { score, level, evidence };
}

/** The record explainer job: who is being researched and each record with its score and evidence. */
export function verificationRequest(person: MatchPerson, findings: Array<{ title: string; source: string; url: string; result: MatchResult }>): AITask {
  const subject = [person.name, person.birthYear && `born ${person.birthYear}`, person.birthPlace && `in ${person.birthPlace}`,
    person.deathYear && `died ${person.deathYear}`, person.deathPlace && `in ${person.deathPlace}`].filter(Boolean).join(', ');
  const records = findings.slice(0, 8).map((f, i) =>
    `${i + 1}. "${f.title}" (${f.source}) score ${f.result.score}/100 [${f.result.level}]\n   ${f.result.evidence.map((e) => `${e.kind}: ${e.text}`).join('\n   ')}`).join('\n');
  return { task: 'record_explain', input: { subject, records: records.slice(0, 6000) } };
}
