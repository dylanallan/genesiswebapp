import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const TraditionsAnalytics: React.FC = () => {
  const [count, setCount] = useState(0);
  const [countries, setCountries] = useState<any[]>([]);
  const [domains, setDomains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      // Total count
      const { count: total } = await supabase.from('traditions').select('*', { count: 'exact', head: true });
      setCount(total || 0);
      // Most common countries
      const { data: countryData } = await supabase.rpc('top_tradition_origins', { limit: 5 });
      setCountries(countryData || []);
      // Most common domains
      const { data: domainData } = await supabase.rpc('top_tradition_domains', { limit: 5 });
      setDomains(domainData || []);
      setLoading(false);
    }
    fetchAnalytics();
  }, []);

  return (
    <div className="p-4 bg-gray-50 rounded-lg border mb-6">
      <h3 className="text-lg font-bold mb-2">Traditions Analytics</h3>
      {loading ? <div>Loading analytics...</div> : (
        <>
          <div className="mb-2">Total traditions: <strong>{count}</strong></div>
          <div className="mb-2">
            <strong>Top Countries:</strong>
            <ul>{countries.map((c: any) => <li key={c.origin}>{c.origin}: {c.count}</li>)}</ul>
          </div>
          <div className="mb-2">
            <strong>Top Domains:</strong>
            <ul>{domains.map((d: any) => <li key={d.historical_context}>{d.historical_context}: {d.count}</li>)}</ul>
          </div>
        </>
      )}
    </div>
  );
};

export default TraditionsAnalytics; 