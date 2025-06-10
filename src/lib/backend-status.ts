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
      // Check for user_profiles table as an indicator of migration status
      const { data: tableCheck, error: tableError } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      if (tableError && tableError.code === '42P01') {
        // Table doesn't exist
        databaseMigrated = false;
      } else {
        databaseMigrated = true;
      }
    } catch (error) {
      console.warn('Database migration check failed:', error);
      databaseMigrated = false;
    }
    
    // Check if AI services are configured
    let aiServicesConfigured = false;
    try {
      const { data: aiModels, error: aiError } = await supabase
        .from('ai_models')
        .select('id')
        .limit(1);
      
      if (aiError && aiError.code === '42P01') {
        // Table doesn't exist
        aiServicesConfigured = false;
      } else {
        aiServicesConfigured = !aiError && !!aiModels;
      }
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
      
      if (adminError && adminError.code === '42P01') {
        // Table doesn't exist
        adminConfigured = false;
      } else {
        adminConfigured = !adminError && !!admins && admins.length > 0;
      }
    } catch (error) {
      console.warn('Admin configuration check failed:', error);
      adminConfigured = false;
    }
    
    // Check if Edge Functions are deployed
    // Since we can't directly check this in WebContainer, we'll use a proxy check
    let edgeFunctionsDeployed = false;
    try {
      // Try to call a simple edge function
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/health-check`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      edgeFunctionsDeployed = response.ok;
    } catch (error) {
      // If we can't connect, assume edge functions aren't deployed
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