import { serve } from 'std/http/server.ts'
import { createClient } from '@supabase/supabase-js'
import { initLogger } from '../shared/logger.ts'
import { generateDashboardHTML } from './template.ts'

// Initialize logger
const logger = initLogger('log-dashboard', Deno.env.toObject())

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Serve the dashboard
serve(async (req: Request) => {
  const startTime = Date.now()
  
  try {
    // Log incoming request
    await logger.logRequest(req)
    
    // Parse request
    const url = new URL(req.url)
    const path = url.pathname
    
    // API endpoints
    if (path.startsWith('/api/')) {
      const apiPath = path.replace('/api/', '')
      
      if (apiPath === 'metrics') {
        return await handleMetricsRequest(req)
      } else if (apiPath === 'logs') {
        return await handleLogsRequest(req)
      } else if (apiPath === 'functions') {
        return await handleFunctionsRequest(req)
      } else if (apiPath === 'notifications') {
        return await handleNotificationsRequest(req)
      } else if (apiPath === 'health') {
        return await handleHealthCheck()
      }
    }
    
    // Serve dashboard HTML
    if (path === '/' || path === '/index.html') {
      const [metrics, logs, functions, notifications, channels] = await Promise.all([
        getMetrics(),
        getRecentLogs(),
        getFunctions(),
        getRecentNotifications(),
        getNotificationChannels()
      ])
      
      return new Response(
        generateDashboardHTML(metrics, logs, functions, notifications, channels),
        {
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          }
        }
      )
    }
    
    // Not found
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    await logger.error('Error in dashboard', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// Handle metrics request
async function handleMetricsRequest(req: Request): Promise<Response> {
  try {
    const metrics = await getMetrics()
    return new Response(
      JSON.stringify(metrics),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    await logger.error('Error getting metrics', error)
    throw error
  }
}

// Handle logs request
async function handleLogsRequest(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url)
    const functionName = url.searchParams.get('function')
    const level = url.searchParams.get('level')
    const timeRange = url.searchParams.get('timeRange') || '1h'
    
    const logs = await getRecentLogs(functionName, level, timeRange)
    return new Response(
      JSON.stringify(logs),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    await logger.error('Error getting logs', error)
    throw error
  }
}

// Handle functions request
async function handleFunctionsRequest(req: Request): Promise<Response> {
  try {
    const functions = await getFunctions()
    return new Response(
      JSON.stringify(functions),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    await logger.error('Error getting functions', error)
    throw error
  }
}

// Handle notifications request
async function handleNotificationsRequest(req: Request): Promise<Response> {
  try {
    const notifications = await getRecentNotifications()
    return new Response(
      JSON.stringify(notifications),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    await logger.error('Error getting notifications', error)
    throw error
  }
}

// Handle health check
async function handleHealthCheck(): Promise<Response> {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks: {
        database: await checkDatabase()
      }
    }
    
    return new Response(
      JSON.stringify(health),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    await logger.error('Error in health check', error)
    throw error
  }
}

// Get metrics
async function getMetrics() {
  const [
    { data: logs, error: logsError },
    { data: functions, error: functionsError },
    { data: notifications, error: notificationsError }
  ] = await Promise.all([
    supabase
      .from('function_logs')
      .select('*')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from('function_metrics')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('notification_logs')
      .select('*')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  ])
  
  if (logsError) throw logsError
  if (functionsError) throw functionsError
  if (notificationsError) throw notificationsError
  
  // Calculate metrics
  const totalLogs = logs.length
  const errorLogs = logs.filter((log: any) => log.level === 'error').length
  const errorRate = totalLogs > 0 ? (errorLogs / totalLogs) * 100 : 0
  
  const logLevels = {
    error: logs.filter((log: any) => log.level === 'error').length,
    warn: logs.filter((log: any) => log.level === 'warn').length,
    info: logs.filter((log: any) => log.level === 'info').length,
    debug: logs.filter((log: any) => log.level === 'debug').length
  }
  
  const responseTimes = functions?.metrics?.response_times || []
  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((sum: number, t: any) => sum + t.value, 0) / responseTimes.length
    : 0
  
  const activeAlerts = notifications.filter((n: any) => !n.result?.success).length
  
  return {
    total_logs: totalLogs,
    error_rate: errorRate.toFixed(2),
    avg_response_time: Math.round(avgResponseTime),
    active_alerts: activeAlerts,
    log_levels: logLevels,
    response_times: responseTimes
  }
}

// Get recent logs
async function getRecentLogs(functionName?: string | null, level?: string | null, timeRange: string = '1h') {
  let query = supabase
    .from('function_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(100)
  
  // Apply filters
  if (functionName) {
    query = query.eq('function_name', functionName)
  }
  if (level) {
    query = query.eq('level', level)
  }
  
  // Apply time range
  const timeRanges: { [key: string]: number } = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
  }
  
  const timeRangeMs = timeRanges[timeRange] || timeRanges['1h']
  query = query.gte('timestamp', new Date(Date.now() - timeRangeMs).toISOString())
  
  const { data: logs, error } = await query
  
  if (error) throw error
  return logs
}

// Get functions
async function getFunctions() {
  const { data: functions, error } = await supabase
    .from('function_metrics')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(10)
  
  if (error) throw error
  
  return functions.map((func: any) => ({
    name: func.name,
    status: func.status,
    last_invocation: func.last_invocation,
    invocations_24h: func.invocations_24h,
    avg_response_time: Math.round(func.avg_response_time),
    success_rate: func.success_rate.toFixed(1)
  }))
}

// Get recent notifications
async function getRecentNotifications() {
  const { data: notifications, error } = await supabase
    .from('notification_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(50)
  
  if (error) throw error
  return notifications
}

// Get notification channels
async function getNotificationChannels() {
  const { data: channels, error } = await supabase
    .from('notification_channel_health')
    .select('*')
  
  if (error) throw error
  return channels
}

// Check database health
async function checkDatabase() {
  try {
    const { data, error } = await supabase
      .from('function_logs')
      .select('count')
      .limit(1)
    
    return {
      status: error ? 'unhealthy' : 'healthy',
      error: error?.message
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    }
  }
} 