import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarHeart, Cake, Flower2 } from 'lucide-react';
import { loadAllFamilyRows } from '../lib/family';
import { t, useLang } from '../lib/i18n';
import { DayEvent, upcomingDays } from '../lib/on-this-day';

interface Row {
  id: string; first_name: string | null; middle_name: string | null; last_name: string | null;
  birth_date: string | null; death_date: string | null; birth_location: string | null; is_living: boolean | null;
}

/** Upcoming family birthdays and remembrance days, shown on the welcome page. Hidden when there are none. */
export const OnThisDay: React.FC = () => {
  useLang();
  const navigate = useNavigate();
  const [events, setEvents] = useState<DayEvent[]>([]);

  useEffect(() => {
    loadAllFamilyRows<Row>('id,first_name,middle_name,last_name,birth_date,death_date,birth_location,is_living')
      .then((rows) => setEvents(upcomingDays(rows.map((r) => ({
        id: r.id, name: [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ') || t('Unknown'),
        birthDate: r.birth_date, deathDate: r.death_date, birthPlace: r.birth_location, isLiving: r.is_living,
      })), new Date())))
      .catch(() => setEvents([]));
  }, []);

  if (!events.length) return null;
  return (
    <section className="border rounded-lg p-4 bg-amber-50/60" data-testid="on-this-day">
      <h3 className="font-semibold flex items-center gap-2"><CalendarHeart className="w-5 h-5 text-genesis-600" /> {t('Coming up in your family')}</h3>
      <ul className="mt-2 space-y-1.5">
        {events.slice(0, 8).map((e) => (
          <li key={`${e.personId}-${e.kind}`} className="flex items-start gap-2 text-sm">
            {e.kind === 'died' ? <Flower2 className="w-4 h-4 mt-0.5 text-gray-500 shrink-0" /> : <Cake className="w-4 h-4 mt-0.5 text-rose-500 shrink-0" />}
            <span className={e.daysAway === 0 ? 'font-semibold' : ''}>{e.text}.</span>
            {e.kind !== 'birthday' && (
              <button onClick={() => navigate(`/dashboard?feature=life-story&person=${e.personId}`)} className="ml-auto text-genesis-700 hover:underline whitespace-nowrap">{t('Their story →')}</button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default OnThisDay;
