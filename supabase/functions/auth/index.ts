/// <reference lib="deno.ns" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { corsHeaders } from "../_shared/cors.ts";

// Initialize Supabase client (using service role key for auth operations)
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AuthRequest {
  email: string;
  password: string;
  isSignUp?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const { email, password, isSignUp } = (await req.json()) as AuthRequest;

    if (!email || !password) {
      throw new Error("email and password are required");
    }

    let authResponse;
    if (isSignUp) {
      // Mirror signup (register) behavior
      authResponse = await supabase.auth.signUp({ email, password });
    } else {
      // Mirror login (sign in) behavior
      authResponse = await supabase.auth.signInWithPassword({ email, password });
    }

    if (authResponse.error) {
      throw authResponse.error;
    }

    return new Response(JSON.stringify(authResponse), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Auth error:", error);
    return new Response(JSON.stringify({ error: (error instanceof Error) ? error.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
}); 