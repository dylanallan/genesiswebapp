-- Advanced Search and Document Processing Features

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create search vectors table for advanced search
CREATE TABLE IF NOT EXISTS search_vectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  search_vector tsvector,
  metadata jsonb,
  last_indexed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create document processing queue
CREATE TABLE IF NOT EXISTS document_processing_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  document_type text NOT NULL,
  status text DEFAULT 'pending',
  priority integer DEFAULT 0,
  processing_attempts integer DEFAULT 0,
  error_message text,
  processing_result jsonb,
  scheduled_at timestamptz DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create processed documents table
CREATE TABLE IF NOT EXISTS processed_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_document_id uuid NOT NULL,
  document_type text NOT NULL,
  processing_type text NOT NULL,
  content_type text NOT NULL,
  original_content text,
  processed_content jsonb,
  extracted_data jsonb,
  metadata jsonb,
  quality_score numeric,
  confidence_scores jsonb,
  processing_metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create document annotations table
CREATE TABLE IF NOT EXISTS document_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  annotation_type text NOT NULL,
  content text NOT NULL,
  location jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create search history table
CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query text NOT NULL,
  search_filters jsonb,
  result_count integer,
  selected_results jsonb,
  search_duration numeric,
  created_at timestamptz DEFAULT now()
);

-- Create search suggestions table
CREATE TABLE IF NOT EXISTS search_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_type text NOT NULL,
  suggestion text NOT NULL,
  context jsonb,
  popularity_score numeric DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create document templates table
CREATE TABLE IF NOT EXISTS document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type text NOT NULL,
  name text NOT NULL,
  description text,
  template_content jsonb NOT NULL,
  variables jsonb,
  validation_rules jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create document processing models table
CREATE TABLE IF NOT EXISTS document_processing_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_type text NOT NULL,
  name text NOT NULL,
  description text,
  model_config jsonb NOT NULL,
  performance_metrics jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create function to generate search vector
CREATE OR REPLACE FUNCTION generate_search_vector()
RETURNS TRIGGER AS $$
DECLARE
  search_text text;
BEGIN
  -- Generate search text based on entity type
  CASE NEW.entity_type
    WHEN 'family_member' THEN
      SELECT 
        concat_ws(' ',
          first_name,
          middle_name,
          last_name,
          maiden_name,
          biography,
          array_to_string(occupation, ' '),
          array_to_string(education, ' '),
          array_to_string(languages, ' ')
        ) INTO search_text
      FROM family_members
      WHERE id = NEW.entity_id;
    
    WHEN 'historical_record' THEN
      SELECT 
        concat_ws(' ',
          title,
          description,
          transcription,
          array_to_string(tags, ' ')
        ) INTO search_text
      FROM historical_records
      WHERE id = NEW.entity_id;
    
    WHEN 'cultural_artifact' THEN
      SELECT 
        concat_ws(' ',
          name,
          description,
          cultural_significance,
          array_to_string(materials, ' ')
        ) INTO search_text
      FROM cultural_artifacts
      WHERE id = NEW.entity_id;
    
    -- Add more cases for other entity types
  END CASE;

  -- Generate tsvector and store in search_vectors
  NEW.search_vector := to_tsvector('english', unaccent(search_text));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search vector generation
CREATE TRIGGER generate_search_vector_trigger
  BEFORE INSERT OR UPDATE ON search_vectors
  FOR EACH ROW
  EXECUTE FUNCTION generate_search_vector();

-- Create function to process document
CREATE OR REPLACE FUNCTION process_document()
RETURNS TRIGGER AS $$
DECLARE
  processing_result jsonb;
