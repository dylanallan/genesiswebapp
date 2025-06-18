import { serve } from 'std/http/server.ts'
import { createClient } from '@supabase/supabase-js'
import { initLogger } from '../shared/logger.ts'

// Initialize logger
const logger = initLogger('metrics-collector', Deno.env.toObject())

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Metrics collection interval (in milliseconds)
const COLLECTION_INTERVAL = 60000 // 1 minute

// Cost tracking rates (per 1000 requests)
const COST_RATES = {
  'anthropic': 0.015, // $0.015 per 1K tokens
  'openai': 0.002,    // $0.002 per 1K tokens
  'google': 0.001,    // $0.001 per 1K tokens
  'supabase': 0.0001  // $0.0001 per request
}

// Serve the metrics collector
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
      
      if (apiPath === 'collect') {
        return await handleCollectMetrics()
      } else if (apiPath === 'costs') {
        return await handleGetCosts(url)
      } else if (apiPath === 'resources') {
        return await handleGetResources(url)
      } else if (apiPath === 'health') {
        return await handleHealthCheck()
      }
    }
    
    // Not found
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    await logger.error('Error in metrics collector', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// Handle metrics collection
async function handleCollectMetrics(): Promise<Response> {
  try {
    const metrics = await collectMetrics()
    await storeMetrics(metrics)
    
    return new Response(
      JSON.stringify({ success: true, metrics }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    await logger.error('Error collecting metrics', error)
    throw error
  }
}

// Handle cost tracking
async function handleGetCosts(url: URL): Promise<Response> {
  const timeRange = url.searchParams.get('timeRange') || '24h'
  const functionName = url.searchParams.get('function')
  
  try {
    const costs = await calculateCosts(timeRange, functionName)
    
    return new Response(
      JSON.stringify(costs),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    await logger.error('Error getting costs', error)
    throw error
  }
}

// Handle resource usage
async function handleGetResources(url: URL): Promise<Response> {
  const timeRange = url.searchParams.get('timeRange') || '24h'
  const functionName = url.searchParams.get('function')
  
  try {
    const resources = await getResourceUsage(timeRange, functionName)
    
    return new Response(
      JSON.stringify(resources),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    await logger.error('Error getting resources', error)
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
        database: await checkDatabase(),
        storage: await checkStorage(),
        memory: await checkMemory()
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

// Collect metrics
async function collectMetrics() {
  const now = new Date()
  const metrics = {
    timestamp: now.toISOString(),
    functions: {} as Record<string, any>,
    resources: await getCurrentResources(),
    costs: await getCurrentCosts()
  }
  
  // Get list of functions
  const { data: functions } = await supabase
    .from('function_logs')
    .select('function')
    .distinct()
  
  // Collect metrics for each function
  for (const { function: functionName } of functions || []) {
    metrics.functions[functionName] = await getFunctionMetrics(functionName)
  }
  
  return metrics
}

// Get function metrics
async function getFunctionMetrics(functionName: string) {
  const now = new Date()
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  
  // Get recent logs
  const { data: logs } = await supabase
    .from('function_logs')
    .select('*')
    .eq('function', functionName)
    .gte('timestamp', hourAgo.toISOString())
    .order('timestamp', { ascending: false })
  
  // Calculate metrics
  const metrics = {
    requests: {
      total: logs?.length || 0,
      success: logs?.filter(log => log.level !== 'ERROR').length || 0,
      error: logs?.filter(log => log.level === 'ERROR').length || 0
    },
    performance: {
      avgResponseTime: calculateAverageResponseTime(logs),
      p95ResponseTime: calculatePercentileResponseTime(logs, 95),
      p99ResponseTime: calculatePercentileResponseTime(logs, 99)
    },
    resources: {
      memory: calculateAverageMemory(logs),
      cpu: calculateAverageCPU(logs)
    },
    costs: await calculateFunctionCosts(functionName, logs)
  }
  
  return metrics
}

// Calculate costs
async function calculateCosts(timeRange: string, functionName?: string) {
  const now = new Date()
  const startTime = getStartTime(timeRange)
  
  // Get logs for time range
  const { data: logs } = await supabase
    .from('function_logs')
    .select('*')
    .gte('timestamp', startTime.toISOString())
    .lte('timestamp', now.toISOString())
    .eq(functionName ? 'function' : 'function', functionName || '')
  
  // Calculate costs by provider
  const costs = {
    total: 0,
    byProvider: {} as Record<string, number>,
    byFunction: {} as Record<string, number>
  }
  
  // Process logs
  for (const log of logs || []) {
    const metadata = log.metadata as any
    
    // Calculate costs by provider
    if (metadata?.provider) {
      const provider = metadata.provider.toLowerCase()
      const tokens = metadata.tokens || 0
      const rate = COST_RATES[provider] || 0
      const cost = (tokens / 1000) * rate
      
      costs.byProvider[provider] = (costs.byProvider[provider] || 0) + cost
      costs.total += cost
    }
    
    // Calculate costs by function
    const functionCost = COST_RATES.supabase // Base cost per request
    costs.byFunction[log.function] = (costs.byFunction[log.function] || 0) + functionCost
    costs.total += functionCost
  }
  
  return costs
}

// Get resource usage
async function getResourceUsage(timeRange: string, functionName?: string) {
  const now = new Date()
  const startTime = getStartTime(timeRange)
  
  // Get logs for time range
  const { data: logs } = await supabase
    .from('function_logs')
    .select('*')
    .gte('timestamp', startTime.toISOString())
    .lte('timestamp', now.toISOString())
    .eq(functionName ? 'function' : 'function', functionName || '')
  
  // Calculate resource usage
  const resources = {
    memory: {
      average: calculateAverageMemory(logs),
      peak: calculatePeakMemory(logs)
    },
    cpu: {
      average: calculateAverageCPU(logs),
      peak: calculatePeakCPU(logs)
    },
    requests: {
      total: logs?.length || 0,
      byFunction: {} as Record<string, number>
    }
  }
  
  // Calculate requests by function
  for (const log of logs || []) {
    resources.requests.byFunction[log.function] = 
      (resources.requests.byFunction[log.function] || 0) + 1
  }
  
  return resources
}

// Helper functions
function getStartTime(timeRange: string): Date {
  const now = new Date()
  
  switch (timeRange) {
    case '1h':
      return new Date(now.getTime() - 60 * 60 * 1000)
    case '6h':
      return new Date(now.getTime() - 6 * 60 * 60 * 1000)
    case '24h':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    default:
      return new Date(now.getTime() - 60 * 60 * 1000) // Default to 1h
  }
}

function calculateAverageResponseTime(logs: any[]): number {
  if (!logs?.length) return 0
  
  const times = logs
    .map(log => (log.metadata as any)?.duration_ms)
    .filter(Boolean)
  
  return times.length ? 
    times.reduce((a, b) => a + b, 0) / times.length : 0
}

function calculatePercentileResponseTime(logs: any[], percentile: number): number {
  if (!logs?.length) return 0
  
  const times = logs
    .map(log => (log.metadata as any)?.duration_ms)
    .filter(Boolean)
    .sort((a, b) => a - b)
  
  const index = Math.ceil((percentile / 100) * times.length) - 1
  return times[index] || 0
}

function calculateAverageMemory(logs: any[]): number {
  if (!logs?.length) return 0
  
  const memories = logs
    .map(log => (log.metadata as any)?.memory_mb)
    .filter(Boolean)
  
  return memories.length ? 
    memories.reduce((a, b) => a + b, 0) / memories.length : 0
}

function calculatePeakMemory(logs: any[]): number {
  if (!logs?.length) return 0
  
  return Math.max(
    ...logs
      .map(log => (log.metadata as any)?.memory_mb)
      .filter(Boolean)
  )
}

function calculateAverageCPU(logs: any[]): number {
  if (!logs?.length) return 0
  
  const cpus = logs
    .map(log => (log.metadata as any)?.cpu_percent)
    .filter(Boolean)
  
  return cpus.length ? 
    cpus.reduce((a, b) => a + b, 0) / cpus.length : 0
}

function calculatePeakCPU(logs: any[]): number {
  if (!logs?.length) return 0
  
  return Math.max(
    ...logs
      .map(log => (log.metadata as any)?.cpu_percent)
      .filter(Boolean)
  )
}

async function getCurrentResources() {
  // Get current system resources
  const memory = await Deno.systemMemoryInfo()
  const cpu = await Deno.systemCpuInfo()
  
  return {
    memory: {
      total: memory.total,
      used: memory.used,
      free: memory.free
    },
    cpu: {
      cores: cpu.cores,
      usage: cpu.usage
    }
  }
}

async function getCurrentCosts() {
  const now = new Date()
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  
  // Get recent logs
  const { data: logs } = await supabase
    .from('function_logs')
    .select('*')
    .gte('timestamp', hourAgo.toISOString())
    .lte('timestamp', now.toISOString())
  
  return calculateCosts('1h')
}

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

async function checkStorage() {
  try {
    const { data, error } = await supabase
      .storage
      .getBucket('function-logs')
    
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

async function checkMemory() {
  try {
    const memory = await Deno.systemMemoryInfo()
    const usagePercent = (memory.used / memory.total) * 100
    
    return {
      status: usagePercent > 90 ? 'warning' : 'healthy',
      usage: usagePercent,
      total: memory.total,
      used: memory.used,
      free: memory.free
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    }
  }
}

async function storeMetrics(metrics: any) {
  const { error } = await supabase
    .from('function_metrics')
    .insert({
      timestamp: metrics.timestamp,
      metrics: metrics
    })
  
  if (error) {
    await logger.error('Error storing metrics', error)
  }
}

// Start metrics collection
setInterval(async () => {
  try {
    await collectMetrics()
  } catch (error) {
    await logger.error('Error in metrics collection interval', error)
  }
}, COLLECTION_INTERVAL) 