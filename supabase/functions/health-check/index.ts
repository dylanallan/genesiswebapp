import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { withCors } from '../_shared/cors.ts'
import { withErrorHandling } from '../_shared/error-handling.ts'
import { initLogger } from '../_shared/logger.ts'

const logger = initLogger('health-check')

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  components: {
    database: ComponentStatus
    storage: ComponentStatus
    edge_functions: ComponentStatus
    auth: ComponentStatus
    ai_services: ComponentStatus
  }
  metrics: {
    response_time: number
    error_rate: number
    active_users: number
    storage_usage: number
  }
}

interface ComponentStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  message?: string
  last_checked: string
  details?: Record<string, unknown>
}

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

// Check database health
async function checkDatabaseHealth(): Promise<ComponentStatus> {
  const startTime = Date.now()
  try {
    // Check database connection
    const { data, error } = await supabase
      .from('health_check')
      .select('count')
      .limit(1)
      .single()

    if (error) throw error

    // Check database performance
    const { data: metrics, error: metricsError } = await supabase
      .rpc('get_database_metrics')

    if (metricsError) throw metricsError

    return {
      status: 'healthy',
      last_checked: new Date().toISOString(),
      details: {
        response_time: Date.now() - startTime,
        metrics
      }
    }
  } catch (error) {
    logger.error('Database health check failed:', error)
    return {
      status: 'unhealthy',
      message: error.message,
      last_checked: new Date().toISOString()
    }
  }
}

// Check storage health
async function checkStorageHealth(): Promise<ComponentStatus> {
  const startTime = Date.now()
  try {
    // Check storage buckets
    const buckets = ['audio', 'documents', 'dna-files', 'user-uploads']
    const bucketStatuses = await Promise.all(
      buckets.map(async (bucket) => {
        const { data, error } = await supabase
          .storage
          .getBucket(bucket)

        if (error) throw error

        return {
          bucket,
          status: 'healthy',
          size: data.size,
          file_count: data.file_count
        }
      })
    )

    return {
      status: 'healthy',
      last_checked: new Date().toISOString(),
      details: {
        response_time: Date.now() - startTime,
        buckets: bucketStatuses
      }
    }
  } catch (error) {
    logger.error('Storage health check failed:', error)
    return {
      status: 'unhealthy',
      message: error.message,
      last_checked: new Date().toISOString()
    }
  }
}

// Check edge functions health
async function checkEdgeFunctionsHealth(): Promise<ComponentStatus> {
  const startTime = Date.now()
  try {
    const functions = [
      'dna-analysis-processor',
      'document-analysis-processor',
      'record-matching-processor',
      'voice-story-generator'
    ]

    const functionStatuses = await Promise.all(
      functions.map(async (func) => {
        const { data, error } = await supabase
          .from('function_logs')
          .select('status, execution_time, created_at')
          .eq('function_name', func)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (error) throw error

        return {
          function: func,
          status: data.status === 'success' ? 'healthy' : 'degraded',
          last_execution: data.created_at,
          execution_time: data.execution_time
        }
      })
    )

    return {
      status: functionStatuses.every(f => f.status === 'healthy') ? 'healthy' : 'degraded',
      last_checked: new Date().toISOString(),
      details: {
        response_time: Date.now() - startTime,
        functions: functionStatuses
      }
    }
  } catch (error) {
    logger.error('Edge functions health check failed:', error)
    return {
      status: 'unhealthy',
      message: error.message,
      last_checked: new Date().toISOString()
    }
  }
}

// Check auth health
async function checkAuthHealth(): Promise<ComponentStatus> {
  const startTime = Date.now()
  try {
    // Check auth service
    const { data, error } = await supabase
      .from('auth.users')
      .select('count')
      .limit(1)
      .single()

    if (error) throw error

    // Check auth policies
    const { data: policies, error: policiesError } = await supabase
      .from('auth.policies')
      .select('*')

    if (policiesError) throw policiesError

    return {
      status: 'healthy',
      last_checked: new Date().toISOString(),
      details: {
        response_time: Date.now() - startTime,
        user_count: data.count,
        policy_count: policies.length
      }
    }
  } catch (error) {
    logger.error('Auth health check failed:', error)
    return {
      status: 'unhealthy',
      message: error.message,
      last_checked: new Date().toISOString()
    }
  }
}

