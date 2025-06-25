import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useTraditionSearch({ keyword = '', country = '', domain = '' }) {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function search() {
      setLoading(true);
      let query = supabase.from('cultural_traditions').select('*');
      if (keyword) query = query.ilike('title', `%${keyword}%`);
      if (country) query = query.ilike('country', `%${country}%`);
      if (domain) query = query.ilike('domain', `%${domain}%`);
      const { data, error } = await query;
      if (error) setError(error);
      setResults(data || []);
      setLoading(false);
    }
    search();
  }, [keyword, country, domain]);

  return { results, loading, error };
} 