-- External Service Integrations

-- Create external service providers table
CREATE TABLE IF NOT EXISTS external_service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  service_type text NOT NULL,
  description text,
  api_endpoint text,
  api_version text,
  authentication_type text NOT NULL,
  credentials_schema jsonb NOT NULL,
  rate_limits jsonb,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user service connections
CREATE TABLE IF NOT EXISTS user_service_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES external_service_providers(id) ON DELETE CASCADE,
  connection_type text NOT NULL,
  credentials jsonb NOT NULL,
  refresh_token text,
  token_expires_at timestamptz,
  last_sync_at timestamptz,
  sync_status text DEFAULT 'pending',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider_id, connection_type)
);

-- Create service sync logs
CREATE TABLE IF NOT EXISTS service_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES user_service_connections(id) ON DELETE CASCADE,
  sync_type text NOT NULL,
  status text NOT NULL,
  started_at timestamptz NOT NULL,
  completed_at timestamptz,
  items_processed integer DEFAULT 0,
  items_succeeded integer DEFAULT 0,
  items_failed integer DEFAULT 0,
  error_details jsonb,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create external data mappings
CREATE TABLE IF NOT EXISTS external_data_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES external_service_providers(id) ON DELETE CASCADE,
  mapping_type text NOT NULL,
  source_field text NOT NULL,
  target_field text NOT NULL,
  transformation_rules jsonb,
  validation_rules jsonb,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create external data cache
CREATE TABLE IF NOT EXISTS external_data_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES user_service_connections(id) ON DELETE CASCADE,
  data_type text NOT NULL,
  external_id text NOT NULL,
  data jsonb NOT NULL,
  last_updated_at timestamptz NOT NULL,
  expires_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(connection_id, data_type, external_id)
);

