-- Advanced Machine Learning and AI Features

-- Create ML model registry
CREATE TABLE IF NOT EXISTS ml_model_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  model_type text NOT NULL,
  description text,
  version text NOT NULL,
  framework text NOT NULL,
  model_architecture jsonb NOT NULL,
  hyperparameters jsonb,
  training_metrics jsonb,
  validation_metrics jsonb,
  model_weights_url text,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ML model deployments
CREATE TABLE IF NOT EXISTS ml_model_deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES ml_model_registry(id) ON DELETE CASCADE,
  deployment_name text NOT NULL,
  environment text NOT NULL,
  status text DEFAULT 'pending',
  endpoint_url text,
  scaling_config jsonb,
  resource_usage jsonb,
  performance_metrics jsonb,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ML training jobs
CREATE TABLE IF NOT EXISTS ml_training_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES ml_model_registry(id) ON DELETE CASCADE,
  job_name text NOT NULL,
  status text DEFAULT 'pending',
  training_config jsonb NOT NULL,
  dataset_config jsonb NOT NULL,
  started_at timestamptz,
  completed_at timestamptz,
  training_metrics jsonb,
  error_details jsonb,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ML predictions
CREATE TABLE IF NOT EXISTS ml_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deployment_id uuid REFERENCES ml_model_deployments(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  input_data jsonb NOT NULL,
  prediction_type text NOT NULL,
  prediction_result jsonb NOT NULL,
  confidence_score float,
  processing_time interval,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create ML feature store
CREATE TABLE IF NOT EXISTS ml_feature_store (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name text NOT NULL,
  feature_type text NOT NULL,
  description text,
  data_type text NOT NULL,
  validation_rules jsonb,
  transformation_rules jsonb,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ML feature values
CREATE TABLE IF NOT EXISTS ml_feature_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id uuid REFERENCES ml_feature_store(id) ON DELETE CASCADE,
  entity_id uuid NOT NULL,
  entity_type text NOT NULL,
  feature_value jsonb NOT NULL,
  valid_from timestamptz NOT NULL,
  valid_to timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create ML model evaluation
CREATE TABLE IF NOT EXISTS ml_model_evaluation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES ml_model_registry(id) ON DELETE CASCADE,
  evaluation_type text NOT NULL,
  evaluation_metrics jsonb NOT NULL,
  test_dataset jsonb,
  evaluation_date timestamptz NOT NULL,
  evaluator_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create ML model versioning
CREATE TABLE IF NOT EXISTS ml_model_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES ml_model_registry(id) ON DELETE CASCADE,
  version_number text NOT NULL,
  changes_description text,
  model_weights_url text,
  training_job_id uuid REFERENCES ml_training_jobs(id) ON DELETE CASCADE,
  evaluation_id uuid REFERENCES ml_model_evaluation(id) ON DELETE CASCADE,
  is_current boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create function to handle model predictions
CREATE OR REPLACE FUNCTION process_ml_prediction()
RETURNS TRIGGER AS $$
DECLARE
  deployment_record ml_model_deployments;
  model_record ml_model_registry;
BEGIN
  -- Get deployment and model information
  SELECT d.*, m.* INTO deployment_record, model_record
  FROM ml_model_deployments d
  JOIN ml_model_registry m ON m.id = d.model_id
  WHERE d.id = NEW.deployment_id
  AND d.status = 'active';

  IF deployment_record IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive model deployment';
  END IF;

  -- Process prediction based on model type
  CASE model_record.model_type
    WHEN 'dna_analysis' THEN
      -- Process DNA analysis prediction
      NEW.prediction_result := process_dna_prediction(NEW.input_data);
    WHEN 'record_matching' THEN
      -- Process record matching prediction
      NEW.prediction_result := process_record_matching(NEW.input_data);
    WHEN 'relationship_inference' THEN
      -- Process relationship inference
      NEW.prediction_result := process_relationship_inference(NEW.input_data);
    ELSE
      RAISE EXCEPTION 'Unsupported model type: %', model_record.model_type;
  END CASE;

  -- Calculate confidence score
  NEW.confidence_score := calculate_confidence_score(
    NEW.prediction_result,
    model_record.validation_metrics
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle feature updates
CREATE OR REPLACE FUNCTION update_ml_features()
RETURNS TRIGGER AS $$
DECLARE
  feature_record ml_feature_store;
BEGIN
  -- Get active features for the entity type
  FOR feature_record IN
    SELECT * FROM ml_feature_store
    WHERE is_active = true
    AND feature_type = NEW.entity_type
  LOOP
    -- Calculate feature value
    INSERT INTO ml_feature_values (
      feature_id,
      entity_id,
      entity_type,
      feature_value,
      valid_from,
      metadata
    )
    VALUES (
      feature_record.id,
      NEW.id,
      NEW.entity_type,
      calculate_feature_value(
        feature_record.feature_name,
        NEW.data,
        feature_record.transformation_rules
      ),
      now(),
      jsonb_build_object(
        'source', TG_TABLE_NAME,
        'operation', TG_OP
      )
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ml_model_deployments_model ON ml_model_deployments(model_id);
CREATE INDEX IF NOT EXISTS idx_ml_training_jobs_model ON ml_training_jobs(model_id);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_deployment ON ml_predictions(deployment_id);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_user ON ml_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_ml_feature_values_feature ON ml_feature_values(feature_id);
CREATE INDEX IF NOT EXISTS idx_ml_feature_values_entity ON ml_feature_values(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_ml_model_evaluation_model ON ml_model_evaluation(model_id);
CREATE INDEX IF NOT EXISTS idx_ml_model_versions_model ON ml_model_versions(model_id);

-- Enable Row Level Security
ALTER TABLE ml_model_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_model_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_training_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_feature_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_feature_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_model_evaluation ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_model_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view active models"
  ON ml_model_registry FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can view their own predictions"
  ON ml_predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own feature values"
  ON ml_feature_values FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND id = entity_id
      AND entity_type = 'user'
    )
  );

-- Insert default ML models
INSERT INTO ml_model_registry (
  name,
  model_type,
  description,
  version,
  framework,
  model_architecture,
  hyperparameters,
  training_metrics
)
VALUES
  (
    'DNA Analyzer Pro',
    'dna_analysis',
    'Advanced DNA analysis model for genetic genealogy',
    '1.0.0',
    'tensorflow',
    '{
      "type": "transformer",
      "layers": 12,
      "heads": 8,
      "dimension": 768,
      "vocab_size": 50000
    }'::jsonb,
    '{
      "learning_rate": 0.0001,
      "batch_size": 32,
      "epochs": 100,
      "optimizer": "adam"
    }'::jsonb,
    '{
      "accuracy": 0.95,
      "precision": 0.94,
      "recall": 0.93,
      "f1_score": 0.94
    }'::jsonb
  ),
  (
    'Record Matcher Elite',
    'record_matching',
    'Advanced record matching model for genealogy research',
    '1.0.0',
    'pytorch',
    '{
      "type": "siamese_network",
      "embedding_dim": 512,
      "distance_metric": "cosine"
    }'::jsonb,
    '{
      "learning_rate": 0.0002,
      "batch_size": 64,
      "epochs": 50,
      "optimizer": "adamw"
    }'::jsonb,
    '{
      "accuracy": 0.92,
      "precision": 0.91,
      "recall": 0.90,
      "f1_score": 0.91
    }'::jsonb
  ),
  (
    'Relationship Inferencer',
    'relationship_inference',
    'Advanced relationship inference model for family trees',
    '1.0.0',
    'tensorflow',
    '{
      "type": "graph_neural_network",
      "layers": 6,
      "hidden_dim": 256,
      "output_dim": 128
    }'::jsonb,
    '{
      "learning_rate": 0.0003,
      "batch_size": 128,
      "epochs": 75,
      "optimizer": "adam"
    }'::jsonb,
    '{
      "accuracy": 0.89,
      "precision": 0.88,
      "recall": 0.87,
      "f1_score": 0.88
    }'::jsonb
  );

