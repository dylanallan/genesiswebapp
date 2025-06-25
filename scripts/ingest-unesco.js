import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Path to the local UNESCO JSON file (downloaded manually)
const UNESCO_FILE = path.join(__dirname, 'ich_elements.json');
const BATCH_SIZE = 100;

async function ingestUNESCOHeritage() {
  try {
    const raw = fs.readFileSync(UNESCO_FILE, 'utf-8');
    const items = JSON.parse(raw);
    let batch = [];
    let count = 0;
    for (const item of items) {
      const tradition = {
        name: item.title_en || item.title_fr || item.title_es || 'UNESCO Tradition',
        description: item.description_en || item.description_fr || item.description_es || '',
        origin: item.country || item.region || '',
        historical_context: item.domain || '',
        modern_application: '',
        frequency: '',
        participants: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Imported from UNESCO Intangible Cultural Heritage',
        metadata: item
      };
      batch.push(tradition);
      if (batch.length >= BATCH_SIZE) {
        const { error } = await supabase.from('traditions').upsert(batch, { onConflict: 'name' });
        if (error) {
          console.error(`Batch insert error at record ${count}:`, error.message);
        } else {
          console.log(`Inserted batch up to record ${count}`);
        }
        batch = [];
      }
      count++;
    }
    // Insert any remaining records
    if (batch.length > 0) {
      const { error } = await supabase.from('traditions').upsert(batch, { onConflict: 'name' });
      if (error) {
        console.error('Final batch insert error:', error.message);
      } else {
        console.log('Inserted final batch.');
      }
    }
    console.log(`Ingestion complete. Total records processed: ${count}`);
  } catch (err) {
    console.error('Ingestion error:', err);
  }
}
ingestUNESCOHeritage(); 