import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import { corsHeaders } from "../_shared/cors.ts";

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AnalyticsResponse {
  userMetrics: {
    totalConversations: number;
    totalMessages: number;
    averageMessagesPerConversation: number;
    mostActiveDay: string;
    mostActiveHour: number;
  };
  systemMetrics: {
    totalUsers: number;
    activeUsers: number;
    totalRequests: number;
    averageResponseTime: number;
    successRate: number;
  };
  modelMetrics: Record<string, {
    requests: number;
    averageResponseTime: number;
    successRate: number;
    averageTokens: number;
  }>;
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

    // Get timeframe from query params
    const url = new URL(req.url);
    const timeframeHours = parseInt(url.searchParams.get('hours') || '24', 10);
    
    // Get user metrics
    const userMetrics = await getUserMetrics(user.id, timeframeHours);
    
    // Get system metrics (admin only)
    let systemMetrics = {
      totalUsers: 0,
      activeUsers: 0,
      totalRequests: 0,
      averageResponseTime: 0,
      successRate: 0
    };
    
    // Check if user is admin
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (adminRole) {
      systemMetrics = await getSystemMetrics(timeframeHours);
    }
    
    // Get model metrics
    const modelMetrics = await getModelMetrics(user.id, timeframeHours);
    
    const response: AnalyticsResponse = {
      userMetrics,
      systemMetrics,
      modelMetrics,
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
    console.error('AI analytics error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: error.message.includes('Invalid authentication') ? 401 : 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

async function getUserMetrics(userId: string, timeframeHours: number) {
  // Get conversation metrics
  const timeThreshold = new Date(Date.now() - timeframeHours * 60 * 60 * 1000).toISOString();
  
  const { data: conversations, error: convError } = await supabase
    .from('ai_conversation_history')
    .select('session_id, created_at')
    .eq('user_id', userId)
    .gte('created_at', timeThreshold);
  
  if (convError) throw convError;
  
  // Count unique conversations
  const uniqueConversations = new Set(conversations?.map(c => c.session_id) || []).size;
  
  // Count total messages
  const totalMessages = conversations?.length || 0;
  
  // Calculate average messages per conversation
  const averageMessagesPerConversation = uniqueConversations > 0 
    ? totalMessages / uniqueConversations 
    : 0;
  
  // Find most active day and hour
  const dayCount: Record<string, number> = {};
  const hourCount: Record<number, number> = {};
  
  conversations?.forEach(conv => {
    const date = new Date(conv.created_at);
    const day = date.toISOString().split('T')[0];
    const hour = date.getHours();
    
    dayCount[day] = (dayCount[day] || 0) + 1;
    hourCount[hour] = (hourCount[hour] || 0) + 1;
  });
  
  let mostActiveDay = '';
  let maxDayCount = 0;
  
  for (const [day, count] of Object.entries(dayCount)) {
    if (count > maxDayCount) {
      mostActiveDay = day;
      maxDayCount = count;
    }
  }
  
  let mostActiveHour = 0;
  let maxHourCount = 0;
  
  for (const [hour, count] of Object.entries(hourCount)) {
    if (count > maxHourCount) {
      mostActiveHour = parseInt(hour);
      maxHourCount = count;
    }
  }
  
  return {
    totalConversations: uniqueConversations,
    totalMessages,
    averageMessagesPerConversation,
    mostActiveDay,
    mostActiveHour
  };
}

async function getSystemMetrics(timeframeHours: number) {
  const timeThreshold = new Date(Date.now() - timeframeHours * 60 * 60 * 1000).toISOString();
  
  // Get total users
  const { count: totalUsers, error: userError } = await supabase
    .from('user_data')
    .select('*', { count: 'exact', head: true });
  
  if (userError) throw userError;
  
  // Get active users
  const { data: activeUserData, error: activeError } = await supabase
    .from('ai_conversation_history')
    .select('user_id')
    .gte('created_at', timeThreshold)
    .limit(1000);
  
  if (activeError) throw activeError;
  
  const activeUsers = new Set(activeUserData?.map(u => u.user_id) || []).size;
  
  // Get request metrics
  const { data: requestData, error: requestError } = await supabase
    .from('ai_request_logs')
    .select('success, response_time_ms')
    .gte('created_at', timeThreshold)
    .limit(1000);
  
  if (requestError) throw requestError;
  
  const totalRequests = requestData?.length || 0;
  const successfulRequests = requestData?.filter(r => r.success).length || 0;
  const successRate = totalRequests > 0 ? successfulRequests / totalRequests : 1;
  
  const totalResponseTime = requestData?.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) || 0;
  const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
  
  return {
    totalUsers: totalUsers || 0,
    activeUsers,
    totalRequests,
    averageResponseTime,
    successRate
  };
}

async function getModelMetrics(userId: string, timeframeHours: number) {
  const timeThreshold = new Date(Date.now() - timeframeHours * 60 * 60 * 1000).toISOString();
  
  // Get request metrics by model
  const { data: requestData, error: requestError } = await supabase
    .from('ai_request_logs')
    .select('provider_id, success, response_time_ms, tokens_used')
    .eq('user_id', userId)
    .gte('created_at', timeThreshold)
    .limit(1000);
  
  if (requestError) throw requestError;
  
  const modelMetrics: Record<string, {
    requests: number;
    averageResponseTime: number;
    successRate: number;
    averageTokens: number;
  }> = {};
  
  // Group by model
  requestData?.forEach(request => {
    const model = request.provider_id || 'unknown';
    
    if (!modelMetrics[model]) {
      modelMetrics[model] = {
        requests: 0,
        averageResponseTime: 0,
        successRate: 0,
        averageTokens: 0
      };
    }
    
    modelMetrics[model].requests++;
    modelMetrics[model].averageResponseTime += request.response_time_ms || 0;
    
    if (request.success) {
      modelMetrics[model].successRate++;
    }
    
    modelMetrics[model].averageTokens += request.tokens_used || 0;
  });
  
  // Calculate averages
  for (const model in modelMetrics) {
    const metrics = modelMetrics[model];
    
    metrics.averageResponseTime = metrics.requests > 0 
      ? metrics.averageResponseTime / metrics.requests 
      : 0;
    
    metrics.successRate = metrics.requests > 0 
      ? metrics.successRate / metrics.requests 
      : 1;
    
    metrics.averageTokens = metrics.requests > 0 
      ? metrics.averageTokens / metrics.requests 
      : 0;
  }
  
  return modelMetrics;
}