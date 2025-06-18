import { serve } from 'std/http/server.ts'
import { createClient } from '@supabase/supabase-js'
import { createWorker } from 'tesseract.js'
import { AIService } from '../shared/ai-utils.ts'
import { withCors } from '../shared/cors.ts'
import { withErrorHandling, AppError } from '../shared/error-handler.ts'
import { initLogger } from '../shared/logger.ts'

// Initialize services
const logger = initLogger('document-analysis-processor')
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)
const aiService = new AIService()

// Request/Response interfaces
interface DocumentAnalysisRequest {
  document: {
    text?: string
    imageUrl?: string
    language?: string
  }
  analysisType: 'text' | 'sentiment' | 'entities' | 'summary' | 'translation'
  options?: {
    extractTables?: boolean
    extractImages?: boolean
    targetLanguage?: string
    detailedAnalysis?: boolean
  }
}

interface DocumentAnalysisResponse {
  analysis: {
    text: string
    summary: string
    metadata: {
      language: string
      wordCount: number
      confidence: number
      processingTime: number
    }
    entities?: Array<{
      text: string
      type: string
      confidence: number
    }>
    sentiment?: {
      score: number
      label: string
      aspects: Array<{
        aspect: string
        score: number
      }>
    }
    tables?: Array<{
      content: string[][]
      confidence: number
    }>
    images?: Array<{
      description: string
      confidence: number
    }>
  }
  translation?: {
    text: string
    sourceLanguage: string
    targetLanguage: string
    confidence: number
  }
}

