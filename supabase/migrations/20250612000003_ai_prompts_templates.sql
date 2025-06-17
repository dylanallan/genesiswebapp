-- AI prompts and templates population

-- Insert AI prompts
INSERT INTO ai_prompts (
  user_id,
  title,
  content,
  category,
  is_template,
  is_public,
  usage_count
)
SELECT 
  id,
  unnest(ARRAY[
    'Cultural Story Generator',
    'Recipe Enhancement',
    'Family History Analysis',
    'Cultural Tradition Documentation',
    'Genealogy Research Assistant',
    'Cultural Artifact Description',
    'Family Event Narrator',
    'Ancestral Language Translator'
  ]),
  unnest(ARRAY[
    'Generate a detailed cultural story based on the following elements:
    - Family member: {family_member}
    - Time period: {time_period}
    - Location: {location}
    - Cultural context: {cultural_context}
    - Key themes: {themes}
    
    Please create a narrative that:
    1. Captures the cultural significance
    2. Includes relevant historical context
    3. Incorporates family traditions
    4. Highlights personal experiences
    5. Maintains cultural authenticity',

    'Enhance this family recipe with the following:
    - Original recipe: {recipe}
    - Cultural background: {cultural_background}
    - Available ingredients: {ingredients}
    - Dietary restrictions: {restrictions}
    
    Please provide:
    1. Enhanced ingredient list
    2. Detailed preparation steps
    3. Cultural significance
    4. Modern adaptations
    5. Serving suggestions',

    'Analyze this family history information:
    - Family member: {family_member}
    - Time period: {time_period}
    - Location: {location}
    - Available documents: {documents}
    
    Please provide:
    1. Historical context
    2. Cultural significance
    3. Family connections
    4. Notable events
    5. Research recommendations',

    'Document this cultural tradition:
    - Tradition name: {tradition_name}
    - Origin: {origin}
    - Current practice: {current_practice}
    - Participants: {participants}
    
    Please include:
    1. Historical background
    2. Cultural significance
    3. Step-by-step description
    4. Modern adaptations
    5. Preservation recommendations',

    'Assist with genealogy research:
    - Family name: {family_name}
    - Time period: {time_period}
    - Region: {region}
    - Available records: {records}
    
    Please provide:
    1. Research strategy
    2. Key resources
    3. Common challenges
    4. Verification methods
    5. Documentation tips',

    'Describe this cultural artifact:
    - Artifact type: {artifact_type}
    - Age: {age}
    - Condition: {condition}
    - Cultural context: {cultural_context}
    
    Please include:
    1. Physical description
    2. Cultural significance
    3. Historical context
    4. Preservation status
    5. Conservation recommendations',

    'Narrate this family event:
    - Event type: {event_type}
    - Date: {date}
    - Location: {location}
    - Participants: {participants}
    
    Please create:
    1. Event description
    2. Cultural significance
    3. Family connections
    4. Memorable moments
    5. Future implications',

    'Translate this ancestral text:
    - Original text: {original_text}
    - Source language: {source_language}
    - Target language: {target_language}
    - Cultural context: {cultural_context}
    
    Please provide:
    1. Literal translation
    2. Cultural context
    3. Modern interpretation
    4. Usage examples
    5. Cultural notes'
  ]),
  unnest(ARRAY[
    'story_generation',
    'recipe_enhancement',
    'history_analysis',
    'tradition_documentation',
    'genealogy_research',
    'artifact_description',
    'event_narration',
    'language_translation'
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
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ])
FROM auth.users
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING;

-- Insert AI custom instructions
INSERT INTO ai_custom_instructions (
  user_id,
  instructions,
  is_active
)
SELECT 
  id,
  'You are a cultural heritage preservation assistant. Your role is to:
1. Help users document and preserve their cultural heritage
2. Provide accurate historical and cultural context
3. Respect cultural sensitivities and traditions
4. Maintain authenticity in all generated content
5. Support multilingual and multicultural perspectives
6. Assist in family history research and documentation
7. Help preserve traditional recipes and practices
8. Guide users in cultural artifact preservation
9. Support community building and knowledge sharing
10. Promote cultural understanding and appreciation',
  true
FROM auth.users
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING;

-- Insert AI conversation templates
INSERT INTO ai_conversations (
  user_id,
  title,
  summary,
  context,
  message_count
)
SELECT 
  id,
  unnest(ARRAY[
    'Cultural Heritage Documentation',
    'Family History Research',
    'Recipe Preservation',
    'Cultural Tradition Recording',
    'Genealogy Investigation'
  ]),
  unnest(ARRAY[
    'Template for documenting cultural heritage items and stories',
    'Template for conducting family history research',
    'Template for preserving and documenting family recipes',
    'Template for recording cultural traditions and practices',
    'Template for investigating family genealogy'
  ]),
  unnest(ARRAY[
    '{"type": "documentation", "focus": "cultural_heritage", "language": "en"}'::jsonb,
    '{"type": "research", "focus": "family_history", "language": "en"}'::jsonb,
    '{"type": "preservation", "focus": "recipes", "language": "en"}'::jsonb,
    '{"type": "recording", "focus": "traditions", "language": "en"}'::jsonb,
    '{"type": "investigation", "focus": "genealogy", "language": "en"}'::jsonb
  ]),
  unnest(ARRAY[
    0,
    0,
    0,
    0,
    0
  ])
FROM auth.users
WHERE id = (
  SELECT id FROM auth.users ORDER BY created_at ASC LIMIT 1
)
ON CONFLICT DO NOTHING; 