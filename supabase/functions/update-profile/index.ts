import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import { corsHeaders } from "../_shared/cors.ts";

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ProfileUpdateRequest {
  updates: Record<string, string>;
  reason?: string;
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

    // Parse request body
    const { updates, reason } = await req.json() as ProfileUpdateRequest;

    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('No updates provided');
    }

    // Validate updates
    const validFields = [
      'name', 'ancestry', 'businessGoals', 'location', 
      'language', 'timezone', 'culturalBackground', 
      'familyTraditions', 'businessType', 'industryFocus'
    ];

    for (const field of Object.keys(updates)) {
      if (!validFields.includes(field)) {
        throw new Error(`Invalid field: ${field}`);
      }
    }

    // Update profile using database function
    const { data, error } = await supabase.rpc(
      'update_user_profile_batch',
      {
        p_updates: updates,
        p_reason: reason || 'User-initiated update',
        p_user_id: user.id
      }
    );

    if (error) throw error;

    // Get updated profile
    const { data: profile, error: profileError } = await supabase.rpc(
      'get_user_profile',
      { p_user_id: user.id }
    );

    if (profileError) throw profileError;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Profile updated successfully',
        profile
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Profile update error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: error.message.includes('Access denied') ? 403 : 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});