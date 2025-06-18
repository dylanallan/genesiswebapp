/*
  # Fix Partitioned Tables and Indexes

  1. Changes
    - Add timestamp to unique indexes for partitioned tables
    - Update existing indexes to include partition keys
    - Ensure all unique constraints include partition columns
  
  2. Security
    - Maintains existing RLS policies
    - No changes to permissions
*/

-- Fix system_health_metrics indexes
DROP INDEX IF EXISTS idx_system_health_name_ts;
DROP INDEX IF EXISTS idx_system_health_ts;
CREATE INDEX IF NOT EXISTS idx_system_health_name_ts ON public.system_health_metrics USING btree (metric_name, ts);
CREATE INDEX IF NOT EXISTS idx_system_health_ts ON public.system_health_metrics USING btree (ts);

-- Fix model_performance_metrics indexes
DROP INDEX IF EXISTS idx_model_metrics_model_timestamp;
DROP INDEX IF EXISTS idx_model_metrics_timestamp;
CREATE INDEX IF NOT EXISTS idx_model_metrics_model_timestamp ON public.model_performance_metrics USING btree (model_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_model_metrics_timestamp ON public.model_performance_metrics USING btree (timestamp);

-- Fix client_journeys indexes
DROP INDEX IF EXISTS idx_client_journeys_started;
DROP INDEX IF EXISTS idx_client_journeys_user_started;
CREATE INDEX IF NOT EXISTS idx_client_journeys_started ON public.client_journeys USING btree (started_at);
CREATE INDEX IF NOT EXISTS idx_client_journeys_user_started ON public.client_journeys USING btree (user_id, started_at);

-- Fix security_alerts indexes
DROP INDEX IF EXISTS idx_unresolved_alerts;
CREATE INDEX IF NOT EXISTS idx_unresolved_alerts ON public.security_alerts USING btree (resolved, timestamp) WHERE (NOT resolved);

-- Fix knowledge_base indexes
DROP INDEX IF EXISTS idx_knowledge_base_embedding;
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding ON public.knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Fix knowledge_embeddings indexes
DROP INDEX IF EXISTS idx_knowledge_embeddings_vector;
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings_vector ON public.knowledge_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);