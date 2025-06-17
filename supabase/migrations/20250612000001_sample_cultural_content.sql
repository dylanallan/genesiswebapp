-- Sample cultural content population

-- Sample cultural stories
INSERT INTO cultural_stories (user_id, title, content, storyteller, location, themes, language, verification_status)
SELECT 
  id,
  'The Family''s Journey',
  'Our family''s story begins in the early 1900s when my great-grandparents embarked on a journey to build a new life. They carried with them not just their belongings, but a rich cultural heritage that has been passed down through generations. This story has been preserved through oral tradition and now finds its place in our digital family archive.',
  'Family Elder',
  'Various locations across generations',
  ARRAY['migration', 'family', 'heritage', 'tradition'],
  'en',
  'verified'
FROM auth.users
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING;

-- Sample traditions
INSERT INTO traditions (user_id, name, description, origin, historical_context, modern_application, frequency, participants)
SELECT 
  id,
  'Annual Family Gathering',
  'A yearly celebration where family members come together to share stories, recipes, and strengthen our cultural bonds. This tradition has evolved over time while maintaining its core values of family unity and cultural preservation.',
  'Early 20th century',
  'Started as a way to maintain family connections across distances',
  'Now includes digital participation for remote family members',
  'yearly',
  ARRAY['extended family', 'friends', 'community members']
FROM auth.users
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING;

-- Sample recipes
INSERT INTO recipes (
  user_id, 
  name, 
  description, 
  ingredients, 
  instructions, 
  cultural_significance, 
  origin, 
  serving_size, 
  preparation_time, 
  difficulty_level, 
  tags
)
SELECT 
  id,
  'Family Heritage Stew',
  'A traditional family recipe passed down through generations, this stew represents the fusion of different cultural influences in our family history.',
  '[
    {"name": "beef", "amount": "1", "unit": "kg", "notes": "cubed"},
    {"name": "potatoes", "amount": "4", "unit": "large", "notes": "diced"},
    {"name": "carrots", "amount": "3", "unit": "medium", "notes": "sliced"},
    {"name": "family spice blend", "amount": "2", "unit": "tbsp", "notes": "secret recipe"}
  ]'::jsonb,
  '[
    {"step": 1, "instruction": "Brown the beef in a large pot"},
    {"step": 2, "instruction": "Add vegetables and spices"},
    {"step": 3, "instruction": "Simmer for 2 hours"},
    {"step": 4, "instruction": "Serve with traditional bread"}
  ]'::jsonb,
  'This recipe represents our family''s journey and the blending of different cultural traditions',
  'Family tradition',
  6,
  '2 hours',
  'intermediate',
  ARRAY['traditional', 'family', 'stew', 'heritage']
FROM auth.users
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING;

-- Sample celebrations
INSERT INTO celebrations (user_id, name, description, date_or_season, significance, location, participants)
SELECT 
  id,
  'Cultural Heritage Day',
  'An annual celebration of our family''s diverse cultural heritage, featuring traditional music, dance, and food from our various ancestral backgrounds.',
  'Summer solstice',
  'Celebrates the rich cultural diversity within our family',
  'Family homestead',
  ARRAY['family members', 'close friends', 'community elders']
FROM auth.users
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING;

-- Sample cultural artifacts
INSERT INTO cultural_artifacts (user_id, title, description, category, media_type, tags, metadata)
SELECT 
  id,
  'Family Heritage Quilt',
  'A traditional quilt made by family members, incorporating patterns and fabrics that represent different aspects of our cultural heritage.',
  'artifact',
  'image',
  ARRAY['quilt', 'textile', 'heritage', 'family'],
  '{
    "creation_date": "1985",
    "materials": ["cotton", "silk", "wool"],
    "dimensions": "200x200 cm",
    "preservation_status": "excellent"
  }'::jsonb
FROM auth.users
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING; 