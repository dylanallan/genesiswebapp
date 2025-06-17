-- Sample family tree structure population

-- Insert family members
WITH inserted_members AS (
  INSERT INTO family_members (user_id, name, birth_date, birth_location, gender, is_living, notes)
  SELECT 
    id,
    unnest(ARRAY[
      'John Smith',
      'Mary Smith',
      'James Smith',
      'Sarah Smith',
      'Robert Smith',
      'Elizabeth Smith',
      'Michael Smith',
      'Patricia Smith'
    ]),
    unnest(ARRAY[
      '1950-01-15',
      '1952-03-20',
      '1975-06-10',
      '1978-09-25',
      '2000-12-05',
      '2002-04-15',
      '1970-11-30',
      '1972-07-22'
    ]),
    unnest(ARRAY[
      'New York, USA',
      'Boston, USA',
      'Chicago, USA',
      'San Francisco, USA',
      'Seattle, USA',
      'Portland, USA',
      'Los Angeles, USA',
      'San Diego, USA'
    ]),
    unnest(ARRAY[
      'male',
      'female',
      'male',
      'female',
      'male',
      'female',
      'male',
      'female'
    ]),
    unnest(ARRAY[
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true
    ]),
    unnest(ARRAY[
      'Family patriarch, retired engineer',
      'Family matriarch, retired teacher',
      'Software engineer, tech entrepreneur',
      'Medical doctor, specializes in pediatrics',
      'College student, computer science major',
      'High school student, aspiring artist',
      'Business owner, runs family restaurant',
      'Professional photographer, art gallery owner'
    ])
  FROM auth.users
  WHERE id = (
    SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
  )
  RETURNING id, name
)
-- Insert family relationships
INSERT INTO family_relationships (
  user_id,
  person1_id,
  person2_id,
  relationship_type,
  start_date,
  notes
)
SELECT 
  (SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1),
  p1.id,
  p2.id,
  rel.relationship_type,
  rel.start_date,
  rel.notes
FROM inserted_members p1
CROSS JOIN inserted_members p2
JOIN (
  VALUES
    ('John Smith', 'Mary Smith', 'spouse', '1970-06-15', 'Married in New York'),
    ('John Smith', 'James Smith', 'parent', '1975-06-10', 'Father'),
    ('Mary Smith', 'James Smith', 'parent', '1975-06-10', 'Mother'),
    ('John Smith', 'Sarah Smith', 'parent', '1978-09-25', 'Father'),
    ('Mary Smith', 'Sarah Smith', 'parent', '1978-09-25', 'Mother'),
    ('James Smith', 'Robert Smith', 'parent', '2000-12-05', 'Father'),
    ('Sarah Smith', 'Elizabeth Smith', 'parent', '2002-04-15', 'Mother'),
    ('Michael Smith', 'Patricia Smith', 'spouse', '1995-08-20', 'Married in Los Angeles'),
    ('John Smith', 'Michael Smith', 'sibling', '1970-11-30', 'Brothers'),
    ('Mary Smith', 'Patricia Smith', 'sibling-in-law', '1995-08-20', 'Sister-in-law')
) AS rel(person1_name, person2_name, relationship_type, start_date, notes)
ON p1.name = rel.person1_name AND p2.name = rel.person2_name
WHERE p1.id != p2.id
ON CONFLICT DO NOTHING;

-- Insert family events
INSERT INTO family_events (
  user_id,
  event_type,
  event_date,
  event_location,
  description,
  participants
)
SELECT 
  id,
  unnest(ARRAY[
    'wedding',
    'birth',
    'graduation',
    'family_reunion',
    'anniversary'
  ]),
  unnest(ARRAY[
    '1970-06-15',
    '1975-06-10',
    '2018-05-20',
    '2020-07-04',
    '2020-06-15'
  ]),
  unnest(ARRAY[
    'New York, USA',
    'Chicago, USA',
    'Seattle University',
    'Family Homestead',
    'Family Restaurant'
  ]),
  unnest(ARRAY[
    'John and Mary''s wedding ceremony',
    'Birth of James Smith',
    'Robert''s college graduation',
    'Annual family reunion',
    'John and Mary''s 50th anniversary celebration'
  ]),
  unnest(ARRAY[
    ARRAY['John Smith', 'Mary Smith', 'Family Members', 'Friends'],
    ARRAY['John Smith', 'Mary Smith', 'James Smith'],
    ARRAY['Robert Smith', 'Family Members', 'Friends'],
    ARRAY['All Family Members'],
    ARRAY['John Smith', 'Mary Smith', 'Children', 'Grandchildren']
  ])
FROM auth.users
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING;

-- Insert family documents
INSERT INTO family_documents (
  user_id,
  title,
  document_type,
  content,
  metadata
)
SELECT 
  id,
  unnest(ARRAY[
    'Family Tree Chart',
    'Family History Book',
    'Wedding Certificate',
    'Birth Certificate',
    'Family Property Deed'
  ]),
  unnest(ARRAY[
    'chart',
    'book',
    'certificate',
    'certificate',
    'legal'
  ]),
  unnest(ARRAY[
    'Digital family tree showing relationships from 1950 to present',
    'Comprehensive family history documenting our journey',
    'Original wedding certificate from 1970',
    'Birth certificate of James Smith',
    'Original property deed for family homestead'
  ]),
  unnest(ARRAY[
    '{"format": "digital", "last_updated": "2024-01-01"}'::jsonb,
    '{"pages": 150, "published": "2020-01-01"}'::jsonb,
    '{"issuing_authority": "New York City", "date": "1970-06-15"}'::jsonb,
    '{"issuing_authority": "Chicago", "date": "1975-06-10"}'::jsonb,
    '{"issuing_authority": "County Records", "date": "1980-01-01"}'::jsonb
  ])
FROM auth.users
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING; 