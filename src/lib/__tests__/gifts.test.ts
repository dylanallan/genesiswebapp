import { describe, expect, it } from 'vitest';
import { cleanGiftCode, formatGiftCode } from '../gifts';

describe('gift codes', () => {
  it('accepts codes however people type them', () => {
    expect(cleanGiftCode(' abcd-efgh jkmn ')).toBe('ABCDEFGHJKMN');
    expect(cleanGiftCode('ABCD–EFGH–JKMN')).toBe('ABCDEFGHJKMN');
  });
  it('shows codes in groups of four', () => {
    expect(formatGiftCode('ABCDEFGHJKMN')).toBe('ABCD-EFGH-JKMN');
    expect(formatGiftCode('abcd-efgh-jkmn')).toBe('ABCD-EFGH-JKMN');
  });
});
