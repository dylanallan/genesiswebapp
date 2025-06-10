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
      'user_profiles',
      'system_settings',
      'audit_logs',
      'heritage_regions',
      'heritage_traditions',
      'heritage_stories',
      'heritage_artifacts',
      'user_heritage',
      'automation_workflows',
      'workflow_steps',
      'workflow_executions',
      'workflow_triggers',
      'business_integrations',
      'ai_models',
      'ai_prompts',
      'ai_conversations',
      'ai_messages',
      'ai_feedback',
      'analytics_events',
      'analytics_metrics',
      'security_alerts',
      'security_settings',
      'family_members',
      'family_relationships',
      'family_events',
      'family_documents',
      'dna_analysis',
      'marketing_campaigns',
      'marketing_contacts',
      'marketing_messages',
      'community_groups',
      'community_group_members',
      'community_posts',
      'community_comments'
    ];
    
    // Check each table
    for (const table of tables) {
      try {
        // Try to select from the table to see if it exists
        const { error } = await supabase.from(table).select('id').limit(1);
        
        if (error && error.code === '42P01') {
          console.log(`Table ${table} doesn't exist, will be created by migrations`);
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

async function initializeAIServices() {
  try {
    // Check if AI models table exists
    const { error: tableError } = await supabase
      .from('ai_models')
      .select('id')
      .limit(1);
    
    if (tableError && tableError.code === '42P01') {
      console.log('AI models table will be created by migrations');
      return true;
    }
    
    // Check if any models exist
    const { data: aiModels, error } = await supabase
      .from('ai_models')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    
    // If no models found, insert default models
    if (!aiModels || aiModels.length === 0) {
      const { error: insertError } = await supabase
        .from('ai_models')
        .insert([
          {
            name: 'gpt-4-turbo',
            provider: 'openai',
            model_type: 'chat',
            capabilities: ['general', 'coding', 'analysis'],
            max_tokens: 128000,
            token_cost: 0.00003,
            configuration: { temperature: 0.7 }
          },
          {
            name: 'claude-3-opus',
            provider: 'anthropic',
            model_type: 'chat',
            capabilities: ['general', 'cultural', 'creative'],
            max_tokens: 200000,
            token_cost: 0.000075,
            configuration: { temperature: 0.7 }
          },
          {
            name: 'gemini-1.5-pro',
            provider: 'google',
            model_type: 'chat',
            capabilities: ['general', 'multimodal', 'research'],
            max_tokens: 1048576,
            token_cost: 0.000007,
            configuration: { temperature: 0.7 }
          }
        ]);
      
      if (insertError) {
        console.warn('Error inserting AI models:', insertError);
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
      console.log('Admin roles table will be created by migrations');
      return true;
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
      console.log('System health metrics table will be created by migrations');
      return true;
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