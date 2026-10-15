import { describe, expect, it } from 'vitest';
import { DayPerson, upcomingDays } from '../on-this-day';

const p = (id: string, name: string, birthDate: string | null, deathDate: string | null = null, birthPlace: string | null = null): DayPerson => ({ id, name, birthDate, deathDate, birthPlace });
const today = new Date(2026, 9, 15); // 15 October 2026

describe('on this day', () => {
  it('finds birthdays and remembrance days in the next two weeks, soonest first', () => {
    const events = upcomingDays([
      p('a', 'Rosa Vega', '1902-10-15', '1980-03-02', 'Oaxaca, México'),
      p('b', 'Maya Vega', '1990-10-20'),
      p('c', 'Luis Vega', '1930-05-05', '2001-10-16'),
      p('d', 'Far Away', '1950-12-25'),
    ], today);
    expect(events.map((e) => e.text)).toEqual([
      'Rosa Vega was born 124 years ago today, in Oaxaca, México',
      '25 years since Luis died, on 16 October',
      'Maya Vega turns 36 in 5 days',
    ]);
  });

  it('skips 1 January stand-in dates, partial dates and future dates', () => {
    expect(upcomingDays([p('a', 'A', '1900-01-01'), p('b', 'B', '1900'), p('c', 'C', '2026-10-16')], new Date(2025, 11, 31))).toEqual([]);
  });

  it('wraps into the new year and handles 29 February', () => {
    const e = upcomingDays([p('a', 'Leap Kid', '2000-02-29'), p('b', 'Jan Kid', '2000-01-03')], new Date(2026, 11, 28), 62);
    expect(e.map((x) => x.text)).toEqual(['Jan Kid turns 27 in 6 days', 'Leap Kid turns 27 in 62 days']);
  });
});
