/*
  # AI Router System Tables

  1. New Tables
    - `ai_models`: Stores available AI model configurations
    - `knowledge_sources`: Tracks different knowledge sources
    - `knowledge_base`: Stores actual knowledge content
    
  2. Functions
    - `search_knowledge_base`: Vector similarity search for relevant knowledge
    
  3. Security
    - RLS policies for all tables
    - Secure access patterns for AI models and knowledge
*/

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- AI Models Table
CREATE TABLE IF NOT EXISTS ai_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  version text NOT NULL,
  capabilities text[] NOT NULL DEFAULT '{}',
  context_window integer NOT NULL DEFAULT 4096,
  api_endpoint text NOT NULL,
  api_key text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, version)
);

-- Knowledge Sources Table
CREATE TABLE IF NOT EXISTS knowledge_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('api', 'database', 'webscrape', 'document')),
  url text,
  reliability numeric NOT NULL DEFAULT 0.5 CHECK (reliability >= 0 AND reliability <= 1),
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Knowledge Base Table
CREATE TABLE IF NOT EXISTS knowledge_base (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES knowledge_sources(id) ON DELETE CASCADE,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  embedding vector(1536),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_knowledge_sources_type ON knowledge_sources(type);
CREATE INDEX IF NOT EXISTS idx_ai_models_name_version ON ai_models(name, version);

-- Enable RLS
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to AI models" ON ai_models
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access to knowledge sources" ON knowledge_sources
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read access to knowledge base" ON knowledge_base
  FOR SELECT TO authenticated USING (true);

-- Create function for similarity search
CREATE OR REPLACE FUNCTION search_knowledge_base(
  query_text text,
  similarity_threshold float DEFAULT 0.7,
  max_results int DEFAULT 5
) RETURNS TABLE (
  id uuid,
  content jsonb,
  similarity float
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.content,
    1 - (kb.embedding <=> query_embedding) as similarity
  FROM
    knowledge_base kb,
    generate_embeddings(query_text) query_embedding
  WHERE
    1 - (kb.embedding <=> query_embedding) > similarity_threshold
  ORDER BY
    similarity DESC
  LIMIT max_results;
END;
$$;

-- Update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_ai_models_updated_at
  BEFORE UPDATE ON ai_models
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_sources_updated_at
  BEFORE UPDATE ON knowledge_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at
  BEFORE UPDATE ON knowledge_base
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();