import React, { useState } from 'react';
import { useTraditions } from '../hooks/useTraditions';
import TraditionDetail from './TraditionDetail';

const TraditionsList: React.FC = () => {
  const { traditions, loading, error } = useTraditions();
  const [selected, setSelected] = useState<any | null>(null);

  if (loading) return <div>Loading traditions...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Cultural Traditions</h2>
      <ul className="list-disc pl-5">
        {traditions.map((t) => (
          <li key={t.id} className="mb-1 cursor-pointer hover:underline" onClick={() => setSelected(t)}>
            <strong>{t.title}</strong> ({t.country}): {t.description?.slice(0, 100)}...
          </li>
        ))}
      </ul>
      {selected && (
        <div className="mt-6">
          <TraditionDetail tradition={selected} />
          <button className="mt-2 text-blue-600 underline" onClick={() => setSelected(null)}>Back to list</button>
        </div>
      )}
    </div>
  );
};

export default TraditionsList; 