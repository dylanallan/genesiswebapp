import { supabase } from './supabase';

export interface BackendStatus {
  supabaseConnected: boolean;
  databaseMigrated: boolean;
  aiServicesConfigured: boolean;
  adminConfigured: boolean;
  apiEndpointsConfigured: boolean;
  edgeFunctionsDeployed: boolean;
  storageBucketsConfigured: boolean;
  overallStatus: 'operational' | 'partial' | 'offline';
  details: {
    cleanupStatus?: { check_name: string; status: string; details: string }[];
    backendStatus?: { check_name: string; status: string; details: string }[];
    errors?: string[];
  };
}

export async function checkBackendStatus(): Promise<BackendStatus> {
  const status: BackendStatus = {
    supabaseConnected: false,
    databaseMigrated: false,
    aiServicesConfigured: false,
    adminConfigured: false,
    apiEndpointsConfigured: false,
    edgeFunctionsDeployed: false,
    storageBucketsConfigured: false,
    overallStatus: 'offline',
    details: {
      errors: []
    }
  };

  try {
    // Check Supabase connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('system_settings')
      .select('key')
      .limit(1);
    
    status.supabaseConnected = !connectionError;
    
    if (!status.supabaseConnected) {
      status.details.errors?.push('Failed to connect to Supabase');
      return status;
    }

    // Check cleanup status
    try {
      const { data: cleanupStatus, error: cleanupError } = await supabase
        .rpc('verify_cleanup');
      
      if (!cleanupError && cleanupStatus) {
        status.details.cleanupStatus = cleanupStatus;
        const cleanupFailed = cleanupStatus.some(
          (check: { status: string }) => check.status === 'ERROR'
        );
        if (cleanupFailed) {
          status.details.errors?.push('Cleanup verification failed');
        }
      }
    } catch (error) {
      console.warn('Cleanup verification failed:', error);
      status.details.errors?.push('Failed to verify cleanup status');
    }

    // Check backend setup
    try {
      const { data: backendStatus, error: backendError } = await supabase
        .rpc('verify_backend_setup');
      
      if (!backendError && backendStatus) {
        status.details.backendStatus = backendStatus;
        
        // Check API endpoints
        const apiEndpointsCheck = backendStatus.find(
          (check: { check_name: string }) => check.check_name === 'API Endpoints'
        );
        status.apiEndpointsConfigured = apiEndpointsCheck?.status === 'OK';

        // Check edge functions
        const edgeFunctionsCheck = backendStatus.find(
          (check: { check_name: string }) => check.check_name === 'Edge Functions'
        );
        status.edgeFunctionsDeployed = edgeFunctionsCheck?.status === 'OK';

        // Check RLS policies
        const rlsCheck = backendStatus.find(
          (check: { check_name: string }) => check.check_name === 'RLS Policies'
        );
        if (rlsCheck?.status === 'ERROR') {
          status.details.errors?.push('RLS policies verification failed');
        }
      }
    } catch (error) {
      console.warn('Backend setup verification failed:', error);
      status.details.errors?.push('Failed to verify backend setup');
    }

    // Check if database is migrated by checking if key tables exist
    try {
      const { data: tableCheck, error: tableError } = await supabase
        .from('api_endpoints')
        .select('id')
        .limit(1);
      
      status.databaseMigrated = !tableError;
    } catch (error) {
      console.warn('Database migration check failed:', error);
      status.details.errors?.push('Failed to verify database migration');
    }

    // Check if AI services are configured
    try {
      const { data: aiServices, error: aiError } = await supabase
        .from('ai_service_config')
        .select('service_name, is_active')
        .limit(1);
      
      status.aiServicesConfigured = !aiError && aiServices?.length > 0;
    } catch (error) {
      console.warn('AI Services check failed:', error);
      status.details.errors?.push('Failed to verify AI services configuration');
    }

    // Check if admin is configured
    try {
      const { data: adminCheck, error: adminError } = await supabase
        .from('admin_roles')
        .select('user_id')
        .limit(1);
      
      status.adminConfigured = !adminError && adminCheck?.length > 0;
    } catch (error) {
      console.warn('Admin configuration check failed:', error);
      status.details.errors?.push('Failed to verify admin configuration');
    }

    // Check if storage buckets are configured
    try {
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();
      
      const requiredBuckets = [
        'voice-samples',
        'generated-audio',
        'dna-files',
        'timeline-media',
        'recipe-images'
      ];
      
      status.storageBucketsConfigured = !bucketsError && 
        buckets?.every(bucket => requiredBuckets.includes(bucket.name));
    } catch (error) {
      console.warn('Storage buckets check failed:', error);
      status.details.errors?.push('Failed to verify storage buckets configuration');
    }

    // Determine overall status
    const criticalChecks = [
      status.supabaseConnected,
      status.databaseMigrated,
      status.aiServicesConfigured,
      status.adminConfigured
    ];

    const allChecks = [
      ...criticalChecks,
      status.apiEndpointsConfigured,
      status.edgeFunctionsDeployed,
      status.storageBucketsConfigured
    ];

    if (criticalChecks.every(check => check)) {
      status.overallStatus = allChecks.every(check => check) 
        ? 'operational' 
        : 'partial';
    } else {
      status.overallStatus = 'offline';
    }

  } catch (error) {
    console.error('Backend status check failed:', error);
    status.details.errors?.push('Failed to complete backend status check');
    status.overallStatus = 'offline';
  }

  return status;
}