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
    
    // If Supabase is not connected, return early
    if (!supabaseConnected) {
      return {
        supabaseConnected: false,
        edgeFunctionsDeployed: false,
        aiServicesConfigured: false,
        databaseMigrated: false,
        adminConfigured: false,
        overallStatus: 'offline'
      };
    }
    
    // Check if database is migrated by checking if key tables exist
    let databaseMigrated = false;
    try {
      const { data: tableCheck, error: tableError } = await supabase
        .from('cultural_artifacts')
        .select('id')
        .limit(1);
      
      databaseMigrated = !tableError;
    } catch (error) {
      console.warn('Database migration check failed:', error);
      databaseMigrated = false;
    }
    
    // Check if AI services are configured
    let aiServicesConfigured = false;
    try {
      const { data: aiServices, error: aiError } = await supabase
        .from('ai_service_config')
        .select('service_name, is_active')
        .limit(1);
      
      aiServicesConfigured = !aiError && !!aiServices && aiServices.length > 0;
    } catch (error) {
      console.warn('AI Services check failed:', error);
      aiServicesConfigured = false;
    }
    
    // Check if admin is configured
    let adminConfigured = false;
    try {
      const { data: admins, error: adminError } = await supabase
        .from('admin_roles')
        .select('id')
        .limit(1);
      
      adminConfigured = !adminError && !!admins && admins.length > 0;
    } catch (error) {
      console.warn('Admin configuration check failed:', error);
      adminConfigured = false;
    }
    
    // Check if Edge Functions are deployed
    // Since we can't directly check this in WebContainer, we'll use a proxy check
    let edgeFunctionsDeployed = false;
    try {
      // Check if the edge functions table exists as a proxy
      const { data: edgeFunctions, error: edgeError } = await supabase
        .from('ai_request_logs')
        .select('id')
        .limit(1);
      
      // If the table exists, we'll assume edge functions are deployed
      edgeFunctionsDeployed = !edgeError;
    } catch (error) {
      console.warn('Edge Functions check failed:', error);
      edgeFunctionsDeployed = false;
    }
    
    // Determine overall status
    let overallStatus: 'operational' | 'partial' | 'offline';
    
    if (!supabaseConnected) {
      overallStatus = 'offline';
    } else if (
      databaseMigrated && 
      aiServicesConfigured && 
      adminConfigured &&
      edgeFunctionsDeployed
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