-- People missing birth or death dates
CREATE OR REPLACE VIEW people_missing_vitals AS
SELECT id, first_name, last_name, birth_date, death_date
FROM people
WHERE birth_date IS NULL OR death_date IS NULL;

-- People with no relationships
CREATE OR REPLACE VIEW people_without_relationships AS
SELECT p.id, p.first_name, p.last_name
FROM people p
LEFT JOIN relationships r ON p.id = r.person1_id OR p.id = r.person2_id
WHERE r.id IS NULL;

-- People with no sources (no census, birth, death, or marriage records)
CREATE OR REPLACE VIEW people_without_sources AS
SELECT p.id, p.first_name, p.last_name
FROM people p
LEFT JOIN birth_records b ON p.id = b.person_id
LEFT JOIN death_records d ON p.id = d.person_id
LEFT JOIN marriage_records m ON p.id = m.relationship_id
LEFT JOIN census_records c ON p.id = c.person_id
WHERE b.id IS NULL AND d.id IS NULL AND m.id IS NULL AND c.id IS NULL;

CREATE TABLE IF NOT EXISTS digitization_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  record_type TEXT,
  details TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
