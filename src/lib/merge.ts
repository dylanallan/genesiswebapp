// Helpers for merging two records of the same person. The database does the merge itself
// (merge_family_members); this decides which record to keep and suggests the best value for each detail.

export interface MergeRow {
  id: string;
  first_name: string | null; middle_name: string | null; last_name: string | null; gender: string | null;
  birth_date: string | null; birth_location: string | null; death_date: string | null; death_location: string | null;
  notes: string | null;
  parent_ids: string[] | null; spouse_ids: string[] | null; children_ids: string[] | null;
}

export type MergeField = 'first_name' | 'middle_name' | 'last_name' | 'gender' | 'birth_date' | 'birth_location' | 'death_date' | 'death_location' | 'notes';

export const MERGE_FIELDS: { key: MergeField; label: string }[] = [
  { key: 'first_name', label: 'First name' },
  { key: 'middle_name', label: 'Middle name' },
  { key: 'last_name', label: 'Last name' },
  { key: 'gender', label: 'Gender' },
  { key: 'birth_date', label: 'Born' },
  { key: 'birth_location', label: 'Birth place' },
  { key: 'death_date', label: 'Died' },
  { key: 'death_location', label: 'Place of death' },
  { key: 'notes', label: 'Notes' },
];

const filled = (v: string | null | undefined) => (v ?? '').trim() !== '';
const detail = (r: MergeRow) =>
  (r.parent_ids?.length ?? 0) + (r.spouse_ids?.length ?? 0) + (r.children_ids?.length ?? 0) +
  MERGE_FIELDS.filter((f) => filled(r[f.key])).length;

/** Keep the record with more family links and details, so fewer things have to move. */
export function chooseKeeper(a: MergeRow, b: MergeRow): [keep: MergeRow, remove: MergeRow] {
  return detail(b) > detail(a) ? [b, a] : [a, b];
}

// Imported trees often store "about 1900" as 1 January; a real day and month is more precise.
const vague = (d: string) => d.slice(4, 10) === '-01-01';

/** Which record's value to use for one detail: the filled one, the more exact date, or the longer place or note. */
export function suggestSide(field: MergeField, keep: MergeRow, remove: MergeRow): 'keep' | 'remove' {
  const k = keep[field], r = remove[field];
  if (!filled(r)) return 'keep';
  if (!filled(k)) return 'remove';
  if (field === 'birth_date' || field === 'death_date') {
    return vague(k!) && !vague(r!) && k!.slice(0, 4) === r!.slice(0, 4) ? 'remove' : 'keep';
  }
  if (field === 'birth_location' || field === 'death_location' || field === 'notes' || field === 'middle_name') {
    return r!.trim().length > k!.trim().length ? 'remove' : 'keep';
  }
  return 'keep';
}

export function suggestChoices(keep: MergeRow, remove: MergeRow): Record<MergeField, 'keep' | 'remove'> {
  return Object.fromEntries(MERGE_FIELDS.map((f) => [f.key, suggestSide(f.key, keep, remove)])) as Record<MergeField, 'keep' | 'remove'>;
}

/** The details to send to the database: every field, taken from whichever record was chosen. */
export function mergedFields(keep: MergeRow, remove: MergeRow, choices: Record<MergeField, 'keep' | 'remove'>): Record<MergeField, string> {
  return Object.fromEntries(MERGE_FIELDS.map((f) => [f.key, ((choices[f.key] === 'remove' ? remove : keep)[f.key] ?? '').trim()])) as Record<MergeField, string>;
}
