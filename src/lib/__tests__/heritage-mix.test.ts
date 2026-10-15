import { describe, expect, it } from 'vitest';
import { countryOf, heritageMix, MixPerson } from '../heritage-mix';

const p = (id: string, birthPlace: string | null, parentIds: string[] = []): MixPerson => ({ id, name: id, birthPlace, parentIds });

describe('heritage mix', () => {
  it('reads the country from many ways of writing a place', () => {
    expect(countryOf('Cork, County Cork, Ireland')).toBe('Ireland');
    expect(countryOf('Toronto, ON')).toBe('Canada');
    expect(countryOf('Oaxaca, México')).toBe('Mexico');
    expect(countryOf('Boston, Massachusetts, USA')).toBe('United States');
    expect(countryOf('Boston, Massachusetts')).toBe('United States');
    expect(countryOf('glasgow, scotland')).toBe('Scotland');
    expect(countryOf('')).toBeNull();
    expect(countryOf(null)).toBeNull();
  });

  it('splits each generation in half and lands on the earliest known ancestors', () => {
    const tree = [
      p('me', 'Toronto, Ontario', ['dad', 'mum']),
      p('dad', 'Toronto, Canada', ['gf', 'gm']),
      p('gf', 'Cork, Ireland'), p('gm', 'Glasgow, Scotland'),
      p('mum', 'Oaxaca, México'),
    ];
    const mix = heritageMix('me', tree)!;
    expect(mix.shares).toEqual([
      { country: 'Mexico', percent: 50, ancestors: ['mum'] },
      { country: 'Ireland', percent: 25, ancestors: ['gf'] },
      { country: 'Scotland', percent: 25, ancestors: ['gm'] },
    ]);
    expect(mix.unknown).toBe(0);
    expect(mix.generations).toBe(2);
  });

  it('counts missing parents and missing places as not yet known', () => {
    const tree = [p('me', null, ['dad']), p('dad', null, ['gf', 'gm']), p('gf', 'Italia'), p('gm', null)];
    const mix = heritageMix('me', tree)!;
    expect(mix.shares).toEqual([{ country: 'Italy', percent: 25, ancestors: ['gf'] }]);
    expect(mix.unknown).toBe(75);
  });

  it('survives loops in bad data', () => {
    const tree = [p('a', 'Spain', ['b']), p('b', 'France', ['a'])];
    const mix = heritageMix('a', tree)!;
    expect(mix.shares).toEqual([{ country: 'France', percent: 50, ancestors: ['b'] }]);
    expect(heritageMix('missing', tree)).toBeNull();
  });
});
