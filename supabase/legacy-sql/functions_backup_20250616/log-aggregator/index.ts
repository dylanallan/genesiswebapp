import { serve } from 'std/http/server.ts'
import { createClient } from '@supabase/supabase-js'
import { initLogger } from '../shared/logger.ts'
import { LogLevel } from '../shared/types.ts'

// Initialize logger
const logger = initLogger('log-aggregator', Deno.env.toObject())

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Alert thresholds
const ALERT_THRESHOLDS = {
  errorRate: 0.1, // 10% error rate
  responseTime: 1000, // 1 second
  consecutiveErrors: 3,
  errorCount: 10 // per minute
}

// Alert channels
interface AlertChannel {
  type: 'email' | 'webhook' | 'slack'
  config: Record<string, any>
}

const ALERT_CHANNELS: AlertChannel[] = [
  {
    type: 'webhook',
    config: {
      url: Deno.env.get('ALERT_WEBHOOK_URL')
    }
  }
]

// Serve the log aggregator
serve(async (req: Request) => {
  const startTime = Date.now()
  
  try {
    // Log incoming request
    await logger.logRequest(req)
    
    // Parse request
    const url = new URL(req.url)
    const path = url.pathname
    const method = req.method
    
    // Handle different endpoints
    if (method === 'GET') {
      if (path === '/metrics') {
        return await handleMetricsRequest(url)
      } else if (path === '/alerts') {
        return await handleAlertsRequest(url)
      } else if (path === '/health') {
        return await handleHealthRequest()
      }
    } else if (method === 'POST' && path === '/logs') {
      return await handleLogIngestion(req)
    }
    
    // Invalid endpoint
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    await logger.error('Error in log aggregator', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// Handle metrics request
async function handleMetricsRequest(url: URL): Promise<Response> {
  const timeRange = url.searchParams.get('timeRange') || '1h'
  const functionName = url.searchParams.get('function')
  
  try {
    // Get metrics
    const metrics = await getMetrics(timeRange, functionName)
    
    // Check for alerts
    await checkAndSendAlerts(metrics)
    
    return new Response(
      JSON.stringify(metrics),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    await logger.error('Error getting metrics', error)
    throw error
  }
}

// Handle alerts request
async function handleAlertsRequest(url: URL): Promise<Response> {
  const timeRange = url.searchParams.get('timeRange') || '1h'
  
  try {
    const alerts = await getAlerts(timeRange)
    return new Response(
      JSON.stringify(alerts),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    await logger.error('Error getting alerts', error)
    throw error
  }
}

// Handle health request
async function handleHealthRequest(): Promise<Response> {
  return new Response(
    JSON.stringify({ status: 'healthy' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
}

// Handle log ingestion
async function handleLogIngestion(req: Request): Promise<Response> {
  try {
    const logs = await req.json()
    
    // Validate logs
    if (!Array.isArray(logs)) {
      throw new Error('Invalid log format')
    }
    
    // Process logs
    await processLogs(logs)
    
    return new Response(
      JSON.stringify({ status: 'success' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    await logger.error('Error ingesting logs', error)
    throw error
  }
}

// Get metrics
async function getMetrics(timeRange: string, functionName?: string): Promise<any> {
  const timeFilter = getTimeFilter(timeRange)
  const functionFilter = functionName ? `and function = '${functionName}'` : ''
  
  // Get log counts by level
  const { data: levelCounts, error: levelError } = await supabase
    .from('function_logs')
    .select('level, count(*)')
    .filter('timestamp', 'gte', timeFilter)
    .filter('timestamp', 'lte', new Date().toISOString())
    .filter('function', functionFilter)
    .group('level')
  
  if (levelError) throw levelError
  
  // Get error rate
  const totalLogs = levelCounts.reduce((sum, row) => sum + parseInt(row.count), 0)
  const errorLogs = levelCounts
    .filter(row => row.level === LogLevel.ERROR || row.level === LogLevel.FATAL)
    .reduce((sum, row) => sum + parseInt(row.count), 0)
  const errorRate = totalLogs > 0 ? errorLogs / totalLogs : 0
  
  // Get average response time
  const { data: responseTimes, error: timeError } = await supabase
    .from('function_logs')
    .select('metadata->duration_ms')
    .filter('timestamp', 'gte', timeFilter)
    .filter('timestamp', 'lte', new Date().toISOString())
    .filter('function', functionFilter)
    .filter('message', 'like', 'Performance:%')
  
  if (timeError) throw timeError
  
  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((sum, row) => sum + (row.duration_ms || 0), 0) / responseTimes.length
    : 0
  
  // Get function-specific metrics
  const { data: functionMetrics, error: functionError } = await supabase
    .from('function_logs')
    .select('function, count(*)')
    .filter('timestamp', 'gte', timeFilter)
    .filter('timestamp', 'lte', new Date().toISOString())
    .filter('function', functionFilter)
    .group('function')
  
  if (functionError) throw functionError
  
  return {
    timestamp: new Date().toISOString(),
    timeRange,
    totalLogs,
    errorRate,
    avgResponseTime,
    levelCounts,
    functionMetrics,
    alerts: await getAlerts(timeRange, functionName)
  }
}

// Get alerts
async function getAlerts(timeRange: string, functionName?: string): Promise<any[]> {
  const timeFilter = getTimeFilter(timeRange)
  const functionFilter = functionName ? `and function = '${functionName}'` : ''
  
  // Get recent errors
  const { data: errors, error: errorError } = await supabase
    .from('function_logs')
    .select('*')
    .filter('timestamp', 'gte', timeFilter)
    .filter('timestamp', 'lte', new Date().toISOString())
    .filter('function', functionFilter)
    .filter('level', 'in', `(${LogLevel.ERROR},${LogLevel.FATAL})`)
    .order('timestamp', { ascending: false })
    .limit(100)
  
  if (errorError) throw errorError
  
  // Process alerts
  const alerts = []
  
  // Check error rate
  const metrics = await getMetrics(timeRange, functionName)
  if (metrics.errorRate > ALERT_THRESHOLDS.errorRate) {
    alerts.push({
      type: 'error_rate',
      severity: 'high',
      message: `Error rate (${(metrics.errorRate * 100).toFixed(1)}%) exceeds threshold (${(ALERT_THRESHOLDS.errorRate * 100).toFixed(1)}%)`,
      timestamp: new Date().toISOString()
    })
  }
  
  // Check response time
  if (metrics.avgResponseTime > ALERT_THRESHOLDS.responseTime) {
    alerts.push({
      type: 'response_time',
      severity: 'medium',
      message: `Average response time (${metrics.avgResponseTime.toFixed(0)}ms) exceeds threshold (${ALERT_THRESHOLDS.responseTime}ms)`,
      timestamp: new Date().toISOString()
    })
  }
  
  // Check consecutive errors
  let consecutiveErrors = 0
  for (const error of errors) {
    if (error.level === LogLevel.ERROR || error.level === LogLevel.FATAL) {
      consecutiveErrors++
      if (consecutiveErrors >= ALERT_THRESHOLDS.consecutiveErrors) {
        alerts.push({
          type: 'consecutive_errors',
          severity: 'high',
          message: `${consecutiveErrors} consecutive errors detected`,
          timestamp: error.timestamp
        })
        break
      }
    } else {
      consecutiveErrors = 0
    }
  }
  
  return alerts
}

// Process logs
async function processLogs(logs: any[]): Promise<void> {
  // Insert logs in batches
  const batchSize = 100
  for (let i = 0; i < logs.length; i += batchSize) {
    const batch = logs.slice(i, i + batchSize)
    const { error } = await supabase
      .from('function_logs')
      .insert(batch)
    
    if (error) {
      await logger.error('Error inserting log batch', error)
      throw error
    }
  }
}

// Check and send alerts
async function checkAndSendAlerts(metrics: any): Promise<void> {
  const alerts = metrics.alerts
  
  if (alerts.length > 0) {
    for (const channel of ALERT_CHANNELS) {
      try {
        await sendAlert(channel, alerts)
      } catch (error) {
        await logger.error('Error sending alert', error, { channel, alerts })
      }
    }
  }
}

// Send alert
async function sendAlert(channel: AlertChannel, alerts: any[]): Promise<void> {
  switch (channel.type) {
    case 'webhook':
      await fetch(channel.config.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alerts })
      })
      break
      
    // Add more alert channels as needed
  }
}

// Helper function to get time filter
function getTimeFilter(timeRange: string): string {
  const now = new Date()
  let filterDate: Date
  
  switch (timeRange) {
    case '1h':
      filterDate = new Date(now.getTime() - 60 * 60 * 1000)
      break
    case '6h':
      filterDate = new Date(now.getTime() - 6 * 60 * 60 * 1000)
      break
    case '24h':
      filterDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case '7d':
      filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    default:
      filterDate = new Date(now.getTime() - 60 * 60 * 1000) // Default to 1h
  }
  
  return filterDate.toISOString()
} 