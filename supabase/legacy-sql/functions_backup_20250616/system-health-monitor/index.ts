import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    // Check if user is admin
    const { data: adminRole, error: adminError } = await supabase
      .from('admin_roles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (adminError || !adminRole) {
      throw new Error('Unauthorized: Admin access required');
    }

    // Collect system health metrics
    const metrics = await collectSystemHealthMetrics(supabase);

    // Store metrics in database
    await storeSystemHealthMetrics(supabase, metrics);

    // Check for anomalies
    const anomalies = await checkForAnomalies(supabase, metrics);

    // Return health status
    return new Response(
      JSON.stringify({
        status: 'success',
        timestamp: new Date().toISOString(),
        metrics,
        anomalies,
        systemStatus: determineSystemStatus(metrics, anomalies)
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('System health monitor error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message.includes('Unauthorized') ? 403 : 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function collectSystemHealthMetrics(supabase: any) {
  // Collect database metrics
  const dbMetrics = await getDatabaseMetrics(supabase);
  
  // Collect AI service metrics
  const aiMetrics = await getAIServiceMetrics(supabase);
  
  // Collect user activity metrics
  const userMetrics = await getUserActivityMetrics(supabase);
  
  // Collect performance metrics
  const performanceMetrics = await getPerformanceMetrics(supabase);
  
  return {
    database: dbMetrics,
    aiService: aiMetrics,
    userActivity: userMetrics,
    performance: performanceMetrics,
    timestamp: new Date().toISOString()
  };
}

async function getDatabaseMetrics(supabase: any) {
  try {
    // Get database size and connection count
    const { data: dbStats, error: dbError } = await supabase.rpc('get_database_stats');
    
    if (dbError) throw dbError;
    
    // Get table row counts for key tables
    const [
      usersResult,
      artifactsResult,
      automationResult,
      aiLogsResult
    ] = await Promise.allSettled([
      supabase.from('user_data').select('*', { count: 'exact', head: true }),
      supabase.from('cultural_artifacts').select('*', { count: 'exact', head: true }),
      supabase.from('automation_workflows').select('*', { count: 'exact', head: true }),
      supabase.from('ai_request_logs').select('*', { count: 'exact', head: true })
    ]);
    
    return {
      size: dbStats?.size || 0,
      connections: dbStats?.connections || 0,
      tables: {
        users: usersResult.status === 'fulfilled' ? usersResult.value.count : 0,
        artifacts: artifactsResult.status === 'fulfilled' ? artifactsResult.value.count : 0,
        automations: automationResult.status === 'fulfilled' ? automationResult.value.count : 0,
        aiLogs: aiLogsResult.status === 'fulfilled' ? aiLogsResult.value.count : 0
      },
      health: calculateDatabaseHealth(dbStats)
    };
  } catch (error) {
    console.error('Error getting database metrics:', error);
    return {
      size: 0,
      connections: 0,
      tables: { users: 0, artifacts: 0, automations: 0, aiLogs: 0 },
      health: 0.5
    };
  }
}

async function getAIServiceMetrics(supabase: any) {
  try {
    // Get AI service metrics
    const { data: aiStats, error: aiError } = await supabase
      .from('ai_request_logs')
      .select('success, response_time_ms, provider_id')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString());
    
    if (aiError) throw aiError;
    
    // Calculate success rate and average response time
    const totalRequests = aiStats?.length || 0;
    const successfulRequests = aiStats?.filter(log => log.success).length || 0;
    const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 1;
    
    const avgResponseTime = aiStats?.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / (totalRequests || 1);
    
    // Get provider-specific metrics
    const providers = aiStats?.reduce((acc, log) => {
      if (!acc[log.provider_id]) {
        acc[log.provider_id] = { total: 0, successful: 0, avgTime: 0 };
      }
      acc[log.provider_id].total++;
      if (log.success) acc[log.provider_id].successful++;
      acc[log.provider_id].avgTime += (log.response_time_ms || 0);
      return acc;
    }, {});
    
    // Calculate average response time for each provider
    Object.keys(providers || {}).forEach(key => {
      providers[key].avgTime = providers[key].avgTime / providers[key].total;
      providers[key].successRate = providers[key].successful / providers[key].total;
    });
    
    return {
      totalRequests,
      successfulRequests,
      successRate,
      avgResponseTime,
      providers,
      health: calculateAIServiceHealth(successRate, avgResponseTime)
    };
  } catch (error) {
    console.error('Error getting AI service metrics:', error);
    return {
      totalRequests: 0,
      successfulRequests: 0,
      successRate: 1,
      avgResponseTime: 0,
      providers: {},
      health: 0.5
    };
  }
}

async function getUserActivityMetrics(supabase: any) {
  try {
    // Get user activity metrics
    const { data: activityStats, error: activityError } = await supabase
      .from('user_activity_log')
      .select('activity_type, created_at, user_id')
      .gte('created_at', new Date(Date.now() - 86400000).toISOString());
    
    if (activityError) throw activityError;
    
    // Calculate active users
    const activeUsers = new Set(activityStats?.map(log => log.user_id)).size;
    
    // Calculate activity by type
    const activityByType = activityStats?.reduce((acc, log) => {
      if (!acc[log.activity_type]) {
        acc[log.activity_type] = 0;
      }
      acc[log.activity_type]++;
      return acc;
    }, {});
    
    // Calculate activity by hour
    const activityByHour = activityStats?.reduce((acc, log) => {
      const hour = new Date(log.created_at).getHours();
      if (!acc[hour]) {
        acc[hour] = 0;
      }
      acc[hour]++;
      return acc;
    }, {});
    
    return {
      activeUsers,
      totalActivities: activityStats?.length || 0,
      activityByType,
      activityByHour,
      health: calculateUserActivityHealth(activeUsers, activityStats?.length || 0)
    };
  } catch (error) {
    console.error('Error getting user activity metrics:', error);
    return {
      activeUsers: 0,
      totalActivities: 0,
      activityByType: {},
      activityByHour: {},
      health: 0.5
    };
  }
}

async function getPerformanceMetrics(supabase: any) {
  try {
    // Get performance metrics
    const { data: perfStats, error: perfError } = await supabase
      .from('system_health_metrics')
      .select('metric_name, metric_value, ts')
      .gte('ts', new Date(Date.now() - 3600000).toISOString())
      .order('ts', { ascending: false });
    
    if (perfError) throw perfError;
    
    // Group metrics by name
    const metricsByName = perfStats?.reduce((acc, metric) => {
      if (!acc[metric.metric_name]) {
        acc[metric.metric_name] = [];
      }
      acc[metric.metric_name].push(metric.metric_value);
      return acc;
    }, {});
    
    // Calculate average for each metric
    const avgMetrics = {};
    Object.keys(metricsByName || {}).forEach(key => {
      avgMetrics[key] = metricsByName[key].reduce((sum, val) => sum + val, 0) / metricsByName[key].length;
    });
    
    return {
      metrics: avgMetrics,
      health: calculatePerformanceHealth(avgMetrics)
    };
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    return {
      metrics: {},
      health: 0.5
    };
  }
}

function calculateDatabaseHealth(dbStats: any) {
  if (!dbStats) return 0.5;
  
  // Calculate health based on connection count and database size
  const connectionHealth = Math.max(0, 1 - (dbStats.connections / 100));
  const sizeHealth = Math.max(0, 1 - (dbStats.size / (1024 * 1024 * 1024))); // 1GB threshold
  
  return (connectionHealth + sizeHealth) / 2;
}

function calculateAIServiceHealth(successRate: number, avgResponseTime: number) {
  // Calculate health based on success rate and response time
  const successHealth = successRate;
  const responseTimeHealth = Math.max(0, 1 - (avgResponseTime / 10000)); // 10s threshold
  
  return (successHealth * 0.7) + (responseTimeHealth * 0.3);
}

function calculateUserActivityHealth(activeUsers: number, totalActivities: number) {
  // Calculate health based on active users and total activities
  const userHealth = Math.min(1, activeUsers / 10); // 10 users threshold
  const activityHealth = Math.min(1, totalActivities / 100); // 100 activities threshold
  
  return (userHealth + activityHealth) / 2;
}

function calculatePerformanceHealth(metrics: any) {
  if (!metrics || Object.keys(metrics).length === 0) return 0.5;
  
  // Calculate health based on CPU, memory, and error rate
  const cpuHealth = metrics.cpu_usage ? Math.max(0, 1 - (metrics.cpu_usage / 100)) : 0.5;
  const memoryHealth = metrics.memory_usage ? Math.max(0, 1 - (metrics.memory_usage / 100)) : 0.5;
  const errorHealth = metrics.error_rate ? Math.max(0, 1 - metrics.error_rate) : 0.5;
  
  return (cpuHealth * 0.3) + (memoryHealth * 0.3) + (errorHealth * 0.4);
}

async function storeSystemHealthMetrics(supabase: any, metrics: any) {
  try {
    // Store overall system health
    await supabase
      .from('system_health_metrics')
      .insert({
        metric_name: 'system_health',
        metric_value: (
          metrics.database.health * 0.25 +
          metrics.aiService.health * 0.25 +
          metrics.userActivity.health * 0.25 +
          metrics.performance.health * 0.25
        ),
        metadata: {
          database_health: metrics.database.health,
          ai_service_health: metrics.aiService.health,
          user_activity_health: metrics.userActivity.health,
          performance_health: metrics.performance.health
        }
      });
    
    // Store database metrics
    await supabase
      .from('system_health_metrics')
      .insert({
        metric_name: 'database_health',
        metric_value: metrics.database.health,
        metadata: {
          size: metrics.database.size,
          connections: metrics.database.connections,
          tables: metrics.database.tables
        }
      });
    
    // Store AI service metrics
    await supabase
      .from('system_health_metrics')
      .insert({
        metric_name: 'ai_service_health',
        metric_value: metrics.aiService.health,
        metadata: {
          success_rate: metrics.aiService.successRate,
          avg_response_time: metrics.aiService.avgResponseTime,
          total_requests: metrics.aiService.totalRequests
        }
      });
    
    // Store user activity metrics
    await supabase
      .from('system_health_metrics')
      .insert({
        metric_name: 'user_activity_health',
        metric_value: metrics.userActivity.health,
        metadata: {
          active_users: metrics.userActivity.activeUsers,
          total_activities: metrics.userActivity.totalActivities
        }
      });
    
    // Store performance metrics
    await supabase
      .from('system_health_metrics')
      .insert({
        metric_name: 'performance_health',
        metric_value: metrics.performance.health,
        metadata: metrics.performance.metrics
      });
  } catch (error) {
    console.error('Error storing system health metrics:', error);
  }
}

async function checkForAnomalies(supabase: any, metrics: any) {
  try {
    const anomalies = [];
    
    // Check for database anomalies
    if (metrics.database.health < 0.7) {
      anomalies.push({
        component: 'database',
        severity: metrics.database.health < 0.5 ? 'high' : 'medium',
        message: 'Database health is below threshold',
        details: {
          health: metrics.database.health,
          connections: metrics.database.connections,
          size: metrics.database.size
        }
      });
    }
    
    // Check for AI service anomalies
    if (metrics.aiService.health < 0.7) {
      anomalies.push({
        component: 'ai_service',
        severity: metrics.aiService.health < 0.5 ? 'high' : 'medium',
        message: 'AI service health is below threshold',
        details: {
          health: metrics.aiService.health,
          success_rate: metrics.aiService.successRate,
          avg_response_time: metrics.aiService.avgResponseTime
        }
      });
    }
    
    // Check for performance anomalies
    if (metrics.performance.health < 0.7) {
      anomalies.push({
        component: 'performance',
        severity: metrics.performance.health < 0.5 ? 'high' : 'medium',
        message: 'System performance is below threshold',
        details: {
          health: metrics.performance.health,
          metrics: metrics.performance.metrics
        }
      });
    }
    
    // Store anomalies if they are high severity
    for (const anomaly of anomalies) {
      if (anomaly.severity === 'high') {
        await supabase
          .from('security_alerts')
          .insert({
            anomaly_score: 1 - (metrics[anomaly.component].health || 0),
            metrics: anomaly.details,
            timestamp: new Date().toISOString()
          });
      }
    }
    
    return anomalies;
  } catch (error) {
    console.error('Error checking for anomalies:', error);
    return [];
  }
}

function determineSystemStatus(metrics: any, anomalies: any[]) {
  // Calculate overall system health
  const overallHealth = (
    metrics.database.health * 0.25 +
    metrics.aiService.health * 0.25 +
    metrics.userActivity.health * 0.25 +
    metrics.performance.health * 0.25
  );
  
  // Determine status based on health and anomalies
  if (overallHealth < 0.5 || anomalies.some(a => a.severity === 'high')) {
    return 'critical';
  } else if (overallHealth < 0.7 || anomalies.some(a => a.severity === 'medium')) {
    return 'warning';
  } else {
    return 'healthy';
  }
}