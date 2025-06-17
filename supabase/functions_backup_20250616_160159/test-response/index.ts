import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("Test response function called");
    
    // Return a simple text response
    return new Response(
      "This is a test response from the edge function. If you can see this, your edge functions are working correctly!",
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/plain',
        },
      }
    );
  } catch (error) {
    console.error('Test function error:', error);
    
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