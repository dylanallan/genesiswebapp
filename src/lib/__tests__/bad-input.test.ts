// Things real people (and other programs) hand us: empty or broken files, odd names and dates, emoji, very long
// text. None of it may crash a tool, hang, or silently lose people.
import { describe, expect, it } from 'vitest';
import { decodeGedcom, exactDate, parseGedcom, toFamilyRows, toGedcom } from '../gedcom';
import { checkTree } from '../tree-checks';
import { countryOf, heritageMix } from '../heritage-mix';
import { familyFacts } from '../family-facts';
import { upcomingDays } from '../on-this-day';
import { findRelationship } from '../relationship';
import { suggestChoices, mergedFields } from '../merge';

const enc = (s: string) => new TextEncoder().encode(s).buffer as ArrayBuffer;

describe('importing broken or unusual family tree files', () => {
  it('copes with empty, blank and non-GEDCOM files', () => {
    for (const text of ['', '   \n\n', 'hello world', '<html><body>not a tree</body></html>', '{"json": true}']) {
      expect(parseGedcom(text).people).toEqual([]);
    }
  });

  it('copes with random bytes', () => {
    const bytes = new Uint8Array(5000).map((_, i) => (i * 7919) % 256);
    const { text } = decodeGedcom(bytes.buffer);
    expect(() => parseGedcom(text)).not.toThrow();
  });

  it('reads files from Windows, old Macs and with a byte-order mark', () => {
    const lines = ['0 HEAD', '0 @I1@ INDI', '1 NAME Rosa /Vega/', '0 TRLR'];
    for (const nl of ['\r\n', '\r', '\n']) {
      expect(parseGedcom(lines.join(nl)).people[0].firstName).toBe('Rosa');
    }
    expect(parseGedcom('﻿' + lines.join('\n')).people).toHaveLength(1);
  });

  it('keeps people with missing, odd or broken names', () => {
    const ged = [
      '0 HEAD',
      '0 @I1@ INDI',                                   // no name at all
      '0 @I2@ INDI', '1 NAME /Vega/',                  // surname only
      '0 @I3@ INDI', '1 NAME Mary',                    // no surname marker
      '0 @I4@ INDI', '1 NAME José María /de la Cruz/ Jr.',
      '0 @I5@ INDI', '1 NAME 李 /王/',
      '0 @I6@ INDI', '1 NAME Ana 🌹 /Ruiz/',
      '0 @I7@ INDI', `1 NAME ${'A'.repeat(5000)} /B/`,
      '0 @I8@ INDI', '1 NAME Unclosed /Slash',
      '0 TRLR',
    ].join('\n');
    const people = parseGedcom(ged).people;
    expect(people).toHaveLength(8);
    expect(people[1].lastName).toBe('Vega');
    expect(people[4].lastName).toBe('王');
    const rows = toFamilyRows(people, (() => { let n = 0; return () => `id-${n++}`; })());
    expect(rows).toHaveLength(8);
    for (const r of rows) expect(r.first_name.length).toBeLessThanOrEqual(5000);
  });

  it('ignores links to people and families that are not in the file', () => {
    const ged = ['0 @I1@ INDI', '1 NAME A /B/', '1 FAMC @F99@', '0 @F1@ FAM', '1 HUSB @I1@', '1 WIFE @I404@', '1 CHIL @I405@', '0 TRLR'].join('\n');
    const [p] = parseGedcom(ged).people;
    expect(p.spouses).toEqual([]);
    expect(p.children).toEqual([]);
  });

  it('turns only exact dates into dates and keeps the rest as notes', () => {
    expect(exactDate('12 MAR 1902')).toBe('1902-03-12');
    for (const vague of ['ABT 1850', 'BEF 1900', 'BET 1850 AND 1860', '1850?', 'Spring 1850', '31 FEB 1900', '0 JAN 1900', '', 'unknown']) {
      expect(exactDate(vague)).toBeNull();
    }
  });

  it('survives a person who is their own parent, and parent-child loops', () => {
    const ged = ['0 @I1@ INDI', '1 NAME A /B/', '0 @I2@ INDI', '1 NAME C /D/',
      '0 @F1@ FAM', '1 HUSB @I1@', '1 CHIL @I1@', '0 @F2@ FAM', '1 HUSB @I2@', '1 CHIL @I1@', '0 @F3@ FAM', '1 HUSB @I1@', '1 CHIL @I2@', '0 TRLR'].join('\n');
    const people = parseGedcom(ged).people;
    expect(people).toHaveLength(2);
    const rows = toFamilyRows(people, (() => { let n = 0; return () => `id-${n++}`; })());
    expect(() => toGedcom(rows.map((r) => ({ ...r, middle_name: null })) as never)).not.toThrow();
  });

  it('round-trips names with slashes, line breaks and accents', () => {
    const ged = toGedcom([{ id: 'a', first_name: 'Ana/María', middle_name: 'Line\nBreak', last_name: "O'Néill", gender: 'female', birth_date: '1900-01-02', birth_location: 'Kraków,\nPoland', death_date: null, death_location: null, is_living: false, notes: 'Two\nlines', parent_ids: [], spouse_ids: [] }]);
    const [p] = parseGedcom(ged).people;
    expect(p.lastName).toBe("O'Néill");
    expect(p.firstName).toBe('AnaMaría');
    expect(p.birthPlace).toBe('Kraków, Poland');
    expect(p.notes.join('\n')).toContain('Two\nlines');
  });

  it('decodes old-program files without garbling accents', () => {
    const latin1 = new Uint8Array([...'0 HEAD\n1 CHAR ANSI\n0 @I1@ INDI\n1 NAME Jos'].map((c) => c.charCodeAt(0)).concat([0xe9], [...' /M\n0 TRLR\n'].map((c) => c.charCodeAt(0))));
    const { text } = decodeGedcom(latin1.buffer);
    expect(parseGedcom(text).people[0].firstName).toBe('José');
    expect(parseGedcom(decodeGedcom(enc('0 @I1@ INDI\n1 NAME Zoë /Ünal/\n')).text).people[0].lastName).toBe('Ünal');
  });
});

