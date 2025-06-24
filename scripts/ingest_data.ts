import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { parse } from 'https://deno.land/std@0.224.0/csv/mod.ts';
import 'https://deno.land/x/dotenv@v3.2.2/load.ts';

// --- Configuration ---
const CSV_FILE_PATH = './data/us_census_1950_sample.csv';
const METADATA_SOURCE = 'US Census 1950 Sample';

// --- Supabase Setup ---
const supabaseUrl = Deno.env.get('VITE_SUPABASE_URL');
const supabaseAnonKey = Deno.env.get('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in your .env file.');
}

// We use the anon key here to invoke the Edge Function as a user.
// The Edge Function itself will use the SERVICE_ROLE_KEY to perform inserts.
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  },
});

/**
 * Transforms a CSV record into a natural language sentence.
 * @param record A record object from the CSV file.
 * @returns A string sentence.
 */
function transformRecordToSentence(record: { [key: string]: string }): string {
  return `In 1950, a person named ${record.name}, aged ${record.age} and born in ${record.birthplace}, worked as a ${record.occupation}. They resided in ${record.residence}.`;
}

/**
 * Main function to run the ETL process.
 */
async function main() {
  console.log('--- Starting Data Ingestion Pipeline ---');

  const fileContent = await Deno.readTextFile(CSV_FILE_PATH);
  const records = parse(fileContent, {
    skipFirstRow: true,
    columns: ['id', 'name', 'age', 'birthplace', 'residence', 'occupation'],
  });

  console.log(`Found ${records.length} records in ${CSV_FILE_PATH}.`);

  for (const record of records) {
    const sentence = transformRecordToSentence(record);
    console.log(`[+] Processing: ${record.name}...`);

    try {
      // Invoke the Edge Function to generate embedding and store the data.
      const { data, error } = await supabase.functions.invoke('generate-knowledge-embedding', {
        body: { 
          text: sentence,
          metadata: {
            source: METADATA_SOURCE,
            record_id: record.id
          }
        },
      });

      if (error || data.error) {
        throw new Error(error?.message || data.error);
      }
      
      console.log(`  [✅] Successfully ingested and vectorized record for ${record.name}.`);

    } catch (err) {
      console.error(`  [❌] Failed to process record for ${record.name}:`, err.message);
    }
  }

  console.log('--- Data Ingestion Pipeline Finished ---');
}

// Run the main process
main().catch(console.error); 