-- Community groups and categories population

-- Insert additional community groups
INSERT INTO community_groups (
  name,
  description,
  group_type,
  is_public,
  owner_id,
  rules
)
SELECT 
  unnest(ARRAY[
    'Cultural Heritage Preservation',
    'Family History Researchers',
    'Traditional Recipe Keepers',
    'Genealogy Enthusiasts',
    'Cultural Storytellers',
    'Heritage Artifact Collectors',
    'Language Preservation',
    'Cultural Traditions'
  ]),
  unnest(ARRAY[
    'A community dedicated to preserving and documenting cultural heritage through various mediums and practices.',
    'A group for sharing research methods, resources, and discoveries in family history research.',
    'A space for sharing, documenting, and preserving traditional family recipes and cooking methods.',
    'A community focused on genealogy research, DNA analysis, and family tree building.',
    'A group for sharing and preserving cultural stories, legends, and oral traditions.',
    'A community for collectors and preservers of cultural artifacts and historical items.',
    'A group dedicated to preserving and teaching ancestral languages and dialects.',
    'A community for sharing and documenting cultural traditions, ceremonies, and practices.'
  ]),
  unnest(ARRAY[
    'preservation',
    'research',
    'culinary',
    'genealogy',
    'storytelling',
    'collection',
    'language',
    'traditions'
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
  id,
  unnest(ARRAY[
    '1. Respect all cultural backgrounds and traditions
2. Provide proper attribution for shared content
3. Maintain cultural sensitivity in discussions
4. Share knowledge and resources freely
5. Support fellow members in their preservation efforts',

    '1. Share research methods and resources
2. Respect privacy and confidentiality
3. Verify information before sharing
4. Help others with their research
5. Document sources properly',

    '1. Share authentic family recipes
2. Include cultural context and history
3. Respect dietary restrictions
4. Provide clear instructions
5. Credit original sources',

    '1. Share research findings
2. Respect privacy concerns
3. Verify information
4. Help others with their research
5. Document sources properly',

    '1. Share authentic cultural stories
2. Respect cultural sensitivities
3. Provide proper context
4. Credit original storytellers
5. Maintain cultural accuracy',

    '1. Share artifact information
2. Respect cultural significance
3. Provide preservation tips
4. Document provenance
5. Follow ethical collection practices',

    '1. Share language resources
2. Respect dialect variations
3. Provide cultural context
4. Help with translations
5. Document language history',

    '1. Share authentic traditions
2. Respect cultural practices
3. Provide historical context
4. Document ceremonies
5. Maintain cultural accuracy'
  ])
FROM auth.users
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING;

-- Insert welcome posts for each community group
INSERT INTO community_posts (
  group_id,
  user_id,
  title,
  content,
  post_type,
  is_announcement
)
SELECT 
  cg.id,
  cg.owner_id,
  'Welcome to ' || cg.name,
  CASE cg.group_type
    WHEN 'preservation' THEN 'Welcome to our Cultural Heritage Preservation community! Here we share methods, resources, and experiences in preserving cultural heritage. Feel free to share your preservation projects and learn from others.'
    WHEN 'research' THEN 'Welcome to the Family History Researchers group! This is a space for sharing research methods, discoveries, and resources. Let''s help each other uncover our family histories.'
    WHEN 'culinary' THEN 'Welcome to Traditional Recipe Keepers! Share your family recipes, cooking methods, and culinary traditions. Let''s preserve our cultural heritage through food.'
    WHEN 'genealogy' THEN 'Welcome to Genealogy Enthusiasts! Share your research findings, DNA analysis results, and family tree discoveries. Together, we can uncover our family histories.'
    WHEN 'storytelling' THEN 'Welcome to Cultural Storytellers! Share your family stories, legends, and oral traditions. Let''s preserve our cultural narratives for future generations.'
    WHEN 'collection' THEN 'Welcome to Heritage Artifact Collectors! Share your collections, preservation methods, and the stories behind your artifacts. Let''s preserve our cultural heritage together.'
    WHEN 'language' THEN 'Welcome to Language Preservation! Share resources, teaching methods, and experiences in preserving ancestral languages. Let''s keep our linguistic heritage alive.'
    WHEN 'traditions' THEN 'Welcome to Cultural Traditions! Share your family traditions, ceremonies, and practices. Let''s document and preserve our cultural heritage for future generations.'
  END,
  'text',
  true
FROM community_groups cg
ON CONFLICT DO NOTHING;

-- Insert community group categories
INSERT INTO community_group_categories (
  name,
  description,
  parent_category
)
VALUES
  ('Cultural Heritage', 'General discussions about cultural heritage preservation', NULL),
  ('Family History', 'Topics related to family history research and documentation', NULL),
  ('Traditional Arts', 'Discussions about traditional arts and crafts', 'Cultural Heritage'),
  ('Oral Traditions', 'Topics related to storytelling and oral history', 'Cultural Heritage'),
  ('Genealogy Research', 'Methods and resources for genealogy research', 'Family History'),
  ('DNA Analysis', 'Discussions about DNA testing and analysis', 'Family History'),
  ('Traditional Recipes', 'Sharing and preserving traditional recipes', 'Cultural Heritage'),
  ('Language Preservation', 'Topics related to preserving ancestral languages', 'Cultural Heritage'),
  ('Cultural Artifacts', 'Discussions about preserving cultural artifacts', 'Cultural Heritage'),
  ('Family Traditions', 'Sharing and documenting family traditions', 'Family History')
ON CONFLICT DO NOTHING;

-- Insert community group tags
INSERT INTO community_group_tags (
  name,
  description
)
VALUES
  ('preservation', 'Topics related to preserving cultural heritage'),
  ('research', 'Research methods and resources'),
  ('documentation', 'Documenting cultural heritage'),
  ('education', 'Educational resources and materials'),
  ('collaboration', 'Collaborative projects and initiatives'),
  ('technology', 'Using technology for preservation'),
  ('community', 'Community building and engagement'),
  ('heritage', 'Cultural heritage topics'),
  ('family', 'Family history and genealogy'),
  ('traditions', 'Cultural traditions and practices')
ON CONFLICT DO NOTHING;

-- Link community groups to categories
INSERT INTO community_group_category_links (
  group_id,
  category_id
)
SELECT 
  cg.id,
  cc.id
FROM community_groups cg
CROSS JOIN community_group_categories cc
WHERE 
  (cg.group_type = 'preservation' AND cc.name = 'Cultural Heritage') OR
  (cg.group_type = 'research' AND cc.name = 'Family History') OR
  (cg.group_type = 'culinary' AND cc.name = 'Traditional Recipes') OR
  (cg.group_type = 'genealogy' AND cc.name = 'Genealogy Research') OR
  (cg.group_type = 'storytelling' AND cc.name = 'Oral Traditions') OR
  (cg.group_type = 'collection' AND cc.name = 'Cultural Artifacts') OR
  (cg.group_type = 'language' AND cc.name = 'Language Preservation') OR
  (cg.group_type = 'traditions' AND cc.name = 'Family Traditions')
ON CONFLICT DO NOTHING;

-- Link community groups to tags
INSERT INTO community_group_tag_links (
  group_id,
  tag_id
)
SELECT 
  cg.id,
  ct.id
FROM community_groups cg
CROSS JOIN community_group_tags ct
WHERE 
  (cg.group_type = 'preservation' AND ct.name IN ('preservation', 'heritage', 'documentation')) OR
  (cg.group_type = 'research' AND ct.name IN ('research', 'family', 'documentation')) OR
  (cg.group_type = 'culinary' AND ct.name IN ('traditions', 'heritage', 'preservation')) OR
  (cg.group_type = 'genealogy' AND ct.name IN ('research', 'family', 'documentation')) OR
  (cg.group_type = 'storytelling' AND ct.name IN ('traditions', 'heritage', 'education')) OR
  (cg.group_type = 'collection' AND ct.name IN ('preservation', 'heritage', 'documentation')) OR
  (cg.group_type = 'language' AND ct.name IN ('preservation', 'education', 'heritage')) OR
  (cg.group_type = 'traditions' AND ct.name IN ('traditions', 'heritage', 'family'))
ON CONFLICT DO NOTHING; 