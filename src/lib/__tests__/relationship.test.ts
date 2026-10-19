import { describe, expect, it } from 'vitest';
import { describeRelationship, findRelationship, KinPerson } from '../relationship';

// Great-grandparents GG1+GG2 -> Gpa (m. Gma) and GreatAunt -> Dad (m. Mom) and Aunt / Cousin1 ... -> Me (m. Wife) -> Kid
const p = (id: string, gender: string | null, parentIds: string[] = [], spouseIds: string[] = []): KinPerson => ({ id, name: `${id} Test`, gender, parentIds, spouseIds });
const tree: KinPerson[] = [
  p('GG1', 'male', [], ['GG2']), p('GG2', 'female', [], ['GG1']),
  p('Gpa', 'male', ['GG1', 'GG2'], ['Gma']), p('Gma', 'female', [], ['Gpa']),
  p('GreatAunt', 'female', ['GG1', 'GG2']),
  p('Dad', 'male', ['Gpa', 'Gma'], ['Mom']), p('Mom', 'female', [], ['Dad']),
  p('Aunt', 'female', ['Gpa', 'Gma'], ['UncleInLaw']), p('UncleInLaw', 'male', [], ['Aunt']),
  p('Cousin', 'male', ['Aunt', 'UncleInLaw']), p('CousinKid', 'female', ['Cousin']),
  p('GreatAuntKid', 'male', ['GreatAunt']),
  p('Me', 'female', ['Dad', 'Mom'], ['Husband']), p('Husband', 'male', ['HusbandMum'], ['Me']), p('HusbandMum', 'female'),
  p('Brother', 'male', ['Dad', 'Mom'], ['BrotherWife']), p('BrotherWife', 'female', [], ['Brother']),
  p('HalfSis', 'female', ['Dad', 'OtherMom']), p('OtherMom', 'female', [], ['Dad']),
  p('Kid', null, ['Me', 'Husband']), p('Nephew', 'male', ['Brother', 'BrotherWife']),
];
const rel = (them: string, me = 'Me') => findRelationship(me, them, tree);

describe('relationship calculator', () => {
  it('names direct ancestors and descendants', () => {
    expect(rel('Dad')?.label).toBe('father');
    expect(rel('Gma')?.label).toBe('grandmother');
    expect(rel('GG2')?.label).toBe('great-grandmother');
    expect(rel('Kid')?.label).toBe('child');
    expect(rel('Me', 'GG1')?.label).toBe('great-granddaughter');
    expect(rel('Me', 'GG1')?.dnaPercent).toBe(12.5);
  });

  it('names siblings, aunts, nephews and cousins', () => {
    expect(rel('Brother')?.label).toBe('brother');
    expect(rel('Brother')?.dnaPercent).toBe(50);
    expect(rel('HalfSis')?.label).toBe('half-sister');
    expect(rel('HalfSis')?.dnaPercent).toBe(25);
    expect(rel('Aunt')?.label).toBe('aunt');
    expect(rel('GreatAunt')?.label).toBe('great-aunt');
    expect(rel('Nephew')?.label).toBe('nephew');
    expect(rel('Cousin')?.label).toBe('first cousin');
    expect(rel('Cousin')?.dnaPercent).toBe(12.5);
    expect(rel('CousinKid')?.label).toBe('first cousin once removed');
    expect(rel('GreatAuntKid')?.label).toBe('first cousin once removed');
    expect(rel('Cousin')?.sharedAncestors.sort()).toEqual(['Gma Test', 'Gpa Test']);
    expect(rel('Cousin')?.path).toEqual(['Me Test', 'Dad Test', 'Gpa Test', 'Aunt Test', 'Cousin Test']);
  });

  it('names spouses and in-laws', () => {
    expect(rel('Husband')?.label).toBe('husband');
    expect(rel('BrotherWife')?.label).toBe('sister-in-law');
    expect(rel('HusbandMum')?.label).toBe('mother-in-law');
    expect(rel('UncleInLaw')?.label).toBe('uncle by marriage');
    expect(rel('Mom', 'Gma')?.label).toBe('daughter-in-law');
    expect(rel('OtherMom')?.label).toBe('stepmother');
  });

  it('says so plainly when there is no link', () => {
    const r = findRelationship('Me', 'Nobody', [...tree, p('Nobody', 'male')]);
    expect(r).toBeNull();
    expect(describeRelationship('Nobody Test', r)).toMatch(/couldn't find a link/);
    expect(describeRelationship('Gma Test', rel('Gma'))).toBe('Gma is your grandmother.');
  });
});

describe('relationship sentences', () => {
  it('can describe from someone other than the user', () => {
    expect(describeRelationship('Dad Test', findRelationship('Gpa', 'Dad', tree), 'Gpa Test')).toBe("Dad is Gpa's son.");
    expect(describeRelationship('Joe Test', { label: 'wife of your second cousin', path: [], sharedAncestors: [], dnaPercent: null, kind: 'in-law' }, 'Ana B')).toBe("Joe is the wife of Ana's second cousin.");
  });
});

describe('DNA estimates', () => {
  it('assumes a full relationship when the other parent is just missing', () => {
    const t = [p('mom', 'female'), p('a', 'female', ['mom']), p('b', 'female', ['mom'])];
    expect(findRelationship('a', 'b', t)).toMatchObject({ label: 'sister', dnaPercent: 50 });
  });
  it('counts double first cousins', () => {
    const t = [p('g1', 'male'), p('g2', 'female'), p('g3', 'male'), p('g4', 'female'),
      p('b1', 'male', ['g1', 'g2']), p('s1', 'female', ['g3', 'g4']), p('b2', 'male', ['g1', 'g2']), p('s2', 'female', ['g3', 'g4']),
      p('x', 'male', ['b1', 's1']), p('y', 'female', ['b2', 's2'])];
    expect(findRelationship('x', 'y', t)).toMatchObject({ label: 'first cousin', dnaPercent: 25 });
  });
});

describe('step and distant in-law relatives', () => {
  const t = [
    p('dad', 'male', [], ['mom', 'step']), p('mom', 'female', [], ['dad']), p('step', 'female', ['sg'], ['dad']), p('sg', 'male'),
    p('me', 'male', ['dad', 'mom'], ['wife']), p('stepsis', 'female', ['step', 'other']), p('other', 'male'),
    p('wife', 'female', ['wd'], ['me']), p('wd', 'male'), p('wbro', 'male', ['wd'], ['wbrowife']), p('wbrowife', 'female', [], ['wbro']),
    p('stranger', 'male'),
  ];
  it('names step-siblings and a spouse\'s sibling\'s spouse', () => {
    expect(findRelationship('me', 'stepsis', t)).toMatchObject({ label: 'stepsister', path: ['me Test', 'dad Test', 'step Test', 'stepsis Test'] });
    expect(findRelationship('me', 'wbrowife', t)?.label).toBe('sister-in-law');
  });
  it('falls back to a chain of marriages for anything further', () => {
    expect(findRelationship('me', 'sg', t)).toMatchObject({ label: 'relative by marriage', kind: 'in-law' });
    expect(findRelationship('me', 'stranger', t)).toBeNull();
  });
});
