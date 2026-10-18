// Checks a "when was this photo taken?" estimate before it is shown. It is always presented as a guess with a range.

export type Confidence = 'low' | 'medium' | 'high';

export interface PhotoDate {
  earliest: number;
  latest: number;
  confidence: Confidence;
  clues: string[];
  writtenDate?: string;
}

const FIRST_PHOTO_YEAR = 1839; // photography was announced that year

export function cleanEstimate(raw: unknown, thisYear = new Date().getFullYear()): PhotoDate | 'not-a-photo' | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (r.not_a_photo === true) return 'not-a-photo';
  let a = Math.round(Number(r.earliest));
  let b = Math.round(Number(r.latest));
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  if (a > b) [a, b] = [b, a];
  a = Math.max(a, FIRST_PHOTO_YEAR);
  b = Math.min(b, thisYear);
  if (a > b) return null;
  const confidence: Confidence = r.confidence === 'high' || r.confidence === 'medium' ? r.confidence : 'low';
  const clues = Array.isArray(r.clues)
    ? r.clues.filter((c): c is string => typeof c === 'string' && c.trim() !== '').map((c) => c.trim().slice(0, 200)).slice(0, 5)
    : [];
  const written = typeof r.written_date === 'string' ? r.written_date.trim().slice(0, 40) : '';
  return { earliest: a, latest: b, confidence, clues, ...(written ? { writtenDate: written } : {}) };
}

// The decade when the whole range is exactly one decade (1920 to 1929), so it can be shown as "the 1920s".
export function wholeDecade(d: Pick<PhotoDate, 'earliest' | 'latest'>): number | null {
  return d.earliest % 10 === 0 && d.latest === d.earliest + 9 ? d.earliest : null;
}
