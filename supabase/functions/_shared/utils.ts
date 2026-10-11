import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from './cors.ts'
import { cfg } from './runtime-config.ts'

export const createSupabaseClient = (req: Request) => {
  const supabaseUrl = cfg('SUPABASE_URL') ?? ''
  const supabaseServiceKey = cfg('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  })
}

export const handleError = (error: Error) => {
  console.error('Error:', error.message)
  return new Response(
    JSON.stringify({ error: error.message }),
    { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
}

export const validateRequest = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
  
  return null
}
