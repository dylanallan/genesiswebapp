-- Create relationship inference table
CREATE TABLE IF NOT EXISTS relationship_inference_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inference_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'completed',
  error_message TEXT,
  metadata JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_relationship_inference_user_id ON relationship_inference_results(user_id);
CREATE INDEX IF NOT EXISTS idx_relationship_inference_created_at ON relationship_inference_results(created_at);
CREATE INDEX IF NOT EXISTS idx_relationship_inference_status ON relationship_inference_results(status);
CREATE INDEX IF NOT EXISTS idx_relationship_inference_data ON relationship_inference_results USING GIN (inference_data);

-- Enable Row Level Security
ALTER TABLE relationship_inference_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own relationship inference results"
  ON relationship_inference_results
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own relationship inference results"
  ON relationship_inference_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own relationship inference results"
  ON relationship_inference_results
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own relationship inference results"
  ON relationship_inference_results
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_relationship_inference_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_relationship_inference_updated_at
  BEFORE UPDATE ON relationship_inference_results
  FOR EACH ROW
  EXECUTE FUNCTION update_relationship_inference_updated_at();

-- Create function to process relationship inference
CREATE OR REPLACE FUNCTION process_relationship_inference(
  inference_data JSONB,
  user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inference_id UUID;
BEGIN
  -- Insert inference result
  INSERT INTO relationship_inference_results (
    inference_data,
    user_id,
    status,
    metadata
  )
  VALUES (
    inference_data,
    user_id,
    'completed',
    jsonb_build_object(
      'version', '1.0',
      'processed_at', now()
    )
  )
  RETURNING id INTO inference_id;

  -- Return the inference ID
  RETURN inference_id;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON relationship_inference_results TO authenticated;
GRANT EXECUTE ON FUNCTION process_relationship_inference TO authenticated;

-- Create view for relationship inference statistics
CREATE OR REPLACE VIEW relationship_inference_stats AS
SELECT
  user_id,
  COUNT(*) as total_inferences,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_inferences,
  COUNT(*) FILTER (WHERE status = 'error') as failed_inferences,
  MIN(created_at) as first_inference,
  MAX(created_at) as latest_inference,
  AVG((inference_data->>'confidence')::float) as avg_confidence
FROM relationship_inference_results
GROUP BY user_id;

-- Grant access to the view
GRANT SELECT ON relationship_inference_stats TO authenticated; 