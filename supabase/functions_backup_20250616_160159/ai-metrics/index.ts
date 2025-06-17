import { createClient } from "npm:@supabase/supabase-js@2.39.7";
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
      .select('provider_id, success, response_time_ms, created_at')
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

    const response: MetricsResponse = {
      totalRequests,
      successRate,
      averageResponseTime,
      modelUsage,
      errorRate,
      timeframeHours
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
        error: error.message,
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