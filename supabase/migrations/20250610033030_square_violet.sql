/*
  # Database Performance Functions

  1. Functions
    - `get_database_stats`: Function to retrieve database statistics
    - `get_database_performance`: Function to measure query performance
    - `optimize_database_performance`: Function to optimize database performance
  
  2. Security
    - Functions are security definer to ensure proper access to system tables
*/

-- Create function to get database statistics
CREATE OR REPLACE FUNCTION get_database_stats()
RETURNS TABLE (
  size bigint,
  connections integer,
  active_queries integer,
  cache_hit_ratio numeric,
  index_usage_ratio numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_db_name text := current_database();
BEGIN
  RETURN QUERY
  WITH db_stats AS (
    SELECT
      pg_database_size(v_db_name) as db_size,
      (SELECT count(*) FROM pg_stat_activity WHERE datname = v_db_name) as conn_count,
      (SELECT count(*) FROM pg_stat_activity 
       WHERE datname = v_db_name AND state = 'active' AND pid <> pg_backend_pid()) as active_count
  ),
  cache_stats AS (
    SELECT
      sum(heap_blks_read) as heap_read,
      sum(heap_blks_hit) as heap_hit,
      sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) as cache_ratio
    FROM pg_statio_user_tables
  ),
  index_stats AS (
    SELECT
      sum(idx_scan) as idx_scan,
      sum(seq_scan) as seq_scan,
      sum(idx_scan) / NULLIF(sum(idx_scan) + sum(seq_scan), 0) as index_ratio
    FROM pg_stat_user_tables
  )
  SELECT
    db_stats.db_size,
    db_stats.conn_count,
    db_stats.active_count,
    cache_stats.cache_ratio,
    index_stats.index_ratio
  FROM db_stats, cache_stats, index_stats;
END;
$$;

-- Create function to get database performance
CREATE OR REPLACE FUNCTION get_database_performance()
RETURNS TABLE (
  avg_query_time numeric,
  cache_hit_ratio numeric,
  index_usage_ratio numeric,
  slow_queries integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH query_stats AS (
    SELECT
      mean_exec_time,
      calls
    FROM pg_stat_statements
    WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
  ),
  cache_stats AS (
    SELECT
      sum(heap_blks_read) as heap_read,
      sum(heap_blks_hit) as heap_hit,
      sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) as cache_ratio
    FROM pg_statio_user_tables
  ),
  index_stats AS (
    SELECT
      sum(idx_scan) as idx_scan,
      sum(seq_scan) as seq_scan,
      sum(idx_scan) / NULLIF(sum(idx_scan) + sum(seq_scan), 0) as index_ratio
    FROM pg_stat_user_tables
  ),
  slow_query_count AS (
    SELECT
      count(*) as slow_count
    FROM pg_stat_statements
    WHERE mean_exec_time > 1000 -- queries taking more than 1 second
    AND dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
  )
  SELECT
    (SELECT sum(mean_exec_time * calls) / NULLIF(sum(calls), 0) FROM query_stats) as avg_query_time,
    cache_stats.cache_ratio,
    index_stats.index_ratio,
    slow_query_count.slow_count
  FROM cache_stats, index_stats, slow_query_count;
END;
$$;

-- Create function to optimize database performance
CREATE OR REPLACE FUNCTION optimize_database_performance()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result text;
BEGIN
  -- Analyze all tables to update statistics
  ANALYZE;
  
  -- Vacuum to reclaim space and update statistics
  VACUUM ANALYZE;
  
  -- Reset pg_stat_statements to clear query statistics
  SELECT pg_stat_statements_reset() INTO v_result;
  
  RETURN 'Database optimization completed successfully';
END;
$$;