-- Create service webhooks
CREATE TABLE IF NOT EXISTS service_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES external_service_providers(id) ON DELETE CASCADE,
  webhook_type text NOT NULL,
  endpoint_url text NOT NULL,
  secret_key text NOT NULL,
  events text[] NOT NULL,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create webhook deliveries
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid REFERENCES service_webhooks(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  response_status integer,
  response_body text,
  error_message text,
  attempt_count integer DEFAULT 0,
  next_retry_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create function to handle service synchronization
CREATE OR REPLACE FUNCTION sync_external_service()
RETURNS TRIGGER AS $$
DECLARE
  sync_log_id uuid;
BEGIN
  -- Create sync log entry
  INSERT INTO service_sync_logs (
    connection_id,
    sync_type,
    status,
    started_at
  )
  VALUES (
    NEW.id,
    NEW.connection_type,
    'in_progress',
    now()
  )
  RETURNING id INTO sync_log_id;

  -- Update last sync timestamp
  NEW.last_sync_at := now();
  NEW.sync_status := 'in_progress';

  -- Store sync log ID in metadata
  NEW.metadata := NEW.metadata || 
    jsonb_build_object('current_sync_log_id', sync_log_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to handle webhook delivery
CREATE OR REPLACE FUNCTION deliver_webhook()
RETURNS TRIGGER AS $$
DECLARE
  webhook_record service_webhooks;
  delivery_id uuid;
BEGIN
  -- Get webhook configuration
  SELECT * INTO webhook_record
  FROM service_webhooks
  WHERE provider_id = NEW.provider_id
  AND webhook_type = NEW.event_type
  AND is_active = true;

  IF webhook_record IS NOT NULL THEN
    -- Create webhook delivery record
    INSERT INTO webhook_deliveries (
      webhook_id,
      event_type,
      payload,
      next_retry_at
    )
    VALUES (
      webhook_record.id,
      NEW.event_type,
      NEW.payload,
      now() + interval '5 minutes'
    )
    RETURNING id INTO delivery_id;

    -- Store delivery ID in metadata
    NEW.metadata := NEW.metadata || 
      jsonb_build_object('webhook_delivery_id', delivery_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_service_connections_user ON user_service_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_service_connections_provider ON user_service_connections(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_sync_logs_connection ON service_sync_logs(connection_id);
CREATE INDEX IF NOT EXISTS idx_external_data_mappings_provider ON external_data_mappings(provider_id);
CREATE INDEX IF NOT EXISTS idx_external_data_cache_connection ON external_data_cache(connection_id);
CREATE INDEX IF NOT EXISTS idx_external_data_cache_type ON external_data_cache(data_type);
CREATE INDEX IF NOT EXISTS idx_service_webhooks_provider ON service_webhooks(provider_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);

-- Enable Row Level Security
ALTER TABLE external_service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_service_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_data_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own service connections"
  ON user_service_connections FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own sync logs"
  ON service_sync_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_service_connections
      WHERE id = service_sync_logs.connection_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own cached data"
  ON external_data_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_service_connections
      WHERE id = external_data_cache.connection_id
      AND user_id = auth.uid()
    )
  );

-- Insert default service providers
INSERT INTO external_service_providers (
  name,
  service_type,
  description,
  api_endpoint,
  api_version,
  authentication_type,
  credentials_schema,
  rate_limits
)
VALUES
  (
    'AncestryDNA',
    'dna_analysis',
    'AncestryDNA genetic testing and analysis service',
    'https://api.ancestry.com/v1',
    '1.0',
    'oauth2',
    '{
      "client_id": "string",
      "client_secret": "string",
      "redirect_uri": "string",
      "scope": ["dna_read", "tree_read"]
    }'::jsonb,
    '{
      "requests_per_minute": 60,
      "requests_per_day": 10000
    }'::jsonb
  ),
  (
    'FamilySearch',
    'genealogy_records',
    'FamilySearch historical records and family tree service',
    'https://api.familysearch.org/v2',
    '2.0',
    'oauth2',
    '{
      "client_id": "string",
      "client_secret": "string",
      "redirect_uri": "string",
      "scope": ["records_read", "tree_read"]
    }'::jsonb,
    '{
      "requests_per_minute": 30,
      "requests_per_day": 5000
    }'::jsonb
  ),
  (
    'MyHeritage',
    'dna_analysis',
    'MyHeritage DNA testing and family tree service',
    'https://api.myheritage.com/v1',
    '1.0',
    'oauth2',
    '{
      "client_id": "string",
      "client_secret": "string",
      "redirect_uri": "string",
      "scope": ["dna_read", "tree_read"]
    }'::jsonb,
    '{
      "requests_per_minute": 45,
      "requests_per_day": 8000
    }'::jsonb
  );

-- Insert default data mappings
INSERT INTO external_data_mappings (
  provider_id,
  mapping_type,
  source_field,
  target_field,
  transformation_rules,
  validation_rules
)
SELECT
  id,
  'dna_results',
  'raw_data',
  'processed_data',
  '{
    "transformations": [
      {
        "type": "normalize",
        "field": "chromosome",
        "format": "uppercase"
      },
      {
        "type": "convert",
        "field": "position",
        "to": "integer"
      }
    ]
  }'::jsonb,
  '{
    "validations": [
      {
        "field": "chromosome",
        "type": "enum",
        "values": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "X", "Y", "MT"]
      },
      {
        "field": "position",
        "type": "range",
        "min": 1,
        "max": 250000000
      }
    ]
  }'::jsonb
FROM external_service_providers
WHERE service_type = 'dna_analysis';

-- Create triggers
CREATE TRIGGER on_service_connection_sync
  AFTER INSERT OR UPDATE OF sync_status
  ON user_service_connections
  FOR EACH ROW
  WHEN (NEW.sync_status = 'pending')
  EXECUTE FUNCTION sync_external_service();

CREATE TRIGGER on_webhook_event
  AFTER INSERT
  ON service_webhooks
  FOR EACH ROW
  EXECUTE FUNCTION deliver_webhook(); 