BEGIN
  -- Update status to processing
  UPDATE document_processing_queue
  SET status = 'processing',
      started_at = now()
  WHERE id = NEW.id;

  -- Process document based on type
  CASE NEW.document_type
    WHEN 'census_record' THEN
      -- Process census record
      processing_result := jsonb_build_object(
        'extracted_data', jsonb_build_object(
          'household_members', extract_household_members(NEW.document_id),
          'location', extract_location(NEW.document_id),
          'date', extract_date(NEW.document_id)
        ),
        'confidence_scores', jsonb_build_object(
          'extraction', 0.95,
          'validation', 0.90
        )
      );
    
    WHEN 'immigration_record' THEN
      -- Process immigration record
      processing_result := jsonb_build_object(
        'extracted_data', jsonb_build_object(
          'passenger_info', extract_passenger_info(NEW.document_id),
          'ship_details', extract_ship_details(NEW.document_id),
          'arrival_details', extract_arrival_details(NEW.document_id)
        ),
        'confidence_scores', jsonb_build_object(
          'extraction', 0.92,
          'validation', 0.88
        )
      );
    
    -- Add more cases for other document types
  END CASE;

  -- Store processing result
  UPDATE document_processing_queue
  SET status = 'completed',
      processing_result = processing_result,
      completed_at = now()
  WHERE id = NEW.id;

  -- Insert into processed_documents
  INSERT INTO processed_documents (
    original_document_id,
    document_type,
    processing_type,
    content_type,
    processed_content,
    extracted_data,
    confidence_scores,
    processing_metadata
  )
  VALUES (
    NEW.document_id,
    NEW.document_type,
    'automated',
    'structured',
    processing_result->'processed_content',
    processing_result->'extracted_data',
    processing_result->'confidence_scores',
    jsonb_build_object(
      'processing_time', extract(epoch from (now() - NEW.started_at)),
      'model_version', '1.0.0'
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for document processing
CREATE TRIGGER process_document_trigger
  AFTER INSERT ON document_processing_queue
  FOR EACH ROW
  EXECUTE FUNCTION process_document();

-- Create function to update search suggestions
CREATE OR REPLACE FUNCTION update_search_suggestions()
RETURNS TRIGGER AS $$
BEGIN
  -- Update suggestion popularity
  UPDATE search_suggestions
  SET popularity_score = popularity_score + 1,
      last_used_at = now()
  WHERE suggestion = NEW.search_query;

  -- Insert new suggestion if not exists
  INSERT INTO search_suggestions (
    suggestion_type,
    suggestion,
    context,
    popularity_score,
    last_used_at
  )
  SELECT 
    'user_query',
    NEW.search_query,
    jsonb_build_object(
      'filters', NEW.search_filters,
      'result_count', NEW.result_count
    ),
    1,
    now()
  ON CONFLICT (suggestion) DO UPDATE
  SET popularity_score = search_suggestions.popularity_score + 1,
      last_used_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search suggestions
CREATE TRIGGER update_search_suggestions_trigger
  AFTER INSERT ON search_history
  FOR EACH ROW
  EXECUTE FUNCTION update_search_suggestions();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_search_vectors_entity ON search_vectors(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_search_vectors_vector ON search_vectors USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_document_processing_queue_status ON document_processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_processed_documents_type ON processed_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_document_annotations_document ON document_annotations(document_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_suggestions_type ON search_suggestions(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_search_suggestions_popularity ON search_suggestions(popularity_score DESC);

-- Enable Row Level Security
ALTER TABLE search_vectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_processing_models ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can search vectors"
  ON search_vectors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view their own search history"
  ON search_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own document annotations"
  ON document_annotations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active document templates"
  ON document_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Anyone can view active processing models"
  ON document_processing_models FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Insert sample document templates
INSERT INTO document_templates (
  template_type,
  name,
  description,
  template_content,
  variables,
  validation_rules
)
VALUES
  (
    'census_record',
    'Canadian Census 1851',
    'Template for 1851 Canadian Census records',
    '{
      "sections": [
        {
          "name": "household_head",
          "fields": [
            {"name": "full_name", "type": "text", "required": true},
            {"name": "age", "type": "number", "required": true},
            {"name": "occupation", "type": "text", "required": true},
            {"name": "birth_place", "type": "text", "required": true}
          ]
        },
        {
          "name": "household_members",
          "fields": [
            {"name": "full_name", "type": "text", "required": true},
            {"name": "relationship", "type": "text", "required": true},
            {"name": "age", "type": "number", "required": true},
            {"name": "occupation", "type": "text"},
            {"name": "birth_place", "type": "text"}
          ]
        }
      ]
    }'::jsonb,
    '{
      "location": {"type": "object", "required": true},
      "date": {"type": "date", "required": true},
      "page_number": {"type": "number", "required": true}
    }'::jsonb,
    '{
      "rules": [
        {"field": "age", "type": "range", "min": 0, "max": 120},
        {"field": "relationship", "type": "enum", "values": ["head", "spouse", "child", "parent", "other"]}
      ]
    }'::jsonb
  ),
  (
    'immigration_record',
    'Ellis Island Arrival',
    'Template for Ellis Island immigration records',
    '{
      "sections": [
        {
          "name": "passenger_info",
          "fields": [
            {"name": "full_name", "type": "text", "required": true},
            {"name": "age", "type": "number", "required": true},
            {"name": "gender", "type": "text", "required": true},
            {"name": "marital_status", "type": "text", "required": true},
            {"name": "occupation", "type": "text", "required": true},
            {"name": "nationality", "type": "text", "required": true},
            {"name": "last_residence", "type": "text", "required": true}
          ]
        },
        {
          "name": "arrival_details",
          "fields": [
            {"name": "ship_name", "type": "text", "required": true},
            {"name": "arrival_date", "type": "date", "required": true},
            {"name": "port_of_departure", "type": "text", "required": true},
            {"name": "destination", "type": "text", "required": true}
          ]
        }
      ]
    }'::jsonb,
    '{
      "record_number": {"type": "text", "required": true},
      "page_number": {"type": "number", "required": true},
      "line_number": {"type": "number", "required": true}
    }'::jsonb,
    '{
      "rules": [
        {"field": "age", "type": "range", "min": 0, "max": 120},
        {"field": "gender", "type": "enum", "values": ["male", "female"]},
        {"field": "marital_status", "type": "enum", "values": ["single", "married", "widowed", "divorced"]}
      ]
    }'::jsonb
  );

