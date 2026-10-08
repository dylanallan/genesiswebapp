// Parses raw DNA exports (23andMe, AncestryDNA, MyHeritage, FamilyTreeDNA) into summary statistics.
// Runs entirely in the browser; genotypes never leave the device.

export interface DNASummary {
  format: string;
  fileName: string;
  build: string | null;
  totalMarkers: number;
  calledMarkers: number;
  callRate: number; // 0-1
  autosomalHeterozygosity: number | null; // share of called autosomal markers that are heterozygous
  yMarkersCalled: number;
  mtMarkersCalled: number;
  perChromosome: Record<string, number>;
  analyzedAt: string;
}

export const CHROM_ORDER = [...Array.from({ length: 22 }, (_, i) => String(i + 1)), 'X', 'Y', 'MT'];

function normalizeChrom(c: string): string | null {
  const v = c.trim().toUpperCase().replace(/^CHR/, '');
  if (v === '23') return 'X';
  if (v === '24') return 'Y';
  if (v === '25' || v === '26' || v === 'M' || v === 'MT') return 'MT';
  if (v === 'XY') return 'X'; // pseudo-autosomal region
  return CHROM_ORDER.includes(v) ? v : null;
}

// Supports 23andMe, AncestryDNA, MyHeritage and FamilyTreeDNA raw data exports.
export function analyzeRawDNA(text: string, fileName: string): DNASummary {
  const lines = text.split(/\r?\n/);
  const header = lines.slice(0, 40).join('\n');
  let format = 'Unknown raw data format';
  if (/23andMe/i.test(header)) format = '23andMe';
  else if (/AncestryDNA/i.test(header)) format = 'AncestryDNA';
  else if (/MyHeritage/i.test(header)) format = 'MyHeritage';
  else if (/RSID,CHROMOSOME,POSITION,RESULT/i.test(header.replace(/"/g, ''))) format = 'FamilyTreeDNA / MyHeritage (CSV)';
  const buildMatch = header.match(/build\s*(3[678])|GRCh(3[78])/i);
  const build = buildMatch ? `GRCh${buildMatch[1] ?? buildMatch[2]}` : null;

  const perChromosome: Record<string, number> = {};
  let total = 0, called = 0, autoCalled = 0, autoHet = 0, yCalled = 0, mtCalled = 0;

  for (const raw of lines) {
    if (!raw || raw.startsWith('#')) continue;
    const parts = raw.includes(',') ? raw.replace(/"/g, '').split(',') : raw.split(/\t|\s+/);
    if (parts.length < 4 || !/^(rs|i|vg|VG)\w*/i.test(parts[0])) continue; // skips header rows
    const chrom = normalizeChrom(parts[1]);
    if (!chrom) continue;
    // 23andMe/FTDNA: one genotype column ("AG"); AncestryDNA: two allele columns ("A","G").
    const genotype = (parts.length >= 5 ? parts[3] + parts[4] : parts[3]).trim().toUpperCase();
    total += 1;
    perChromosome[chrom] = (perChromosome[chrom] ?? 0) + 1;
    const isCall = /^[ACGTDI]{1,2}$/.test(genotype) && !/^(--|00|0)$/.test(genotype);
    if (!isCall) continue;
    called += 1;
    if (chrom === 'Y') yCalled += 1;
    else if (chrom === 'MT') mtCalled += 1;
    else if (chrom !== 'X' && genotype.length === 2) {
      autoCalled += 1;
      if (genotype[0] !== genotype[1]) autoHet += 1;
    }
  }

  if (total === 0) throw new Error('No genotype data found. Please choose the raw data file exported from your DNA testing company.');

  return {
    format, fileName, build,
    totalMarkers: total,
    calledMarkers: called,
    callRate: called / total,
    autosomalHeterozygosity: autoCalled ? autoHet / autoCalled : null,
    yMarkersCalled: yCalled,
    mtMarkersCalled: mtCalled,
    perChromosome,
    analyzedAt: new Date().toISOString(),
  };
}

