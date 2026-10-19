import { describe, expect, it } from 'vitest';
import { WEEKLY_QUESTIONS, opensOn, questionsOpen } from '../weekly-questions';

describe('weekly questions', () => {
  it('has a year of questions, each in both languages', () => {
    expect(WEEKLY_QUESTIONS.length).toBe(52);
    for (const q of WEEKLY_QUESTIONS) { expect(q.en.trim()).not.toBe(''); expect(q.fr.trim()).not.toBe(''); expect(q.fr).not.toBe(q.en); }
    expect(new Set(WEEKLY_QUESTIONS.map((q) => q.en)).size).toBe(52);
  });
  it('opens one question on the start day, then one more each week', () => {
    const day = (s: string) => new Date(`${s}T12:00:00`);
    expect(questionsOpen('2026-10-19', 52, day('2026-10-19'))).toBe(1);
    expect(questionsOpen('2026-10-19', 52, day('2026-10-25'))).toBe(1);
    expect(questionsOpen('2026-10-19', 52, day('2026-10-26'))).toBe(2);
    expect(questionsOpen('2026-10-19', 3, day('2027-10-19'))).toBe(3);
    expect(questionsOpen('2026-10-19', 52, day('2026-10-01'))).toBe(0);
  });
  it('says when each question opens', () => {
    expect(opensOn('2026-10-19', 1)).toBe('2026-10-19');
    expect(opensOn('2026-10-19', 2)).toBe('2026-10-26');
    expect(opensOn('2026-12-28', 2)).toBe('2027-01-04');
  });
});
