import { describe, expect, it } from 'vitest';
import { archiveLinks } from '../archive-links';

describe('archiveLinks', () => {
  const links = archiveLinks('Marie Joséphine Tremblay', 'Québec', '1840');
  const find = (label: string) => links.find((l) => l.label.startsWith(label))!;

  it('fills FamilySearch with given name, surname, place and a birth range', () => {
    const u = new URL(find('FamilySearch').url);
    expect(u.searchParams.get('q.givenName')).toBe('Marie Joséphine');
    expect(u.searchParams.get('q.surname')).toBe('Tremblay');
    expect(u.searchParams.get('q.anyPlace')).toBe('Québec');
    expect(u.searchParams.get('q.birthLikeDate.from')).toBe('1835');
    expect(u.searchParams.get('q.birthLikeDate.to')).toBe('1845');
  });
  it('fills Find a Grave and the keyword archives with the name', () => {
    const grave = new URL(find('Find a Grave').url);
    expect(grave.searchParams.get('firstname')).toBe('Marie Joséphine');
    expect(grave.searchParams.get('lastname')).toBe('Tremblay');
    expect(new URL(find('Canadiana').url).searchParams.get('q')).toBe('Marie Joséphine Tremblay');
    expect(new URL(find('Library and Archives Canada').url).searchParams.get('q_any')).toBe('Marie Joséphine Tremblay');
  });
  it('covers the big free Canadian, UK and grave databases', () => {
    for (const label of ['PRDH', 'BAnQ', 'Canadian Headstones', 'Library and Archives Canada census', 'FreeBMD', 'FreeCEN', 'BillionGraves', 'Geneanet', 'Open Archives']) {
      expect(find(label)?.url).toMatch(/^https:\/\//);
    }
    expect(find('PRDH').note).toMatch(/paid/);
  });
  it('handles a single name and no year', () => {
    const one = archiveLinks('Tremblay');
    const fs = new URL(one.find((l) => l.label.startsWith('FamilySearch'))!.url);
    expect(fs.searchParams.get('q.surname')).toBe('Tremblay');
    expect(fs.searchParams.has('q.givenName')).toBe(false);
    expect(fs.searchParams.has('q.birthLikeDate.from')).toBe(false);
  });
});
