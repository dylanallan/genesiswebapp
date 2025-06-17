-- Create document analysis table
CREATE TABLE IF NOT EXISTS document_analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'completed',
  error_message TEXT,
  metadata JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_document_analysis_user_id ON document_analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_document_analysis_created_at ON document_analysis_results(created_at);
CREATE INDEX IF NOT EXISTS idx_document_analysis_status ON document_analysis_results(status);
CREATE INDEX IF NOT EXISTS idx_document_analysis_data ON document_analysis_results USING GIN (analysis_data);

-- Enable Row Level Security
ALTER TABLE document_analysis_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own document analysis results"
  ON document_analysis_results
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own document analysis results"
  ON document_analysis_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own document analysis results"
  ON document_analysis_results
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own document analysis results"
  ON document_analysis_results
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_document_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_document_analysis_updated_at
  BEFORE UPDATE ON document_analysis_results
  FOR EACH ROW
  EXECUTE FUNCTION update_document_analysis_updated_at();

-- Create function to process document analysis
CREATE OR REPLACE FUNCTION process_document_analysis(
  analysis_data JSONB,
  user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  analysis_id UUID;
BEGIN
  -- Insert analysis result
  INSERT INTO document_analysis_results (
    analysis_data,
    user_id,
    status,
    metadata
  )
  VALUES (
    analysis_data,
    user_id,
    'completed',
    jsonb_build_object(
      'version', '1.0',
      'processed_at', now()
    )
  )
  RETURNING id INTO analysis_id;

  -- Return the analysis ID
  RETURN analysis_id;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON document_analysis_results TO authenticated;
GRANT EXECUTE ON FUNCTION process_document_analysis TO authenticated;

-- Create view for document analysis statistics
CREATE OR REPLACE VIEW document_analysis_stats AS
SELECT
  user_id,
  COUNT(*) as total_analyses,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_analyses,
  COUNT(*) FILTER (WHERE status = 'error') as failed_analyses,
  MIN(created_at) as first_analysis,
  MAX(created_at) as latest_analysis,
  AVG((analysis_data->>'confidence')::float) as avg_confidence,
  AVG((analysis_data->'findings'->'quality'->>'score')::float) as avg_quality_score
FROM document_analysis_results
GROUP BY user_id;

-- Grant access to the view
GRANT SELECT ON document_analysis_stats TO authenticated; 