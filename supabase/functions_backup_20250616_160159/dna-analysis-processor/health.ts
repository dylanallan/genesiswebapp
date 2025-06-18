import { serve } from 'std/http/server.ts'
import { initLogger } from '../shared/logger.ts'
import { createSuccessResponse } from '../shared/utils.ts'

// Initialize logger
const logger = initLogger('dna-analysis-processor-health', Deno.env.toObject())

serve(async (req: Request) => {
  const startTime = Date.now()
  
  try {
    // Log incoming request
    await logger.logRequest(req)
    
    // Only allow GET requests
    if (req.method !== 'GET') {
      await logger.warn('Invalid request method', { method: req.method })
      return new Response(
        JSON.stringify(createSuccessResponse({ status: 'error', message: 'Method not allowed' })),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check environment variables
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'ANTHROPIC_API_KEY',
      'OPENAI_API_KEY',
      'GOOGLE_AI_API_KEY'
    ]

    const missingVars = requiredEnvVars.filter(varName => !Deno.env.get(varName))
    
    if (missingVars.length > 0) {
      await logger.error('Missing environment variables', null, { missingVars })
      return new Response(
        JSON.stringify(createSuccessResponse({
          status: 'error',
          message: 'Missing environment variables',
          details: missingVars
        })),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check database connection
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )
      
      const { data, error } = await supabase.from('function_logs').select('count').limit(1)
      
      if (error) {
        throw error
      }
      
      await logger.debug('Database connection successful', { data })
    } catch (error) {
      await logger.error('Database connection failed', error)
      return new Response(
        JSON.stringify(createSuccessResponse({
          status: 'error',
          message: 'Database connection failed',
          details: error.message
        })),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Check AI service connections
    try {
      // Test Anthropic
      const { Anthropic } = await import('@anthropic-ai/sdk')
      const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! })
      await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }]
      })
      
      // Test OpenAI
      const { OpenAI } = await import('openai')
      const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! })
      await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }]
      })
      
      // Test Google AI
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(Deno.env.get('GOOGLE_AI_API_KEY')!)
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
      await model.generateContent('test')
      
      await logger.debug('AI service connections successful')
    } catch (error) {
      await logger.error('AI service connection failed', error)
      return new Response(
        JSON.stringify(createSuccessResponse({
          status: 'error',
          message: 'AI service connection failed',
          details: error.message
        })),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Log performance
    await logger.logPerformance('Health check', startTime)

    // Return success response
    const response = createSuccessResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: Deno.env.get('ENVIRONMENT') || 'development'
    })
    
    const responseObj = new Response(
      JSON.stringify(response),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

    // Log response
    await logger.logResponse(responseObj)
    
    return responseObj

  } catch (error) {
    await logger.fatal('Unhandled error in health check', error)
    
    return new Response(
      JSON.stringify(createSuccessResponse({
        status: 'error',
        message: 'Internal server error',
        details: error.message
      })),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}) 