-- Insert sample document processing models
INSERT INTO document_processing_models (
  model_type,
  name,
  description,
  model_config,
  performance_metrics
)
VALUES
  (
    'ocr',
    'Historical Document OCR',
    'Specialized OCR model for historical documents',
    '{
      "model": "tesseract",
      "version": "5.0.0",
      "languages": ["eng", "fra", "deu"],
      "preprocessing": {
        "denoise": true,
        "deskew": true,
        "contrast_enhancement": true
      },
      "postprocessing": {
        "spell_check": true,
        "context_correction": true
      }
    }'::jsonb,
    '{
      "accuracy": 0.92,
      "processing_time": 1.5,
      "language_support": {
        "eng": 0.95,
        "fra": 0.90,
        "deu": 0.88
      }
    }'::jsonb
  ),
  (
    'extraction',
    'Genealogical Data Extractor',
    'Specialized model for extracting genealogical data from documents',
    '{
      "model": "custom_transformer",
      "version": "1.0.0",
      "features": [
        "name_extraction",
        "date_extraction",
        "location_extraction",
        "relationship_extraction"
      ],
      "context_window": 512,
      "confidence_threshold": 0.85
    }'::jsonb,
    '{
      "accuracy": 0.94,
      "processing_time": 2.0,
      "feature_performance": {
        "name_extraction": 0.96,
        "date_extraction": 0.95,
        "location_extraction": 0.93,
        "relationship_extraction": 0.92
      }
    }'::jsonb
  ); 