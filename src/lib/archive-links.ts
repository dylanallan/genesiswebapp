// Free official archives that don't offer a search API. We link straight to their own search pages
// (never scrape them), pre-filled with the name the user typed where the site supports it.

export interface ArchiveLink { region: string; label: string; url: string; note?: string }

export function archiveLinks(name: string, place = '', year = ''): ArchiveLink[] {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const last = parts.length > 1 ? parts[parts.length - 1] : parts[0] ?? '';
  const first = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
  const e = encodeURIComponent;
  const fs = new URLSearchParams();
  if (first) fs.set('q.givenName', first);
  if (last) fs.set('q.surname', last);
  if (place) fs.set('q.anyPlace', place);
  if (year) { fs.set('q.birthLikeDate.from', String(Number(year) - 5)); fs.set('q.birthLikeDate.to', String(Number(year) + 5)); }
  return [
    { region: 'Worldwide', label: 'FamilySearch historical records', url: `https://www.familysearch.org/search/record/results?${fs}`, note: 'Free account. Strong for Latin America, Europe and North America.' },
    { region: 'Worldwide', label: 'Find a Grave memorials', url: `https://www.findagrave.com/memorial/search?firstname=${e(first)}&lastname=${e(last)}` },
    { region: 'Worldwide', label: 'Europeana (European archives)', url: `https://www.europeana.eu/en/search?query=${e(name)}` },
    { region: 'Canada', label: 'Library and Archives Canada', url: `https://recherche-collection-search.bac-lac.gc.ca/eng/Home/Result?q_any=${e(name)}`, note: 'Census, immigration, military and land records.' },
    { region: 'Canada', label: 'Canadiana (digitized Canadian history)', url: `https://www.canadiana.ca/search?q=${e(name)}` },
    { region: 'Canada', label: 'BAnQ – Quebec national archives', url: 'https://advitam.banq.qc.ca/' },
    { region: 'United States', label: 'US National Archives catalog', url: `https://catalog.archives.gov/search?q=${e(name)}` },
    { region: 'United Kingdom & Ireland', label: 'FreeBMD (England & Wales births, marriages, deaths)', url: 'https://www.freebmd.org.uk/' },
    { region: 'United Kingdom & Ireland', label: 'Irish Genealogy (civil and church records)', url: 'https://www.irishgenealogy.ie/' },
    { region: 'Spain & Latin America', label: 'PARES – Spanish archives (incl. colonial Americas)', url: 'https://pares.cultura.gob.es/' },
    { region: 'Australia', label: 'Trove (National Library of Australia)', url: `https://trove.nla.gov.au/search?keyword=${e(name)}` },
  ];
}
