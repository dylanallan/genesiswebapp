import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// WikiTree API: Get a sample of public profiles (limit 10 for demo)
const WIKITREE_API = 'https://api.wikitree.com/api.php?action=getProfile&key=WikiTree-1&fields=Id,Name,FirstName,LastName,BirthDate,BirthLocation,DeathDate,DeathLocation,Gender,Bio,IsLiving,Privacy,Manager&format=json';

async function ingestWikiTreeProfiles() {
  try {
    const res = await fetch(WIKITREE_API);
    const data = await res.json();
    const profiles = data[0]?.profile ? [data[0].profile] : [];
    for (const profile of profiles) {
      const member = {
        wikitree_id: profile.Id,
        first_name: profile.FirstName,
        last_name: profile.LastName,
        birth_date: profile.BirthDate || null,
        birth_location: profile.BirthLocation || null,
        death_date: profile.DeathDate || null,
        death_location: profile.DeathLocation || null,
        gender: profile.Gender || null,
        biography: profile.Bio || null,
        is_living: profile.IsLiving,
        privacy_settings: { privacy: profile.Privacy },
        notes: `Imported from WikiTree. Manager: ${profile.Manager}`
      };
      const { error } = await supabase.from('family_members').upsert([member], { onConflict: 'wikitree_id' });
      if (error) {
        console.error('Supabase error:', error.message);
      } else {
        console.log(`Imported WikiTree profile: ${profile.Id}`);
      }
    }
  } catch (err) {
    console.error('Ingestion error:', err);
  }
}
ingestWikiTreeProfiles(); 