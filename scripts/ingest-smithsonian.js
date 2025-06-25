import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SMITHSONIAN_API = 'https://api.si.edu/openaccess/api/v1.0/search?q=artifacts&rows=10&api_key=YOUR_SMITHSONIAN_API_KEY';

async function ingestArtifacts() {
  const res = await fetch(SMITHSONIAN_API);
  const data = await res.json();
  const items = data.response?.rows || [];

  for (const item of items) {
    const artifact = {
      title: item.title,
      description: item.content?.descriptiveNonRepeating?.record_ID || '',
      image_url: item.content?.descriptiveNonRepeating?.online_media?.media?.[0]?.content || '',
      source: 'Smithsonian Open Access',
      external_id: item.id,
      metadata: item.content,
    };
    const { error } = await supabase.from('cultural_artifacts').insert([artifact]);
    if (error) {
      console.error('Insert error:', error.message);
    } else {
      console.log('Inserted:', artifact.title);
    }
  }
}

ingestArtifacts().then(() => {
  console.log('Ingestion complete.');
  process.exit(0);
}); 