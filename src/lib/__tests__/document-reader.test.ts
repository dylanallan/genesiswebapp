import { describe, expect, it } from 'vitest';
import { appendNotes, cleanReading, fullDate, notesEntry, suggestFacts } from '../document-reader';

const baptism = {
  kind: 'baptism', language: 'French', unclear: false,
  transcription: 'Le douze mars mil huit cent quarante, nous prêtre soussigné avons baptisé Marie Joséphine…',
  translation: 'On 12 March 1840, I, the undersigned priest, baptised Marie Joséphine…',
  summary: 'The baptism of Marie Joséphine Tremblay in Saint-Roch.',
  date: '1840-03-12', place: 'Saint-Roch de Québec',
  people: [{ name: 'Marie Joséphine Tremblay', role: 'child' }, { name: 'Joseph Tremblay', role: 'father' }, { name: '', role: 'witness' }],
};

describe('cleanReading', () => {
  it('keeps a good reading and drops nameless people', () => {
    const r = cleanReading(baptism)!;
    expect(r.kind).toBe('baptism');
    expect(r.date).toBe('1840-03-12');
    expect(r.people.map((p) => p.name)).toEqual(['Marie Joséphine Tremblay', 'Joseph Tremblay']);
  });
  it('refuses anything without a transcription', () => {
    expect(cleanReading(null)).toBeNull();
    expect(cleanReading('text')).toBeNull();
    expect(cleanReading({ ...baptism, transcription: '  ' })).toBeNull();
  });
  it('turns an unknown kind into "other" and ignores a bad people list', () => {
    const r = cleanReading({ ...baptism, kind: 'spaceship', people: 'nope' })!;
    expect(r.kind).toBe('other');
    expect(r.people).toEqual([]);
  });
  it('keeps a year or a year-month, but not an impossible or messy date', () => {
    expect(cleanReading({ ...baptism, date: '1840' })!.date).toBe('1840');
    expect(cleanReading({ ...baptism, date: '1840-03' })!.date).toBe('1840-03');
    expect(cleanReading({ ...baptism, date: '1840-02-30' })!.date).toBeUndefined();
    expect(cleanReading({ ...baptism, date: 'March 1840' })!.date).toBeUndefined();
    expect(cleanReading({ ...baptism, date: '1840-13' })!.date).toBeUndefined();
  });
});

describe('fullDate', () => {
  it('accepts only real calendar dates', () => {
    expect(fullDate('1900-02-28')).toBe('1900-02-28');
    expect(fullDate('1900-02-29')).toBeNull(); // 1900 was not a leap year
    expect(fullDate('1840')).toBeNull();
    expect(fullDate(undefined)).toBeNull();
  });
});

describe('suggestFacts', () => {
  const r = cleanReading(baptism)!;
  it('fills an empty birth date and place from a baptism', () => {
    expect(suggestFacts(r, {})).toEqual([
      { field: 'birth_date', value: '1840-03-12' },
      { field: 'birth_location', value: 'Saint-Roch de Québec' },
    ]);
  });
  it('never overwrites what is already there', () => {
    expect(suggestFacts(r, { birth_date: '1840-03-11', birth_location: 'Québec' })).toEqual([]);
  });
  it('fills death facts from a burial, and nothing from a letter or a partial date', () => {
    const burial = cleanReading({ ...baptism, kind: 'burial', date: '1901-11-02' })!;
    expect(suggestFacts(burial, {}).map((s) => s.field)).toEqual(['death_date', 'death_location']);
    expect(suggestFacts(cleanReading({ ...baptism, kind: 'letter' })!, {})).toEqual([]);
    expect(suggestFacts(cleanReading({ ...baptism, date: '1840', place: '' })!, {})).toEqual([]);
  });
});

describe('notes', () => {
  const r = cleanReading(baptism)!;
  const labels = { title: 'From a baptism record', translation: 'Translation', original: 'Original text' };
  it('keeps the summary, translation and original', () => {
    const entry = notesEntry(r, labels);
    expect(entry).toContain('From a baptism record (1840-03-12)');
    expect(entry).toContain('Translation:\nOn 12 March 1840');
    expect(entry).toContain('Original text:\nLe douze mars');
  });
  it('adds below existing notes', () => {
    expect(appendNotes('', 'B')).toBe('B');
    expect(appendNotes('A', 'B')).toBe('A\n\n---\n\nB');
  });
});
