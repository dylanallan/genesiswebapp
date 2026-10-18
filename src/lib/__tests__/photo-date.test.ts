import { describe, expect, it } from 'vitest';
import { cleanEstimate, wholeDecade } from '../photo-date';

describe('cleanEstimate', () => {
  it('keeps a sensible estimate', () => {
    expect(cleanEstimate({ earliest: 1920, latest: 1935, confidence: 'medium', clues: ['Drop-waist dresses', ' '], written_date: '' }, 2026)).toEqual({
      earliest: 1920, latest: 1935, confidence: 'medium', clues: ['Drop-waist dresses'],
    });
  });
  it('swaps a backwards range and keeps it between 1839 and this year', () => {
    expect(cleanEstimate({ earliest: 1950, latest: 1940, confidence: 'high', clues: [] }, 2026)).toMatchObject({ earliest: 1940, latest: 1950 });
    expect(cleanEstimate({ earliest: 1800, latest: 1860, confidence: 'low', clues: [] }, 2026)).toMatchObject({ earliest: 1839, latest: 1860 });
    expect(cleanEstimate({ earliest: 2020, latest: 2040, confidence: 'low', clues: [] }, 2026)).toMatchObject({ earliest: 2020, latest: 2026 });
  });
  it('treats an unknown confidence as low, and keeps a written date', () => {
    expect(cleanEstimate({ earliest: 1900, latest: 1910, confidence: 'certain', clues: [], written_date: 'Juin 1907' }, 2026)).toMatchObject({ confidence: 'low', writtenDate: 'Juin 1907' });
  });
  it('says when the picture is not a photo, and refuses nonsense', () => {
    expect(cleanEstimate({ not_a_photo: true })).toBe('not-a-photo');
    expect(cleanEstimate({ earliest: 'soon', latest: 1900 })).toBeNull();
    expect(cleanEstimate({ earliest: 1700, latest: 1750 })).toBeNull();
    expect(cleanEstimate(null)).toBeNull();
  });
});

describe('wholeDecade', () => {
  it('names a decade only when the range is exactly one', () => {
    expect(wholeDecade({ earliest: 1920, latest: 1929 })).toBe(1920);
    expect(wholeDecade({ earliest: 1925, latest: 1934 })).toBeNull();
    expect(wholeDecade({ earliest: 1920, latest: 1940 })).toBeNull();
  });
});