// Check AI services health
async function checkAIServicesHealth(): Promise<ComponentStatus> {
  const startTime = Date.now()
  try {
    // Check OpenAI service
    const openaiResponse = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`
      }
    })

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API returned ${openaiResponse.status}`)
    }

    // Check Google Cloud services
    const googleResponse = await fetch(
      `https://texttospeech.googleapis.com/v1/voices?key=${Deno.env.get('GOOGLE_CLOUD_API_KEY')}`
    )

    if (!googleResponse.ok) {
      throw new Error(`Google Cloud API returned ${googleResponse.status}`)
    }

    return {
      status: 'healthy',
      last_checked: new Date().toISOString(),
      details: {
        response_time: Date.now() - startTime,
        openai_status: 'healthy',
        google_cloud_status: 'healthy'
      }
    }
  } catch (error) {
    logger.error('AI services health check failed:', error)
    return {
      status: 'unhealthy',
      message: error.message,
      last_checked: new Date().toISOString()
    }
  }
}

// Get system metrics
async function getSystemMetrics(): Promise<HealthStatus['metrics']> {
  try {
    // Get response time metrics
    const { data: responseTimeData } = await supabase
      .from('performance_metrics')
      .select('metric_value')
      .eq('metric_name', 'response_time')
      .order('timestamp', { ascending: false })
      .limit(100)

    const avgResponseTime = responseTimeData
      ? responseTimeData.reduce((acc, curr) => acc + curr.metric_value, 0) / responseTimeData.length
      : 0

    // Get error rate
    const { data: errorData } = await supabase
      .from('function_logs')
      .select('status')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    const errorRate = errorData
      ? errorData.filter(log => log.status === 'error').length / errorData.length
      : 0

    // Get active users
    const { data: activeUsersData } = await supabase
      .from('auth.users')
      .select('count')
      .gte('last_sign_in_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single()

    // Get storage usage
    const { data: storageData } = await supabase
      .storage
      .getBucket('audio')
      .then(({ data }) => data)

    return {
      response_time: avgResponseTime,
      error_rate: errorRate,
      active_users: activeUsersData?.count ?? 0,
      storage_usage: storageData?.size ?? 0
    }
  } catch (error) {
    logger.error('Failed to get system metrics:', error)
    return {
      response_time: 0,
      error_rate: 1,
      active_users: 0,
      storage_usage: 0
    }
  }
}

// Main handler
async function handleRequest(req: Request): Promise<Response> {
  const startTime = Date.now()

  // Run all health checks in parallel
  const [
    databaseStatus,
    storageStatus,
    edgeFunctionsStatus,
    authStatus,
    aiServicesStatus,
    metrics
  ] = await Promise.all([
    checkDatabaseHealth(),
    checkStorageHealth(),
    checkEdgeFunctionsHealth(),
    checkAuthHealth(),
    checkAIServicesHealth(),
    getSystemMetrics()
  ])

  // Determine overall system status
  const componentStatuses = [
    databaseStatus,
    storageStatus,
    edgeFunctionsStatus,
    authStatus,
    aiServicesStatus
  ]

  const overallStatus = componentStatuses.every(c => c.status === 'healthy')
    ? 'healthy'
    : componentStatuses.some(c => c.status === 'unhealthy')
    ? 'unhealthy'
    : 'degraded'

  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    components: {
      database: databaseStatus,
      storage: storageStatus,
      edge_functions: edgeFunctionsStatus,
      auth: authStatus,
      ai_services: aiServicesStatus
    },
    metrics
  }

  // Log health check results
  logger.info('Health check completed', {
    status: overallStatus,
    response_time: Date.now() - startTime,
    components: healthStatus.components
  })

  return new Response(JSON.stringify(healthStatus, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  })
}

// Serve the endpoint
serve(
  withCors(withErrorHandling(handleRequest)),
  { port: 8000 }
)