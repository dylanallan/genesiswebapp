import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useTraditions() {
  const [traditions, setTraditions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchTraditions() {
      setLoading(true);
      const { data, error } = await supabase
        .from('cultural_traditions')
        .select('*')
        .order('title');
      if (error) setError(error);
      setTraditions(data || []);
      setLoading(false);
    }
    fetchTraditions();
  }, []);

  return { traditions, loading, error };
} 