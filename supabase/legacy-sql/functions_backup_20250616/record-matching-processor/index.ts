import { serve } from 'std/http/server.ts'
import { createClient } from '@supabase/supabase-js'
import { AIService } from '../shared/ai-utils.ts'
import { withCors } from '../shared/cors.ts'
import { withErrorHandling, AppError } from '../shared/error-handler.ts'
import { initLogger } from '../shared/logger.ts'

// Initialize services
const logger = initLogger('record-matching-processor')
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)
const aiService = new AIService()

// Request/Response interfaces
interface Record {
  id: string
  type: 'person' | 'event' | 'relationship' | 'location'
  data: {
    name?: string
    date?: string
    location?: string
    relationships?: Array<{
      type: string
      targetId: string
      details?: Record<string, unknown>
    }>
    attributes?: Record<string, unknown>
  }
  metadata?: {
    source?: string
    confidence?: number
    lastUpdated?: string
  }
}

interface RecordMatchingRequest {
  records: Record[]
  options?: {
    matchTypes?: Array<'person' | 'event' | 'relationship' | 'location'>
    minConfidence?: number
    useAI?: boolean
    includeMetadata?: boolean
  }
}

interface RecordMatch {
  record1: Record
  record2: Record
  confidence: number
  matchType: 'person' | 'event' | 'relationship' | 'location'
  details: {
    nameSimilarity?: number
    dateSimilarity?: number
    locationSimilarity?: number
    relationshipSimilarity?: number
    attributeSimilarity?: number
  }
  discrepancies?: Array<{
    field: string
    value1: unknown
    value2: unknown
    severity: 'low' | 'medium' | 'high'
  }>
  aiAnalysis?: {
    explanation: string
    confidence: number
    reasoning: string[]
  }
}

interface RecordMatchingResponse {
  matches: RecordMatch[]
  statistics: {
    totalRecords: number
    totalMatches: number
    averageConfidence: number
    matchTypeDistribution: Record<string, number>
    confidenceDistribution: {
      high: number
      medium: number
      low: number
    }
  }
  metadata?: {
    processingTime: number
    aiUsage: boolean
    timestamp: string
  }
}

