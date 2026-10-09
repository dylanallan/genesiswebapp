import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import { corsHeaders } from "../_shared/cors.ts";

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ProviderStatus {
  id: string;
  name: string;
  isActive: boolean;
  performance: number;
  reliability: number;
  lastCheck: string;
  errorCount: number;
  circuitBreakerOpen: boolean;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'critical';
  providers: ProviderStatus[];
  lastUpdated: string;
  overallHealth: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get AI service configuration
    const { data: providers, error: configError } = await supabase
      .from('ai_service_config')
      .select('*');

    if (configError) {
      throw configError;
    }

    // Get recent AI request logs
    const { data: logs, error: logsError } = await supabase
      .from('ai_request_logs')
      .select('provider_id, success, response_time_ms, created_at')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // Last hour

    if (logsError) {
      throw logsError;
    }

    // Calculate provider status
    const providerStatus: ProviderStatus[] = providers?.map(provider => {
      const providerLogs = logs?.filter(log => log.provider_id === provider.service_name) || [];
      const totalRequests = providerLogs.length;
      const successfulRequests = providerLogs.filter(log => log.success).length;
      const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 1;
      
      // Calculate average response time
      const avgResponseTime = providerLogs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / (totalRequests || 1);
      
      // Calculate performance score (0-1)
      const performanceScore = calculatePerformanceScore(successRate, avgResponseTime);
      
      // Check if circuit breaker should be open
      const recentErrors = providerLogs.filter(log => !log.success && new Date(log.created_at).getTime() > Date.now() - 300000).length;
      const circuitBreakerOpen = recentErrors >= 5;

      return {
        id: provider.service_name,
        name: provider.service_name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
        isActive: provider.is_active && !circuitBreakerOpen,
        performance: performanceScore,
        reliability: successRate,
        lastCheck: new Date().toISOString(),
        errorCount: totalRequests - successfulRequests,
        circuitBreakerOpen
      };
    }) || [];

    // Calculate overall health
    const activeProviders = providerStatus.filter(p => p.isActive);
    const overallHealth = activeProviders.length > 0
      ? activeProviders.reduce((sum, p) => sum + p.performance, 0) / activeProviders.length
      : 0;

    // Determine system status
    let status: 'healthy' | 'degraded' | 'critical';
    if (overallHealth > 0.8 && activeProviders.length >= 2) {
      status = 'healthy';
    } else if (overallHealth > 0.5 || activeProviders.length >= 1) {
      status = 'degraded';
    } else {
      status = 'critical';
    }

    const response: HealthResponse = {
      status,
      providers: providerStatus,
      lastUpdated: new Date().toISOString(),
      overallHealth
    };

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
      }
    );
  } catch (error) {
    console.error('AI health check error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

function calculatePerformanceScore(successRate: number, avgResponseTime: number): number {
  // Response time factor (lower is better)
  // 0ms -> 1.0, 5000ms -> 0.0
  const responseTimeFactor = Math.max(0, 1 - (avgResponseTime / 5000));
  
  // Weight success rate more heavily than response time
  return (successRate * 0.7) + (responseTimeFactor * 0.3);
}