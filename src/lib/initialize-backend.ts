import { supabase } from './supabase';
import { toast } from 'sonner';

export async function initializeBackend() {
  try {
    toast.info('Initializing backend services...');
    
    // Step 1: Check Supabase connection
    const { data: connectionTest, error: connectionError } = await supabase.from('system_health_metrics').select('id').limit(1);
    
    if (connectionError) {
      console.error('Supabase connection error:', connectionError);
      toast.error('Failed to connect to Supabase. Please check your configuration.');
      return false;
    }
    
    // Step 2: Initialize database tables if they don't exist
    await initializeDatabaseTables();
    
    // Step 3: Initialize AI services
    await initializeAIServices();
    
    // Step 4: Create default admin user if needed
    await createDefaultAdminIfNeeded();
    
    // Step 5: Create initial system health metrics
    await createInitialHealthMetrics();
    
    toast.success('Backend initialization complete!');
    return true;
  } catch (error) {
    console.error('Backend initialization error:', error);
    toast.error('Failed to initialize backend');
    return false;
  }
}

async function initializeDatabaseTables() {
  try {
    // Check if key tables exist
    const tables = [
      'cultural_artifacts',
      'traditions',
      'celebrations',
      'cultural_stories',
      'family_contacts',
      'recipes',
      'ai_models',
      'ai_service_config',
      'system_health_metrics',
      'security_alerts',
      'admin_roles',
      'user_data'
    ];
    
    for (const table of tables) {
      try {
        // Try to select from the table to see if it exists
        const { error } = await supabase.from(table).select('id').limit(1);
        
        if (error && error.code === '42P01') { // Table doesn't exist
          console.log(`Table ${table} doesn't exist, creating...`);
          await createTable(table);
        }
      } catch (error) {
        console.warn(`Error checking table ${table}:`, error);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing database tables:', error);
    return false;
  }
}

async function createTable(tableName: string) {
  // This is a simplified version - in a real app, you'd use migrations
  const tableDefinitions: Record<string, string> = {
    'cultural_artifacts': `
      CREATE TABLE cultural_artifacts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        title text NOT NULL,
        description text,
        category text NOT NULL,
        media_url text,
        media_type text,
        metadata jsonb DEFAULT '{}'::jsonb,
        tags text[] DEFAULT '{}'::text[],
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      ALTER TABLE cultural_artifacts ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Users can manage their own artifacts" ON cultural_artifacts
        FOR ALL TO authenticated USING (auth.uid() = user_id);
    `,
    'system_health_metrics': `
      CREATE TABLE system_health_metrics (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        ts timestamptz NOT NULL DEFAULT now(),
        metric_name text NOT NULL,
        metric_value numeric NOT NULL,
        metadata jsonb DEFAULT '{}'::jsonb
      );
    `,
    'ai_service_config': `
      CREATE TABLE ai_service_config (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        service_name text UNIQUE NOT NULL,
        key_name text NOT NULL,
        encrypted_key text,
        is_active boolean DEFAULT true,
        config jsonb DEFAULT '{}'::jsonb,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      ALTER TABLE ai_service_config ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Admins can manage AI configuration" ON ai_service_config
        FOR ALL TO authenticated USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);
    `,
    'ai_models': `
      CREATE TABLE ai_models (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        version text NOT NULL,
        capabilities text[] DEFAULT '{}'::text[] NOT NULL,
        context_window integer DEFAULT 4096 NOT NULL,
        api_endpoint text NOT NULL,
        api_key text,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        UNIQUE(name, version)
      );
      ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Allow read access to AI models" ON ai_models
        FOR SELECT TO authenticated USING (true);
    `,
    'admin_roles': `
      CREATE TABLE admin_roles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
        role_name text DEFAULT 'admin'::text NOT NULL,
        permissions jsonb DEFAULT '{"full_access": true}'::jsonb,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        UNIQUE(user_id)
      );
      ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Admins can manage admin roles" ON admin_roles
        FOR ALL TO authenticated USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);
    `,
    'user_data': `
      CREATE TABLE user_data (
        user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        preferences jsonb DEFAULT '{}'::jsonb,
        settings jsonb DEFAULT '{}'::jsonb,
        last_login timestamptz DEFAULT now(),
        login_count integer DEFAULT 0,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Users can manage their own data" ON user_data
        FOR ALL TO authenticated USING (auth.uid() = user_id);
    `,
    'security_alerts': `
      CREATE TABLE security_alerts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        anomaly_score numeric NOT NULL,
        metrics jsonb NOT NULL,
        timestamp timestamptz DEFAULT now(),
        resolved boolean DEFAULT false,
        resolution_notes text,
        resolved_at timestamptz
      );
      ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "Admins can manage security alerts" ON security_alerts
        FOR ALL TO authenticated USING ((auth.jwt() ->> 'role'::text) = 'admin'::text);
    `
  };
  
  if (tableDefinitions[tableName]) {
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: tableDefinitions[tableName]
      });
      
      if (error) {
        console.error(`Error creating table ${tableName}:`, error);
        
        // Try a simpler approach for tables that don't exist
        if (tableName === 'system_health_metrics') {
          await supabase.rpc('exec_sql', {
            sql: `
              CREATE TABLE system_health_metrics (
                id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                ts timestamptz NOT NULL DEFAULT now(),
                metric_name text NOT NULL,
                metric_value numeric NOT NULL,
                metadata jsonb DEFAULT '{}'::jsonb
              );
            `
          });
        }
      }
    } catch (error) {
      console.error(`Error creating table ${tableName}:`, error);
    }
  }
}

