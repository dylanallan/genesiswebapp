import { describe, expect, it } from 'vitest';
import { normalizeName, scoreMatch, soundex, verificationPrompt } from '../record-match';

const rosa = { name: 'Rosa María Vega', birthYear: 1902, deathYear: 1980, birthPlace: 'Oaxaca, Mexico', deathPlace: 'Los Angeles, California' };

describe('record matching', () => {
  it('normalizes names and matches spelling variants', () => {
    expect(normalizeName("José-María O'Néill")).toBe('josemaria oneill');
    expect(normalizeName('Łukasz Østergård Strauß')).toBe('lukasz ostergard strauss');
    expect(normalizeName('Иван Петров')).toBe('иван петров');
    expect(soundex('Smith')).toBe(soundex('Smyth'));
    expect(soundex('Meyer')).toBe(soundex('Maier'));
  });

  it('rates a record with matching name, dates and place as strong', () => {
    const r = scoreMatch(rosa, { title: 'Rosa Vega (1902–1980)', snippet: 'Born: Oaxaca, México', facts: { birthYear: 1902, deathYear: 1980, birthPlace: 'Oaxaca, México' } });
    expect(r.level).toBe('strong');
    expect(r.evidence.filter((e) => e.kind === 'conflict')).toEqual([]);
  });

  it('allows small date differences but flags real conflicts', () => {
    const close = scoreMatch(rosa, { title: 'Rosa Vega', facts: { birthYear: 1903 } });
    expect(close.evidence.some((e) => e.text.includes('within 1 year'))).toBe(true);
    const far = scoreMatch(rosa, { title: 'Rosa Vega', facts: { birthYear: 1950, birthPlace: 'Madrid, Spain' } });
    expect(far.evidence.filter((e) => e.kind === 'conflict').length).toBeGreaterThanOrEqual(2);
    expect(['weak', 'unlikely']).toContain(far.level);
  });

  it('recognises nicknames and sound-alike surnames', () => {
    const r = scoreMatch({ name: 'William Smith', birthYear: null, deathYear: null, birthPlace: null, deathPlace: null }, { title: 'Bill Smyth of Ontario' });
    expect(r.evidence.map((e) => e.text).join(' ')).toMatch(/variant or nickname/);
    expect(r.evidence.map((e) => e.text).join(' ')).toMatch(/sounds the same/);
  });

  it('does not treat ordinary words as sound-alike surnames', () => {
    const r = scoreMatch({ name: 'Ann Moore', birthYear: null, deathYear: null, birthPlace: null, deathPlace: null }, { title: 'A story about more letters', snippet: 'many more years later' });
    expect(r.evidence.map((e) => e.text).join(' ')).not.toMatch(/sounds the same/);
  });

  it('uses years in the text when there are no structured facts', () => {
    const outside = scoreMatch(rosa, { title: 'Vega family papers', snippet: 'Letters from 1750 and 1761' });
    expect(outside.evidence.some((e) => e.text.includes("outside this person's lifetime"))).toBe(true);
  });

  it('builds an explainer prompt that forbids invented facts', () => {
    const p = verificationPrompt(rosa, [{ title: 'Rosa Vega', source: 'WikiTree', url: 'https://x', result: scoreMatch(rosa, { title: 'Rosa Vega' }) }]);
    expect(p).toContain('Never invent facts');
    expect(p).toContain('Rosa María Vega, born 1902, in Oaxaca, Mexico');
  });
});
