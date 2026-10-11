import { describe, expect, it } from 'vitest';
import { exactDate, parseGedcom, toFamilyRows, toGedcom } from '../gedcom';

const SAMPLE = `0 HEAD
1 SOUR Ancestry.com Family Trees
2 NAME Ancestry.com Member Trees
1 CHAR UTF-8
0 @I1@ INDI
1 NAME José Luis /García/
2 GIVN José Luis
2 SURN García
1 SEX M
1 BIRT
2 DATE 12 MAR 1890
2 PLAC Oaxaca, México
1 DEAT
2 DATE ABT 1950
1 OCCU Farmer
1 NOTE Moved north in 1910
2 CONT and worked the railways.
1 FAMS @F1@
0 @I2@ INDI
1 NAME María /López/
1 SEX F
1 FAMS @F1@
0 @I3@ INDI
1 NAME Ana /García/
1 SEX F
1 BIRT
2 DATE 1 JAN 1920
1 FAMC @F1@
0 @F1@ FAM
1 HUSB @I1@
1 WIFE @I2@
1 CHIL @I3@
0 TRLR
`;

describe('gedcom', () => {
  it('reads people, dates, notes and family links', () => {
    const { people, familyCount, source } = parseGedcom(SAMPLE);
    expect(source).toBe('Ancestry.com Member Trees');
    expect(familyCount).toBe(1);
    expect(people).toHaveLength(3);
    const jose = people.find((p) => p.xref === '@I1@')!;
    expect(jose).toMatchObject({ firstName: 'José', middleName: 'Luis', lastName: 'García', gender: 'male', birthDate: '1890-03-12', birthPlace: 'Oaxaca, México', deathDate: null, isLiving: false, occupation: ['Farmer'] });
    expect(jose.notes).toEqual(['Died: ABT 1950', 'Moved north in 1910\nand worked the railways.']);
    expect(jose.spouses).toEqual(['@I2@']);
    expect(jose.children).toEqual(['@I3@']);
    expect(people.find((p) => p.xref === '@I3@')!.parents).toEqual(['@I1@', '@I2@']);
    expect(people.find((p) => p.xref === '@I2@')!.isLiving).toBe(true);
  });

  it('only keeps exact dates', () => {
    expect(exactDate('5 Jul 1901')).toBe('1901-07-05');
    expect(exactDate('31 FEB 1901')).toBeNull();
    expect(exactDate('ABT 1901')).toBeNull();
    expect(exactDate('JUL 1901')).toBeNull();
  });

  it('round-trips through rows and back to GEDCOM', () => {
    let n = 0;
    const rows = toFamilyRows(parseGedcom(SAMPLE).people, () => `id-${++n}`);
    expect(rows[2].parent_ids).toEqual(['id-1', 'id-2']);
    expect(rows[0].spouse_ids).toEqual(['id-2']);
    const again = parseGedcom(toGedcom(rows)).people;
    expect(again).toHaveLength(3);
    const ana = again.find((p) => p.firstName === 'Ana')!;
    expect(ana.birthDate).toBe('1920-01-01');
    expect(ana.parents).toHaveLength(2);
    const jose = again.find((p) => p.firstName === 'José')!;
    expect(jose.isLiving).toBe(false);
    expect(jose.notes.join('\n')).toContain('worked the railways');
  });
});