// Main handler
async function handleRequest(req: Request): Promise<Response> {
  const startTime = Date.now()
  
  // Parse and validate request
  const requestData = await req.json() as DocumentAnalysisRequest
  
  if (!requestData.document) {
    throw new AppError('Document data is required', 400, 'VALIDATION_ERROR')
  }

  if (!requestData.analysisType) {
    throw new AppError('Analysis type is required', 400, 'VALIDATION_ERROR')
  }

  if (!requestData.document.text && !requestData.document.imageUrl) {
    throw new AppError('Either text or image URL is required', 400, 'VALIDATION_ERROR')
  }

  // Extract text from image if needed
  let documentText = requestData.document.text
  if (!documentText && requestData.document.imageUrl) {
    documentText = await extractTextFromImage(requestData.document.imageUrl)
    logger.info('Extracted text from image', { 
      imageUrl: requestData.document.imageUrl,
      textLength: documentText.length 
    })
  }

  // Generate prompt based on analysis type
  const prompt = generatePrompt(documentText!, requestData)
  logger.info('Generated prompt for analysis', { analysisType: requestData.analysisType })

  // Process with AI service
  const aiResponse = await aiService.processRequest({
    prompt,
    model: 'claude-3-opus-20240229',
    maxTokens: 2000,
    temperature: 0.7
  })

  // Parse and structure the response
  const analysis = parseAIResponse(aiResponse.content, requestData, documentText!)
  const processingTime = Date.now() - startTime
  
  logger.info('Analysis completed', { 
    analysisType: requestData.analysisType,
    processingTime,
    confidence: analysis.analysis.metadata.confidence 
  })

  // Store result in database
  const { error: dbError } = await supabase
    .from('document_analysis_results')
    .insert({
      request_id: crypto.randomUUID(),
      input_data: requestData,
      output_data: analysis,
      processing_time: processingTime,
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
async function extractTextFromImage(imageUrl: string): Promise<string> {
  try {
    const worker = await createWorker()
    await worker.loadLanguage('eng')
    await worker.initialize('eng')
    
    const { data: { text } } = await worker.recognize(imageUrl)
    await worker.terminate()
    
    return text
  } catch (error) {
    logger.error('Failed to extract text from image', error)
    throw new AppError('Failed to extract text from image', 500, 'OCR_ERROR')
  }
}

function generatePrompt(text: string, request: DocumentAnalysisRequest): string {
  const { analysisType, options } = request
  const language = request.document.language || 'en'
  const detailed = options?.detailedAnalysis ? 'detailed' : 'concise'

  const basePrompt = `Please provide a ${detailed} ${analysisType} analysis of the following document in ${language}:\n\n${text}\n\n`
  
  let analysisInstructions = ''
  switch (analysisType) {
    case 'text':
      analysisInstructions = 'Analyze the text for readability, structure, and key themes.'
      break
    case 'sentiment':
      analysisInstructions = 'Analyze the sentiment of the text, including overall tone and specific aspects.'
      break
    case 'entities':
      analysisInstructions = 'Identify and categorize named entities (people, places, organizations, etc.).'
      break
    case 'summary':
      analysisInstructions = 'Provide a comprehensive summary of the document.'
      break
    case 'translation':
      analysisInstructions = `Translate the text to ${options?.targetLanguage || 'English'}.`
      break
  }

  if (options?.extractTables) {
    analysisInstructions += '\nIdentify and extract any tables in the text.'
  }

  if (options?.extractImages) {
    analysisInstructions += '\nDescribe any images or visual elements mentioned in the text.'
  }

  return basePrompt + analysisInstructions
}

function parseAIResponse(
  content: string,
  request: DocumentAnalysisRequest,
  originalText: string
): DocumentAnalysisResponse {
  try {
    const sections = content.split('\n\n')
    const summary = sections[0] || ''
    const details = sections[1] || ''

    // Basic metadata
    const metadata = {
      language: request.document.language || 'en',
      wordCount: originalText.split(/\s+/).length,
      confidence: calculateConfidence(content, request.analysisType),
      processingTime: 0 // Will be set by the handler
    }

    // Parse specific analysis types
    const analysis: DocumentAnalysisResponse['analysis'] = {
      text: originalText,
      summary,
      metadata
    }

    // Parse entities if present
    if (request.analysisType === 'entities') {
      const entitySection = sections.find(s => s.includes('Entities:'))
      if (entitySection) {
        analysis.entities = parseEntities(entitySection)
      }
    }

    // Parse sentiment if present
    if (request.analysisType === 'sentiment') {
      const sentimentSection = sections.find(s => s.includes('Sentiment:'))
      if (sentimentSection) {
        analysis.sentiment = parseSentiment(sentimentSection)
      }
    }

    // Parse tables if requested
    if (request.options?.extractTables) {
      const tableSection = sections.find(s => s.includes('Tables:'))
      if (tableSection) {
        analysis.tables = parseTables(tableSection)
      }
    }

    // Parse images if requested
    if (request.options?.extractImages) {
      const imageSection = sections.find(s => s.includes('Images:'))
      if (imageSection) {
        analysis.images = parseImages(imageSection)
      }
    }

    // Parse translation if requested
    let translation: DocumentAnalysisResponse['translation'] | undefined
    if (request.analysisType === 'translation') {
      translation = {
        text: details,
        sourceLanguage: request.document.language || 'en',
        targetLanguage: request.options?.targetLanguage || 'en',
        confidence: metadata.confidence
      }
    }

    return { analysis, translation }
  } catch (error) {
    logger.error('Failed to parse AI response', error)
    throw new AppError('Failed to parse analysis results', 500, 'PARSING_ERROR')
  }
}

function calculateConfidence(content: string, analysisType: string): number {
  const baseConfidence = Math.min(content.length / 1000, 0.95)
  
  const typeMultiplier = {
    text: 1.0,
    sentiment: 0.9,
    entities: 0.85,
    summary: 0.95,
    translation: 0.9
  }[analysisType] || 0.8

  return Math.round((baseConfidence * typeMultiplier) * 100) / 100
}

function parseEntities(section: string): DocumentAnalysisResponse['analysis']['entities'] {
  const entities: DocumentAnalysisResponse['analysis']['entities'] = []
  const lines = section.split('\n').filter(line => line.includes(':'))
  
  for (const line of lines) {
    const [text, info] = line.split(':').map(s => s.trim())
    const [type, confidence] = info.split(',').map(s => s.trim())
    entities.push({
      text,
      type: type.toLowerCase(),
      confidence: parseFloat(confidence) || 0.8
    })
  }
  
  return entities
}

function parseSentiment(section: string): DocumentAnalysisResponse['analysis']['sentiment'] {
  const lines = section.split('\n')
  const scoreLine = lines.find(line => line.includes('Score:'))
  const labelLine = lines.find(line => line.includes('Label:'))
  const aspects: DocumentAnalysisResponse['analysis']['sentiment']['aspects'] = []
  
  const score = scoreLine ? parseFloat(scoreLine.split(':')[1]) : 0
  const label = labelLine ? labelLine.split(':')[1].trim() : 'neutral'
  
  // Parse aspects if present
  const aspectSection = lines.findIndex(line => line.includes('Aspects:'))
  if (aspectSection !== -1) {
    for (let i = aspectSection + 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line || line.includes(':')) break
      
      const [aspect, aspectScore] = line.split(':').map(s => s.trim())
      aspects.push({
        aspect,
        score: parseFloat(aspectScore) || 0
      })
    }
  }
  
  return { score, label, aspects }
}

function parseTables(section: string): DocumentAnalysisResponse['analysis']['tables'] {
  const tables: DocumentAnalysisResponse['analysis']['tables'] = []
  const tableSections = section.split('Table:').filter(Boolean)
  
  for (const tableSection of tableSections) {
    const lines = tableSection.split('\n').filter(Boolean)
    const content: string[][] = lines.map(line => 
      line.split('|').map(cell => cell.trim())
    )
    
    tables.push({
      content,
      confidence: 0.8 // Default confidence
    })
  }
  
  return tables
}

function parseImages(section: string): DocumentAnalysisResponse['analysis']['images'] {
  const images: DocumentAnalysisResponse['analysis']['images'] = []
  const lines = section.split('\n').filter(line => line.startsWith('-'))
  
  for (const line of lines) {
    const description = line.replace(/^-\s*/, '').trim()
    images.push({
      description,
      confidence: 0.8 // Default confidence
    })
  }
  
  return images
}

// Serve the function with middleware
serve(withErrorHandling(withCors(handleRequest))) 