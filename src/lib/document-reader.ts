// Checks what the document reader sends back and works out what can be added to a person in the tree.
// The person always sees and confirms each change; nothing here writes to the database.

export type DocKind = 'baptism' | 'birth' | 'marriage' | 'burial' | 'death' | 'census' | 'letter' | 'other';

export interface DocReading {
  kind: DocKind;
  language: string;
  transcription: string;
  translation: string;
  summary: string;
  date?: string;
  place?: string;
  people: { name: string; role: string }[];
  unclear: boolean;
}

export interface PersonFields {
  birth_date?: string | null;
  birth_location?: string | null;
  death_date?: string | null;
  death_location?: string | null;
  notes?: string | null;
}

const KINDS: DocKind[] = ['baptism', 'birth', 'marriage', 'burial', 'death', 'census', 'letter', 'other'];
const str = (v: unknown, max = 20000) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Accepts only the shape we asked for; anything else is dropped rather than shown.
export function cleanReading(raw: unknown): DocReading | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const transcription = str(r.transcription);
  if (!transcription) return null;
  const people = Array.isArray(r.people)
    ? r.people
        .map((p) => ({ name: str((p as Record<string, unknown>)?.name, 200), role: str((p as Record<string, unknown>)?.role, 100) }))
        .filter((p) => p.name)
        .slice(0, 40)
    : [];
  const rawDate = str(r.date, 20);
  return {
    kind: KINDS.includes(r.kind as DocKind) ? (r.kind as DocKind) : 'other',
    language: str(r.language, 60),
    transcription,
    translation: str(r.translation),
    summary: str(r.summary, 1000),
    // A full date must be a real one; a year or year-month is kept as written.
    date: fullDate(rawDate) ?? (/^\d{4}(-(0[1-9]|1[0-2]))?$/.test(rawDate) ? rawDate : undefined),
    place: str(r.place, 200) || undefined,
    people,
    unclear: r.unclear === true,
  };
}

// A complete, real calendar date (YYYY-MM-DD), or null. Partial dates can't go in a date column.
export function fullDate(s: string | undefined): string | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s ? s : null;
}

export interface Suggestion {
  field: keyof PersonFields;
  value: string;
}

// Facts that fill an empty field on the person. Existing facts are never overwritten.
// A baptism date is usually a day or two after birth, so it is only offered as the birth date with that caveat shown.
export function suggestFacts(reading: DocReading, person: PersonFields): Suggestion[] {
  const out: Suggestion[] = [];
  const date = fullDate(reading.date);
  const empty = (v: string | null | undefined) => !v || !String(v).trim();
  if (reading.kind === 'birth' || reading.kind === 'baptism') {
    if (date && empty(person.birth_date)) out.push({ field: 'birth_date', value: date });
    if (reading.place && empty(person.birth_location)) out.push({ field: 'birth_location', value: reading.place });
  }
  if (reading.kind === 'death' || reading.kind === 'burial') {
    if (date && empty(person.death_date)) out.push({ field: 'death_date', value: date });
    if (reading.place && empty(person.death_location)) out.push({ field: 'death_location', value: reading.place });
  }
  return out;
}

// The text added to the person's notes: the summary, the translation and the original, so nothing is lost.
export function notesEntry(reading: DocReading, labels: { title: string; translation: string; original: string }): string {
  const parts = [`${labels.title}${reading.date ? ` (${reading.date})` : ''}`, reading.summary];
  if (reading.translation && reading.translation !== reading.transcription) parts.push(`${labels.translation}:\n${reading.translation}`);
  parts.push(`${labels.original}:\n${reading.transcription}`);
  return parts.filter(Boolean).join('\n\n');
}

export function appendNotes(existing: string | null | undefined, entry: string): string {
  const prev = (existing ?? '').trim();
  return prev ? `${prev}\n\n---\n\n${entry}` : entry;
}
