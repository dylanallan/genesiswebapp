import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { loadAllFamilyRows } from '../lib/family';
import { familyFacts, FactPerson } from '../lib/family-facts';
import { t, useLang } from '../lib/i18n';

interface Row {
  id: string; first_name: string | null; middle_name: string | null; last_name: string | null; birth_date: string | null; death_date: string | null;
  birth_location: string | null; parent_ids: string[] | null; children_ids: string[] | null;
}

export const FamilyFacts: React.FC = () => {
  useLang();
  const navigate = useNavigate();
  const [people, setPeople] = useState<FactPerson[] | null>(null);

  useEffect(() => {
    loadAllFamilyRows<Row>('id,first_name,middle_name,last_name,birth_date,death_date,birth_location,parent_ids,children_ids')
      .then((rows) => setPeople(rows.map((r) => ({
        id: r.id, firstName: r.first_name ?? '', lastName: r.last_name ?? '',
        name: [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ') || t('Unknown'),
        birthDate: r.birth_date, deathDate: r.death_date, birthPlace: r.birth_location, parentIds: r.parent_ids ?? [], childrenIds: r.children_ids ?? [],
      }))))
      .catch(() => { toast.error(t('Could not load your family tree.')); setPeople([]); });
  }, []);

  const facts = useMemo(() => (people ? familyFacts(people) : []), [people]);

  const share = async () => {
    const text = [t('Our family in numbers (from Genesis Heritage):'), ...facts.map((f) => `• ${f.title}: ${f.value}${f.detail ? ` (${f.detail})` : ''}`)].join('\n');
    try { await navigator.clipboard.writeText(text); toast.success(t('Copied. Paste it into a message to your family.')); }
    catch { toast.error(t('Could not copy on this device.')); }
  };

  if (people === null) return <p className="p-6 text-gray-600">{t('Loading your family…')}</p>;
  if (!people.length) {
    return (
      <div className="bg-white rounded-xl border p-6 text-center space-y-3">
        <Sparkles className="w-10 h-10 mx-auto text-genesis-600" />
        <p className="text-gray-700">{t('Add your family first, and we’ll find the stories hidden in the numbers.')}</p>
        <button onClick={() => navigate('/dashboard?feature=welcome')} className="px-4 py-2 bg-genesis-600 text-white rounded-lg">{t('Get started')}</button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><Sparkles className="w-6 h-6 text-genesis-600" /> {t('Family facts')}</h2>
          <p className="text-gray-600 mt-1">{t('Highlights from your tree. The more you add, the more you’ll discover.')}</p>
        </div>
        <button onClick={share} className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm hover:bg-gray-50"><Copy className="w-4 h-4" /> {t('Copy to share')}</button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="family-facts">
        {facts.map((f) => (
          <div key={f.id} className="rounded-xl border bg-[#faf7f0] p-4">
            <p className="text-sm text-gray-600">{f.title}</p>
            <p className="text-2xl font-bold text-genesis-800 mt-1">{f.value}</p>
            <p className="text-sm text-gray-700 mt-1">
              {f.personId
                ? <button onClick={() => navigate(`/dashboard?feature=life-story&person=${f.personId}`)} className="hover:underline text-left">{f.detail}</button>
                : f.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FamilyFacts;