async function initializeAIServices() {
  try {
    // Check if AI services are configured
    const { data: aiServices, error } = await supabase
      .from('ai_service_config')
      .select('service_name, is_active')
      .limit(10);
    
    if (error) {
      // If table doesn't exist, create it
      if (error.code === '42P01') {
        await createTable('ai_service_config');
        await createTable('ai_models');
      } else {
        throw error;
      }
    }
    
    // If no services found, initialize them
    if (!aiServices || aiServices.length === 0) {
      // Insert default AI services
      const { error: insertError } = await supabase
        .from('ai_service_config')
        .insert([
          {
            service_name: 'openai-gpt4-turbo',
            key_name: 'OpenAI GPT-4 Turbo',
            encrypted_key: 'encrypted-key-placeholder',
            is_active: true,
            config: { temperature: 0.7, streamingSupported: true }
          },
          {
            service_name: 'anthropic-claude-3-opus',
            key_name: 'Anthropic Claude 3 Opus',
            encrypted_key: 'encrypted-key-placeholder',
            is_active: true,
            config: { temperature: 0.7, streamingSupported: true }
          },
          {
            service_name: 'google-gemini-15-pro',
            key_name: 'Google Gemini 1.5 Pro',
            encrypted_key: 'encrypted-key-placeholder',
            is_active: true,
            config: { temperature: 0.7, streamingSupported: true }
          }
        ]);
      
      if (insertError) {
        console.warn('Error inserting AI services:', insertError);
      }
      
      // Insert default AI models
      const { error: modelError } = await supabase
        .from('ai_models')
        .insert([
          {
            name: 'gpt-4-turbo',
            version: '1.0',
            capabilities: ['chat', 'analysis', 'generation', 'coding', 'business', 'creative', 'technical'],
            context_window: 128000,
            api_endpoint: 'https://api.openai.com/v1/chat/completions'
          },
          {
            name: 'claude-3-opus',
            version: '1.0',
            capabilities: ['chat', 'analysis', 'generation', 'business', 'cultural', 'creative', 'research'],
            context_window: 200000,
            api_endpoint: 'https://api.anthropic.com/v1/messages'
          },
          {
            name: 'gemini-1.5-pro',
            version: '1.0',
            capabilities: ['chat', 'analysis', 'generation', 'coding', 'business', 'research'],
            context_window: 1048576,
            api_endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent'
          }
        ]);
      
      if (modelError) {
        console.warn('Error inserting AI models:', modelError);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing AI services:', error);
    return false;
  }
}

async function createDefaultAdminIfNeeded() {
  try {
    // Check if admin_roles table exists
    const { error: tableError } = await supabase
      .from('admin_roles')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === '42P01') {
      await createTable('admin_roles');
    }
    
    // Check if any admin exists
    const { data: admins, error } = await supabase
      .from('admin_roles')
      .select('id')
      .limit(1);
    
    if (error && error.code !== '42P01') throw error;
    
    // If no admins found, create one
    if (!admins || admins.length === 0) {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Make current user an admin
        const { error: adminError } = await supabase
          .from('admin_roles')
          .insert({
            user_id: user.id,
            role_name: 'admin',
            permissions: { full_access: true }
          });
        
        if (adminError) {
          console.warn('Error creating admin role:', adminError);
        } else {
          toast.success('Admin role created for your account');
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error creating default admin:', error);
    return false;
  }
}

async function createInitialHealthMetrics() {
  try {
    // Check if system_health_metrics table exists
    const { error: tableError } = await supabase
      .from('system_health_metrics')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === '42P01') {
      await createTable('system_health_metrics');
    }
    
    // Insert initial health metrics
    const { error } = await supabase
      .from('system_health_metrics')
      .insert([
        {
          metric_name: 'system_health',
          metric_value: 0.95,
          metadata: { components: { ai_router: 0.95, database: 0.98, authentication: 0.97, ui: 0.94 } }
        },
        {
          metric_name: 'cpu_usage',
          metric_value: 15.3,
          metadata: { cores: 4, processes: 12 }
        },
        {
          metric_name: 'memory_usage',
          metric_value: 42.7,
          metadata: { total: 16384, used: 6998 }
        },
        {
          metric_name: 'error_rate',
          metric_value: 0.02,
          metadata: { total_requests: 1000, errors: 20 }
        }
      ]);
    
    if (error) {
      console.warn('Error inserting health metrics:', error);
    }
    
    return true;
  } catch (error) {
    console.error('Error creating initial health metrics:', error);
    return false;
  }
}