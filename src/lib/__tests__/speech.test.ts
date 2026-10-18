import { describe, it, expect } from 'vitest';
import { chunkForSpeech, pickVoice, speechLang } from '../speech';

describe('chunkForSpeech', () => {
  it('keeps short text whole', () => {
    expect(chunkForSpeech('Grandma Rosa was born in Oaxaca.')).toEqual(['Grandma Rosa was born in Oaxaca.']);
  });

  it('packs sentences up to the limit and breaks between them', () => {
    const text = 'One two three. Four five six! Seven eight nine? Ten.';
    const chunks = chunkForSpeech(text, 30);
    expect(chunks).toEqual(['One two three. Four five six!', 'Seven eight nine? Ten.']);
    expect(chunks.every((c) => c.length <= 30)).toBe(true);
  });

  it('never joins across paragraphs or line breaks', () => {
    expect(chunkForSpeech('Chapter one\n\nIt began in Québec.\nThen Montréal.')).toEqual(['Chapter one', 'It began in Québec.', 'Then Montréal.']);
  });

  it('splits a long sentence at commas, then between words, within the limit', () => {
    const long = 'Elle a grandi à Trois-Rivières, près du fleuve, avec ses sept frères et sœurs, ses parents et sa grand-mère qui racontait des histoires tous les soirs';
    const chunks = chunkForSpeech(long, 60);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.length <= 60)).toBe(true);
    expect(chunks.join(' ')).toBe(long);
  });

  it('cuts a single very long word', () => {
    const chunks = chunkForSpeech('x'.repeat(50), 20);
    expect(chunks).toEqual(['x'.repeat(20), 'x'.repeat(20), 'x'.repeat(10)]);
  });

  it('keeps every word, in order', () => {
    const text = 'Mr. Tremblay arrived in 1902. He worked the land… and later, in the mill! « Quelle vie ! » dit-il. ' + 'Word '.repeat(120);
    const chunks = chunkForSpeech(text, 80);
    expect(chunks.every((c) => c.length <= 80)).toBe(true);
    expect(chunks.join(' ').split(/\s+/)).toEqual(text.trim().split(/\s+/));
  });

  it('returns nothing for empty text', () => {
    expect(chunkForSpeech('  \n\n ')).toEqual([]);
  });
});

describe('speechLang', () => {
  it('follows the story language, then the app language', () => {
    expect(speechLang('en', 'fr')).toBe('fr-CA');
    expect(speechLang('fr', 'English')).toBe('en-CA');
    expect(speechLang('fr', 'Spanish')).toBe('fr-CA');
    expect(speechLang('en', null)).toBe('en-CA');
  });
});

describe('pickVoice', () => {
  const voices = [{ lang: 'en-US', name: 'a' }, { lang: 'fr-FR', name: 'b' }, { lang: 'fr_CA', name: 'c' }];
  it('prefers the Canadian voice, then the same language', () => {
    expect(pickVoice(voices, 'fr-CA')?.name).toBe('c');
    expect(pickVoice(voices, 'en-CA')?.name).toBe('a');
    expect(pickVoice([{ lang: 'de-DE' }], 'fr-CA')).toBeUndefined();
  });
});
