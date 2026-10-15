import { describe, expect, it } from 'vitest';
import { pedigree, PedigreePerson } from '../pedigree';
import { lifeSpan, posterHtml, posterSvg } from '../tree-poster';

const p = (id: string, name: string, gender: string, parentIds: string[] = [], birthDate: string | null = null): PedigreePerson => ({
  id, name, gender, birthDate, deathDate: null, birthPlace: null, parentIds, childrenIds: [], spouseIds: [],
});

describe('tree poster', () => {
  const people = [p('me', 'Maya <Vega>', 'female', ['d', 'm'], '1990-01-01'), p('d', 'Luis Vega', 'male'), p('m', 'Ana & Co', 'female')];
  it('draws everyone with escaped names and only the generations that exist', () => {
    const svg = posterSvg(pedigree('me', people, 5));
    expect(svg).toContain('Maya &lt;Vega&gt;');
    expect(svg).toContain('Ana &amp; Co');
    expect(svg.match(/<g>/g)).toHaveLength(3);
    expect(svg.match(/<path /g)).toHaveLength(2);
  });
  it('makes a printable landscape page', () => {
    const html = posterHtml('The Vega <family>', pedigree('me', people, 5));
    expect(html).toContain('size: landscape');
    expect(html).toContain('The Vega &lt;family&gt;');
    expect(html).toContain('2 generations');
  });
  it('writes life spans', () => {
    expect(lifeSpan({ birthDate: '1902-01-01', deathDate: null })).toBe('b. 1902');
    expect(lifeSpan({ birthDate: null, deathDate: '1980-05-05' })).toBe('? – 1980');
    expect(lifeSpan({ birthDate: null, deathDate: null })).toBe('');
  });
});