-- Insert default features
INSERT INTO ml_feature_store (
  feature_name,
  feature_type,
  description,
  data_type,
  validation_rules,
  transformation_rules
)
VALUES
  (
    'dna_similarity_score',
    'dna_analysis',
    'DNA similarity score between individuals',
    'float',
    '{
      "min": 0.0,
      "max": 1.0
    }'::jsonb,
    '{
      "normalize": true,
      "scale": [0, 1]
    }'::jsonb
  ),
  (
    'name_similarity_score',
    'record_matching',
    'Name similarity score for record matching',
    'float',
    '{
      "min": 0.0,
      "max": 1.0
    }'::jsonb,
    '{
      "normalize": true,
      "scale": [0, 1],
      "method": "levenshtein"
    }'::jsonb
  ),
  (
    'relationship_probability',
    'relationship_inference',
    'Probability score for inferred relationships',
    'float',
    '{
      "min": 0.0,
      "max": 1.0
    }'::jsonb,
    '{
      "normalize": true,
      "scale": [0, 1],
      "method": "softmax"
    }'::jsonb
  );

-- Create triggers
CREATE TRIGGER on_ml_prediction
  BEFORE INSERT
  ON ml_predictions
  FOR EACH ROW
  EXECUTE FUNCTION process_ml_prediction();

CREATE TRIGGER on_entity_update
  AFTER INSERT OR UPDATE
  ON public.family_members
  FOR EACH ROW
  EXECUTE FUNCTION update_ml_features(); 