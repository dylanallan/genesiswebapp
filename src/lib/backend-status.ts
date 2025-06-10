import { supabase } from './supabase';

export interface BackendStatus {
  supabaseConnected: boolean;
  edgeFunctionsDeployed: boolean;
  aiServicesConfigured: boolean;
  databaseMigrated: boolean;
  adminConfigured: boolean;
  overallStatus: 'operational' | 'partial' | 'offline';
}

export async function checkBackendStatus(): Promise<BackendStatus> {
  try {
    // Check Supabase connection
    const { data: connectionTest, error: connectionError } = await supabase.from('system_health_metrics').select('id').limit(1);
    const supabaseConnected = !connectionError;
    
    // Check if Edge Functions are deployed
    const edgeFunctionsDeployed = await checkEdgeFunctions();
    
    // Check if AI services are configured
    const aiServicesConfigured = await checkAIServices();
    
    // Check if database is migrated
    const databaseMigrated = await checkDatabaseMigration();
    
    // Check if admin is configured
    const adminConfigured = await checkAdminConfiguration();
    
    // Determine overall status
    let overallStatus: 'operational' | 'partial' | 'offline';
    
    if (!supabaseConnected) {
      overallStatus = 'offline';
    } else if (
      edgeFunctionsDeployed && 
      aiServicesConfigured && 
      databaseMigrated && 
      adminConfigured
    ) {
      overallStatus = 'operational';
    } else {
      overallStatus = 'partial';
    }
    
    return {
      supabaseConnected,
      edgeFunctionsDeployed,
      aiServicesConfigured,
      databaseMigrated,
      adminConfigured,
      overallStatus
    };
  } catch (error) {
    console.error('Error checking backend status:', error);
    
    return {
      supabaseConnected: false,
      edgeFunctionsDeployed: false,
      aiServicesConfigured: false,
      databaseMigrated: false,
      adminConfigured: false,
      overallStatus: 'offline'
    };
  }
}

async function checkEdgeFunctions(): Promise<boolean> {
  try {
    // Try to call a simple edge function
    const { data: sessionData } = await supabase.auth.getSession();
    
    if (!sessionData.session) {
      return false;
    }
    
    const response = await fetch(`${supabase.supabaseUrl}/functions/v1/ai-health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionData.session.access_token}`
      }
    });
    
    return response.ok;
  } catch (error) {
    console.warn('Edge Functions check failed:', error);
    return false;
  }
}

async function checkAIServices(): Promise<boolean> {
  try {
    // Check if AI services are configured
    const { data: aiServices, error } = await supabase
      .from('ai_service_config')
      .select('service_name, is_active')
      .limit(1);
    
    if (error) throw error;
    
    return !!aiServices && aiServices.length > 0;
  } catch (error) {
    console.warn('AI Services check failed:', error);
    return false;
  }
}

async function checkDatabaseMigration(): Promise<boolean> {
  try {
    // Check if key tables exist
    const { data: tableCheck, error } = await supabase.rpc('check_tables_exist', {
      p_tables: ['cultural_artifacts', 'traditions', 'celebrations', 'ai_models']
    });
    
    if (error) {
      // If the function doesn't exist, try a direct check
      const { data: artifacts, error: artifactsError } = await supabase
        .from('cultural_artifacts')
        .select('id')
        .limit(1);
      
      return !artifactsError;
    }
    
    return !!tableCheck;
  } catch (error) {
    console.warn('Database migration check failed:', error);
    return false;
  }
}

async function checkAdminConfiguration(): Promise<boolean> {
  try {
    // Check if any admin exists
    const { data: admins, error } = await supabase
      .from('admin_roles')
      .select('id')
      .limit(1);
    
    if (error) throw error;
    
    return !!admins && admins.length > 0;
  } catch (error) {
    console.warn('Admin configuration check failed:', error);
    return false;
  }
}