import React, { useState } from 'react';
import { useTraditionSearch } from '../hooks/useTraditionSearch';
import TraditionDetail from './TraditionDetail';

const TraditionSearchBar: React.FC = () => {
  const [keyword, setKeyword] = useState('');
  const [country, setCountry] = useState('');
  const [domain, setDomain] = useState('');
  const [selected, setSelected] = useState<any | null>(null);
  const { results, loading, error } = useTraditionSearch({ keyword, country, domain });

  return (
    <div className="mb-8">
      <form className="flex flex-wrap gap-2 mb-4" onSubmit={e => e.preventDefault()}>
        <input className="border p-2 rounded" placeholder="Keyword" value={keyword} onChange={e => setKeyword(e.target.value)} />
        <input className="border p-2 rounded" placeholder="Country" value={country} onChange={e => setCountry(e.target.value)} />
        <input className="border p-2 rounded" placeholder="Domain" value={domain} onChange={e => setDomain(e.target.value)} />
      </form>
      {loading && <div>Searching...</div>}
      {error && <div className="text-red-600">Error: {error.message}</div>}
      <ul className="list-disc pl-5">
        {results.map((t) => (
          <li key={t.id} className="mb-1 cursor-pointer hover:underline" onClick={() => setSelected(t)}>
            <strong>{t.name}</strong>: {t.description?.slice(0, 100)}...
          </li>
        ))}
      </ul>
      {selected && (
        <div className="mt-6">
          <TraditionDetail tradition={selected} />
          <button className="mt-2 text-blue-600 underline" onClick={() => setSelected(null)}>Back to results</button>
        </div>
      )}
    </div>
  );
};

export default TraditionSearchBar; 