describe('family tools with odd data', () => {
  const odd = [
    { id: 'a', name: '', firstName: '', lastName: '', gender: null, birthDate: '0000-00-00', deathDate: '9999-12-31', birthPlace: '   ', deathPlace: null, isLiving: null, parentIds: ['a', 'zzz'], spouseIds: ['a'], childrenIds: ['a'] },
    { id: 'b', name: '🌹', firstName: '🌹', lastName: '', gender: 'other', birthDate: '2999-01-01', deathDate: '1800-01-01', birthPlace: ',,,', deathPlace: null, isLiving: true, parentIds: [], spouseIds: [], childrenIds: [] },
    { id: 'c', name: 'Leap Day', firstName: 'Leap', lastName: 'Day', gender: 'female', birthDate: '1904-02-29', deathDate: null, birthPlace: 'Atlantis', deathPlace: null, isLiving: true, parentIds: [], spouseIds: [], childrenIds: [] },
  ];

  it('tree checkup, facts, heritage and upcoming days never throw', () => {
    expect(() => checkTree(odd)).not.toThrow();
    expect(() => familyFacts(odd)).not.toThrow();
    expect(() => heritageMix('a', odd)).not.toThrow();
    expect(() => upcomingDays(odd, new Date('2027-02-27'))).not.toThrow();
    expect(() => upcomingDays(odd, new Date('2028-02-27'))).not.toThrow();
    expect(() => findRelationship('a', 'b', odd)).not.toThrow();
    expect(() => findRelationship('a', 'missing', odd)).not.toThrow();
  });

  it('flags impossible dates', () => {
    const msgs = checkTree(odd).map((i) => i.message).join(' ');
    expect(msgs).toMatch(/future|before being born/);
  });

  it('remembers leap-day birthdays in non-leap years', () => {
    const days = upcomingDays(odd, new Date('2027-02-25'), 7);
    expect(days.some((d) => d.personId === 'c' || JSON.stringify(d).includes('Leap'))).toBe(true);
  });

  it('does not invent a country from junk place names', () => {
    for (const junk of ['', '   ', ',,,', 'Atlantis', '?', 'unknown', 'n/a', 'Cork', 'Irland']) expect(countryOf(junk)).toBeNull();
    // real and historic countries still count
    expect(countryOf('Danzig, Prussia')).toBe('Prussia');
    expect(countryOf('Lagos, Nigeria')).toBe('Nigeria');
    expect(countryOf('Kingston, Jamaica')).toBe('Jamaica');
    expect(countryOf('Cardiff, Wales')).toBe('Wales');
  });

  it('merges records with blank and very long values', () => {
    const base = { first_name: '', middle_name: null, last_name: 'X', gender: null, birth_date: null, birth_location: '   ', death_date: null, death_location: null, notes: 'n'.repeat(20000), parent_ids: null, spouse_ids: null, children_ids: null };
    const k = { ...base, id: 'k' }, r = { ...base, id: 'r', first_name: 'Ana' };
    const out = mergedFields(k, r, suggestChoices(k, r));
    expect(out.first_name).toBe('Ana');
    expect(out.birth_location).toBe('');
  });
});
