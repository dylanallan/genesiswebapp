// "On this day in your family": birthdays and remembrance days coming up in the next couple of weeks.
// Only full dates count. 1 January is skipped because old records often use it as a stand-in for "some time that year".

export interface DayPerson {
  id: string;
  name: string;
  birthDate: string | null;
  deathDate: string | null;
  birthPlace: string | null;
  isLiving?: boolean | null;
}

export interface DayEvent { personId: string; kind: 'birthday' | 'born' | 'died'; daysAway: number; years: number; text: string; date: string }

const DAY = 86_400_000;
const parse = (d: string | null) => {
  const m = d ? /^(\d{4})-(\d{2})-(\d{2})/.exec(d) : null;
  if (!m || (m[2] === '01' && m[3] === '01')) return null;
  return { y: +m[1], m: +m[2], d: +m[3] };
};

export function upcomingDays(people: DayPerson[], today: Date, windowDays = 14): DayEvent[] {
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const out: DayEvent[] = [];
  for (const p of people) {
    const first = p.name.split(' ')[0];
    const add = (date: string | null, kind: 'born' | 'died') => {
      const d = parse(date);
      if (!d) return;
      for (const year of [today.getFullYear(), today.getFullYear() + 1]) {
        // 29 February birthdays are marked on 28 February in other years.
        const day = d.m === 2 && d.d === 29 && new Date(Date.UTC(year, 1, 29)).getUTCMonth() !== 1 ? 28 : d.d;
        const away = Math.round((Date.UTC(year, d.m - 1, day) - start) / DAY);
        if (away < 0 || away > windowDays) continue;
        const years = year - d.y;
        if (years <= 0) return;
        const living = kind === 'born' && !p.deathDate && p.isLiving !== false && years < 105;
        const when = away === 0 ? 'today' : away === 1 ? 'tomorrow' : `in ${away} days`;
        const text = living
          ? `${p.name} turns ${years} ${when}`
          : kind === 'born'
            ? `${p.name} was born ${years} years ago ${away === 0 ? 'today' : `on ${monthDay(d.m, d.d)}`}${p.birthPlace ? `, in ${p.birthPlace}` : ''}`
            : `${years} years since ${first} died, ${away === 0 ? 'today' : `on ${monthDay(d.m, d.d)}`}`;
        out.push({ personId: p.id, kind: living ? 'birthday' : kind, daysAway: away, years, text, date: date! });
        return;
      }
    };
    add(p.birthDate, 'born');
    add(p.deathDate, 'died');
  }
  return out.sort((a, b) => a.daysAway - b.daysAway || Number(a.kind !== 'birthday') - Number(b.kind !== 'birthday') || a.text.localeCompare(b.text));
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthDay = (m: number, d: number) => `${d} ${MONTHS[m - 1]}`;
