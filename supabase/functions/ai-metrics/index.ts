import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from "../_shared/cors.ts";

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface MetricsResponse {
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  modelUsage: Record<string, number>;
  errorRate: number;
  timeframeHours: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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

    if (adminError && adminError.code !== 'PGRST116') { // Not found error
      throw adminError;
    }

    const isAdmin = !!adminRole;
    if (!isAdmin) {
      throw new Error('Admin access required');
    }

    // Get timeframe from query params
    const url = new URL(req.url);
    const timeframeHours = parseInt(url.searchParams.get('hours') || '24', 10);
    
    // Get AI metrics from database
    const { data: metrics, error: metricsError } = await supabase
      .from('ai_request_logs')
      .select('user_id, provider_id, success, response_time_ms, response_data, created_at')
      .gte('created_at', new Date(Date.now() - timeframeHours * 60 * 60 * 1000).toISOString());

    if (metricsError) {
      throw metricsError;
    }

    // Calculate metrics
    const totalRequests = metrics?.length || 0;
    const successfulRequests = metrics?.filter(m => m.success).length || 0;
    const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 1;
    const errorRate = totalRequests > 0 ? 1 - successRate : 0;
    
    const averageResponseTime = metrics?.reduce((sum, m) => sum + (m.response_time_ms || 0), 0) / (totalRequests || 1);
    
    // Calculate model usage
    const modelUsage: Record<string, number> = {};
    metrics?.forEach(m => {
      const model = m.provider_id || 'unknown';
      modelUsage[model] = (modelUsage[model] || 0) + 1;
    });

    // Totals the AI Admin Dashboard shows (systemMetrics / userMetrics)
    const { count: totalUsers } = await supabase.from('user_profiles').select('id', { count: 'exact', head: true });
    const activeUsers = new Set((metrics ?? []).map((m: any) => m.user_id).filter(Boolean)).size;
    const totalTokens = (metrics ?? []).reduce((sum: number, m: any) => sum + (Number(m.response_data?.tokensUsed) || 0), 0);

    const response = {
      totalRequests,
      successRate,
      averageResponseTime,
      modelUsage,
      errorRate,
      timeframeHours,
      systemMetrics: { totalUsers: totalUsers ?? 0, activeUsers, totalRequests, successRate, averageResponseTime },
      userMetrics: { totalTokens, estimatedCost: null }, // cost depends on each provider's pricing; not estimated here
    };

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('AI metrics error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message.includes('Admin access required') ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      {
        status: error.message.includes('Admin access required') ? 403 : 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});