import { serve } from 'std/http/server.ts'
import { createClient } from '@supabase/supabase-js'
import { AIService } from '../shared/ai-utils.ts'
import { withCors } from '../shared/cors.ts'
import { withErrorHandling, AppError } from '../shared/error-handler.ts'
import { initLogger } from '../shared/logger.ts'

// Initialize services
const logger = initLogger('dna-analysis-processor')
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)
const aiService = new AIService()

// Request/Response interfaces
interface DNAAnalysisRequest {
  dnaData: {
    haplogroup?: string
    ancestry?: string[]
    matches?: Array<{
      name: string
      relationship: string
      sharedDna: number
    }>
    rawData?: string
  }
  analysisType: 'ancestry' | 'health' | 'traits' | 'matches'
  options?: {
    detailedAnalysis?: boolean
    includeRawData?: boolean
    language?: string
  }
}

interface DNAAnalysisResponse {
  analysis: {
    summary: string
    details: string
    confidence: number
    metadata: Record<string, unknown>
  }
  recommendations?: string[]
  warnings?: string[]
}

// Main handler
async function handleRequest(req: Request): Promise<Response> {
  // Parse and validate request
  const requestData = await req.json() as DNAAnalysisRequest
  
  if (!requestData.dnaData) {
    throw new AppError('DNA data is required', 400, 'VALIDATION_ERROR')
  }

  if (!requestData.analysisType) {
    throw new AppError('Analysis type is required', 400, 'VALIDATION_ERROR')
  }

  // Generate prompt based on analysis type
  const prompt = generatePrompt(requestData)
  logger.info('Generated prompt for analysis', { analysisType: requestData.analysisType })

  // Process with AI service
  const aiResponse = await aiService.processRequest({
    prompt,
    model: 'claude-3-opus-20240229',
    maxTokens: 2000,
    temperature: 0.7
  })

  // Parse and structure the response
  const analysis = parseAIResponse(aiResponse.content, requestData.analysisType)
  logger.info('Analysis completed', { 
    analysisType: requestData.analysisType,
    confidence: analysis.confidence 
  })

  // Store result in database
  const { error: dbError } = await supabase
    .from('dna_analysis_results')
    .insert({
      request_id: crypto.randomUUID(),
      input_data: requestData,
      output_data: analysis,
      created_at: new Date().toISOString()
    })

  if (dbError) {
    logger.error('Failed to store analysis result', dbError)
    // Don't throw error, just log it
  }

  // Return response
  return new Response(
    JSON.stringify(analysis),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

// Helper functions
function generatePrompt(request: DNAAnalysisRequest): string {
  const { dnaData, analysisType, options } = request
  const language = options?.language || 'en'
  const detailed = options?.detailedAnalysis ? 'detailed' : 'concise'

  const basePrompt = `Please provide a ${detailed} ${analysisType} analysis of the following DNA data in ${language}:\n\n`
  
  let dataPrompt = ''
  if (dnaData.haplogroup) {
    dataPrompt += `Haplogroup: ${dnaData.haplogroup}\n`
  }
  if (dnaData.ancestry?.length) {
    dataPrompt += `Ancestry: ${dnaData.ancestry.join(', ')}\n`
  }
  if (dnaData.matches?.length) {
    dataPrompt += 'DNA Matches:\n' + dnaData.matches
      .map(m => `- ${m.name} (${m.relationship}): ${m.sharedDna}% shared DNA`)
      .join('\n')
  }
  if (options?.includeRawData && dnaData.rawData) {
    dataPrompt += `\nRaw Data:\n${dnaData.rawData}`
  }

  return basePrompt + dataPrompt
}

function parseAIResponse(content: string, analysisType: string): DNAAnalysisResponse {
  try {
    // Basic parsing - in a real implementation, you'd want more robust parsing
    const sections = content.split('\n\n')
    const summary = sections[0] || ''
    const details = sections[1] || ''
    const recommendations = sections[2]?.split('\n').filter(Boolean) || []
    const warnings = sections[3]?.split('\n').filter(Boolean) || []

    return {
      analysis: {
        summary,
        details,
        confidence: calculateConfidence(content, analysisType),
        metadata: {
          analysisType,
          timestamp: new Date().toISOString(),
          model: 'claude-3-opus-20240229'
        }
      },
      recommendations: recommendations.length ? recommendations : undefined,
      warnings: warnings.length ? warnings : undefined
    }
  } catch (error) {
    logger.error('Failed to parse AI response', error)
    throw new AppError('Failed to parse analysis results', 500, 'PARSING_ERROR')
  }
}

function calculateConfidence(content: string, analysisType: string): number {
  // Simple confidence calculation based on content length and analysis type
  const baseConfidence = Math.min(content.length / 1000, 0.95)
  
  // Adjust confidence based on analysis type
  const typeMultiplier = {
    ancestry: 1.0,
    health: 0.8,
    traits: 0.7,
    matches: 0.9
  }[analysisType] || 0.8

  return Math.round((baseConfidence * typeMultiplier) * 100) / 100
}

// Serve the function with middleware
serve(withErrorHandling(withCors(handleRequest))) 