// Main handler
async function handleRequest(req: Request): Promise<Response> {
  const startTime = Date.now()
  
  // Parse and validate request
  const requestData = await req.json() as RecordMatchingRequest
  
  if (!requestData.records || requestData.records.length < 2) {
    throw new AppError('At least two records are required for matching', 400, 'VALIDATION_ERROR')
  }

  // Get match types to process
  const matchTypes = requestData.options?.matchTypes || ['person', 'event', 'relationship', 'location']
  const minConfidence = requestData.options?.minConfidence || 0.6
  const useAI = requestData.options?.useAI || false

  logger.info('Starting record matching', {
    recordCount: requestData.records.length,
    matchTypes,
    minConfidence,
    useAI
  })

  // Perform matching
  const matches: RecordMatch[] = []
  const processedPairs = new Set<string>()

  for (let i = 0; i < requestData.records.length; i++) {
    for (let j = i + 1; j < requestData.records.length; j++) {
      const record1 = requestData.records[i]
      const record2 = requestData.records[j]

      // Skip if pair already processed
      const pairKey = `${record1.id}-${record2.id}`
      if (processedPairs.has(pairKey)) continue
      processedPairs.add(pairKey)

      // Skip if record types don't match or aren't in requested types
      if (record1.type !== record2.type || !matchTypes.includes(record1.type)) {
        continue
      }

      // Calculate match
      const match = await calculateMatch(record1, record2, useAI)
      
      if (match.confidence >= minConfidence) {
        matches.push(match)
      }
    }
  }

  // Calculate statistics
  const statistics = calculateStatistics(matches, requestData.records.length)
  const processingTime = Date.now() - startTime

  logger.info('Record matching completed', {
    matchCount: matches.length,
    processingTime,
    averageConfidence: statistics.averageConfidence
  })

  // Store results if metadata inclusion requested
  if (requestData.options?.includeMetadata) {
    const { error: dbError } = await supabase
      .from('record_matches')
      .insert({
        request_id: crypto.randomUUID(),
        input_data: requestData,
        output_data: { matches, statistics },
        processing_time: processingTime,
        created_at: new Date().toISOString()
      })

    if (dbError) {
      logger.error('Failed to store match results', dbError)
      // Don't throw error, just log it
    }
  }

  // Return response
  return new Response(
    JSON.stringify({
      matches,
      statistics,
      metadata: {
        processingTime,
        aiUsage: useAI,
        timestamp: new Date().toISOString()
      }
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

// Helper functions
async function calculateMatch(
  record1: Record,
  record2: Record,
  useAI: boolean
): Promise<RecordMatch> {
  const matchType = record1.type
  const details: RecordMatch['details'] = {}
  const discrepancies: RecordMatch['discrepancies'] = []

  // Calculate similarities based on record type
  switch (matchType) {
    case 'person':
      details.nameSimilarity = calculateNameSimilarity(record1.data.name, record2.data.name)
      details.dateSimilarity = calculateDateSimilarity(record1.data.date, record2.data.date)
      details.locationSimilarity = calculateLocationSimilarity(record1.data.location, record2.data.location)
      details.relationshipSimilarity = calculateRelationshipSimilarity(
        record1.data.relationships,
        record2.data.relationships
      )
      break

    case 'event':
      details.dateSimilarity = calculateDateSimilarity(record1.data.date, record2.data.date)
      details.locationSimilarity = calculateLocationSimilarity(record1.data.location, record2.data.location)
      details.attributeSimilarity = calculateAttributeSimilarity(
        record1.data.attributes,
        record2.data.attributes
      )
      break

    case 'relationship':
      details.attributeSimilarity = calculateAttributeSimilarity(
        record1.data.attributes,
        record2.data.attributes
      )
      if (record1.data.relationships && record2.data.relationships) {
        details.relationshipSimilarity = calculateRelationshipSimilarity(
          record1.data.relationships,
          record2.data.relationships
        )
      }
      break

    case 'location':
      details.nameSimilarity = calculateNameSimilarity(record1.data.name, record2.data.name)
      details.attributeSimilarity = calculateAttributeSimilarity(
        record1.data.attributes,
        record2.data.attributes
      )
      break
  }

  // Collect discrepancies
  collectDiscrepancies(record1, record2, discrepancies)

  // Calculate overall confidence
  const confidence = calculateOverallConfidence(details, matchType)

  // Get AI analysis if requested
  let aiAnalysis: RecordMatch['aiAnalysis'] | undefined
  if (useAI && confidence >= 0.7) {
    aiAnalysis = await getAIAnalysis(record1, record2, matchType, details)
  }

  return {
    record1,
    record2,
    confidence,
    matchType,
    details,
    discrepancies: discrepancies.length > 0 ? discrepancies : undefined,
    aiAnalysis
  }
}

function calculateNameSimilarity(name1?: string, name2?: string): number {
  if (!name1 || !name2) return 0
  
  // Normalize names
  const n1 = name1.toLowerCase().trim()
  const n2 = name2.toLowerCase().trim()
  
  if (n1 === n2) return 1
  
  // Split into parts and compare
  const parts1 = n1.split(/\s+/);
  const parts2 = n2.split(/\s+/);
  
  let matches = 0
  for (const part1 of parts1) {
    for (const part2 of parts2) {
      if (part1 === part2) {
        matches++
        break
      }
    }
  }
  
  return matches / Math.max(parts1.length, parts2.length)
}

function calculateDateSimilarity(date1?: string, date2?: string): number {
  if (!date1 || !date2) return 0
  
  try {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0
    
    const diffYears = Math.abs(d1.getFullYear() - d2.getFullYear())
    if (diffYears === 0) return 1
    if (diffYears <= 1) return 0.9
    if (diffYears <= 5) return 0.7
    if (diffYears <= 10) return 0.5
    return 0.2
  } catch {
    return 0
  }
}

function calculateLocationSimilarity(loc1?: string, loc2?: string): number {
  if (!loc1 || !loc2) return 0
  
  const l1 = loc1.toLowerCase().trim()
  const l2 = loc2.toLowerCase().trim()
  
  if (l1 === l2) return 1
  
  // Check if one location contains the other
  if (l1.includes(l2) || l2.includes(l1)) return 0.8
  
  // Split into parts and compare
  const parts1 = l1.split(/[,\s]+/);
  const parts2 = l2.split(/[,\s]+/);
  
  let matches = 0
  for (const part1 of parts1) {
    for (const part2 of parts2) {
      if (part1 === part2 && part1.length > 2) {
        matches++
        break
      }
    }
  }
  
  return matches / Math.max(parts1.length, parts2.length)
}

function calculateRelationshipSimilarity(
  rel1?: Record['data']['relationships'],
  rel2?: Record['data']['relationships']
): number {
  if (!rel1 || !rel2) return 0
  
  let matches = 0
  for (const r1 of rel1) {
    for (const r2 of rel2) {
      if (r1.type === r2.type && r1.targetId === r2.targetId) {
        matches++
        break
      }
    }
  }
  
  return matches / Math.max(rel1.length, rel2.length)
}

function calculateAttributeSimilarity(
  attr1?: Record['data']['attributes'],
  attr2?: Record['data']['attributes']
): number {
  if (!attr1 || !attr2) return 0
  
  const keys1 = Object.keys(attr1)
  const keys2 = Object.keys(attr2)
  
  if (keys1.length === 0 || keys2.length === 0) return 0
  
  let matches = 0
  for (const key of keys1) {
    if (key in attr2 && attr1[key] === attr2[key]) {
      matches++
    }
  }
  
  return matches / Math.max(keys1.length, keys2.length)
}

function calculateOverallConfidence(
  details: RecordMatch['details'],
  matchType: Record['type']
): number {
  const weights = {
    person: {
      nameSimilarity: 0.3,
      dateSimilarity: 0.2,
      locationSimilarity: 0.2,
      relationshipSimilarity: 0.3
    },
    event: {
      dateSimilarity: 0.4,
      locationSimilarity: 0.3,
      attributeSimilarity: 0.3
    },
    relationship: {
      relationshipSimilarity: 0.6,
      attributeSimilarity: 0.4
    },
    location: {
      nameSimilarity: 0.5,
      attributeSimilarity: 0.5
    }
  }

  const typeWeights = weights[matchType]
  let totalWeight = 0
  let weightedSum = 0

  for (const [key, weight] of Object.entries(typeWeights)) {
    const value = details[key as keyof typeof details] || 0
    weightedSum += value * weight
    totalWeight += weight
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0
}

function collectDiscrepancies(
  record1: Record,
  record2: Record,
  discrepancies: RecordMatch['discrepancies']
): void {
  // Compare names
  if (record1.data.name && record2.data.name && record1.data.name !== record2.data.name) {
    discrepancies.push({
      field: 'name',
      value1: record1.data.name,
      value2: record2.data.name,
      severity: 'high'
    })
  }

  // Compare dates
  if (record1.data.date && record2.data.date && record1.data.date !== record2.data.date) {
    const dateDiff = Math.abs(
      new Date(record1.data.date).getTime() - new Date(record2.data.date).getTime()
    )
    const diffYears = dateDiff / (1000 * 60 * 60 * 24 * 365)
    
    discrepancies.push({
      field: 'date',
      value1: record1.data.date,
      value2: record2.data.date,
      severity: diffYears <= 1 ? 'low' : diffYears <= 5 ? 'medium' : 'high'
    })
  }

  // Compare locations
  if (record1.data.location && record2.data.location && record1.data.location !== record2.data.location) {
    discrepancies.push({
      field: 'location',
      value1: record1.data.location,
      value2: record2.data.location,
      severity: 'medium'
    })
  }

  // Compare relationships
  if (record1.data.relationships && record2.data.relationships) {
    const rel1 = new Set(record1.data.relationships.map(r => `${r.type}:${r.targetId}`))
    const rel2 = new Set(record2.data.relationships.map(r => `${r.type}:${r.targetId}`))
    
    for (const rel of record1.data.relationships) {
      if (!rel2.has(`${rel.type}:${rel.targetId}`)) {
        discrepancies.push({
          field: 'relationship',
          value1: `${rel.type}:${rel.targetId}`,
          value2: 'missing',
          severity: 'medium'
        })
      }
    }
  }

  // Compare attributes
  if (record1.data.attributes && record2.data.attributes) {
    for (const [key, value1] of Object.entries(record1.data.attributes)) {
      const value2 = record2.data.attributes[key]
      if (value2 !== undefined && value1 !== value2) {
        discrepancies.push({
          field: `attribute.${key}`,
          value1,
          value2,
          severity: 'low'
        })
      }
    }
  }
}

async function getAIAnalysis(
  record1: Record,
  record2: Record,
  matchType: Record['type'],
  details: RecordMatch['details']
): Promise<RecordMatch['aiAnalysis']> {
  const prompt = `Analyze the following genealogical records and determine if they likely refer to the same ${matchType}:

Record 1:
${JSON.stringify(record1, null, 2)}

Record 2:
${JSON.stringify(record2, null, 2)}

Similarity Details:
${JSON.stringify(details, null, 2)}

Please provide:
1. A clear explanation of whether these records likely refer to the same ${matchType}
2. Your confidence level (0-1)
3. Key reasoning points supporting your conclusion

Format your response as JSON with the following structure:
{
  "explanation": "string",
  "confidence": number,
  "reasoning": ["string"]
}`

  try {
    const response = await aiService.processRequest({
      prompt,
      model: 'claude-3-opus-20240229',
      maxTokens: 1000,
      temperature: 0.3
    })

    const analysis = JSON.parse(response.content)
    return {
      explanation: analysis.explanation,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning
    }
  } catch (error) {
    logger.error('Failed to get AI analysis', error)
    return undefined
  }
}

function calculateStatistics(
  matches: RecordMatch[],
  totalRecords: number
): RecordMatchingResponse['statistics'] {
  const matchTypeCounts: Record<string, number> = {}
  const confidenceCounts = { high: 0, medium: 0, low: 0 }
  let totalConfidence = 0

  for (const match of matches) {
    // Count match types
    matchTypeCounts[match.matchType] = (matchTypeCounts[match.matchType] || 0) + 1

    // Count confidence levels
    if (match.confidence >= 0.8) confidenceCounts.high++
    else if (match.confidence >= 0.6) confidenceCounts.medium++
    else confidenceCounts.low++

    totalConfidence += match.confidence
  }

  // Calculate distributions
  const matchTypeDistribution: Record<string, number> = {}
  for (const [type, count] of Object.entries(matchTypeCounts)) {
    matchTypeDistribution[type] = count / matches.length
  }

  return {
    totalRecords,
    totalMatches: matches.length,
    averageConfidence: matches.length > 0 ? totalConfidence / matches.length : 0,
    matchTypeDistribution,
    confidenceDistribution: {
      high: matches.length > 0 ? confidenceCounts.high / matches.length : 0,
      medium: matches.length > 0 ? confidenceCounts.medium / matches.length : 0,
      low: matches.length > 0 ? confidenceCounts.low / matches.length : 0
    }
  }
}

// Serve the function with middleware
serve(withErrorHandling(withCors(handleRequest))) 