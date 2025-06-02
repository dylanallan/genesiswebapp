/*
  # Enhanced AI System Schema

  1. New Tables
    - model_performance_metrics: Tracks AI model performance
    - knowledge_embeddings: Stores vector embeddings for knowledge base
    - system_learnings: Captures system learning patterns
  
  2. Functions
    - update_model_metrics: Records model performance
    - compute_embedding: Generates embeddings for text
    - find_similar_content: Finds similar content using embeddings
    - refresh_model_performance_summary: Updates performance summary
  
  3. Materialized Views
    - model_performance_summary: Quick access to recent model performance

  4. Security
    - RLS enabled on all tables
    - Policies for authenticated access
*/

-- Model Performance Metrics
CREATE TABLE IF NOT EXISTS model_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES ai_models(id) ON DELETE CASCADE,
  metric_type text NOT NULL,
  value numeric NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- Knowledge Embeddings
CREATE TABLE IF NOT EXISTS knowledge_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL,
  embedding vector(1536),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- System Learnings
CREATE TABLE IF NOT EXISTS system_learnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  pattern jsonb NOT NULL,
  confidence numeric NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  applications text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_model_metrics_model_id ON model_performance_metrics(model_id);
CREATE INDEX IF NOT EXISTS idx_model_metrics_timestamp ON model_performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_vector ON knowledge_embeddings USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_system_learnings_category ON system_learnings(category);

-- Create materialized view for quick access to recent model performance
CREATE MATERIALIZED VIEW model_performance_summary AS
SELECT 
  model_id,
  metric_type,
  avg(value) as avg_value,
  count(*) as sample_count,
  max(timestamp) as last_updated
FROM model_performance_metrics
WHERE timestamp > now() - interval '7 days'
GROUP BY model_id, metric_type;

-- Create function to update model metrics
CREATE OR REPLACE FUNCTION update_model_metrics(
  p_model_id uuid,
  p_metric_type text,
  p_value numeric
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO model_performance_metrics (model_id, metric_type, value)
  VALUES (p_model_id, p_metric_type, p_value);
END;
$$;

-- Create function to compute embedding
CREATE OR REPLACE FUNCTION compute_embedding(
  input_text text,
  model_name text DEFAULT 'text-embedding-3-small'
) RETURNS vector(1536)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_embedding vector(1536);
BEGIN
  -- Implementation would call external embedding service
  -- This is a placeholder that should be replaced with actual implementation
  RETURN v_embedding;
END;
$$;

-- Create function to find similar content
CREATE OR REPLACE FUNCTION find_similar_content(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  max_results integer DEFAULT 5
) RETURNS TABLE (
  content_id uuid,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ke.content_id,
    1 - (ke.embedding <=> query_embedding) as similarity
  FROM knowledge_embeddings ke
  WHERE 1 - (ke.embedding <=> query_embedding) > similarity_threshold
  ORDER BY similarity DESC
  LIMIT max_results;
END;
$$;

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_model_performance_summary()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY model_performance_summary;
END;
$$;

-- Enable RLS
ALTER TABLE model_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_learnings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to model metrics" ON model_performance_metrics
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access to knowledge embeddings" ON knowledge_embeddings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access to system learnings" ON system_learnings
  FOR SELECT TO authenticated USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_knowledge_embeddings_updated_at
  BEFORE UPDATE ON knowledge_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_learnings_updated_at
  BEFORE UPDATE ON system_learnings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();