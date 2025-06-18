import {
  assertEquals,
  assertExists,
  assertStringIncludes
} from 'std/testing/asserts.ts'
import {
  testClient,
  createTestUser,
  deleteTestUser,
  cleanupTestData,
  mockLLMResponse,
  mockRateLimiter,
  mockCache,
  generateTestDocumentData,
  assertSuccessfulResponse,
  assertErrorResponse,
  generateMaliciousInput,
  validateSecurityHeaders,
  measureExecutionTime,
  loadTest
} from './setup.ts'

// Test suite for document analysis processor
Deno.test('Document Analysis Processor', async (t) => {
  let testUser: any
  const endpoint = 'document-analysis-processor'
  
  // Setup and teardown
  await t.step('Setup test environment', async () => {
    testUser = await createTestUser()
  })
  
  await t.step('Teardown test environment', async () => {
    await cleanupTestData('document_analysis_results', testUser.id)
    await deleteTestUser(testUser.id)
  })
  
  // Basic functionality tests
  await t.step('Processes valid document data successfully', async () => {
    const documentData = generateTestDocumentData(2) // Generate 2 test documents
    const response = await fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.access_token}`
      },
      body: JSON.stringify({
        data: documentData,
        options: {
          performOcr: true,
          extractEntities: true,
          analyzeSentiment: true,
          detectLanguage: true
        },
        context: {
          researchGoals: ['historical context'],
          focusAreas: ['family records'],
          constraints: []
        }
      })
    })
    
    const data = await assertSuccessfulResponse(response)
    assertExists(data.data.analyses)
    assertExists(data.data.modelAnalyses)
    assertEquals(data.data.modelAnalyses.length, 3) // Anthropic, OpenAI, Google
  })
  
  // Error handling tests
  await t.step('Handles invalid document data', async () => {
    const response = await fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.access_token}`
      },
      body: JSON.stringify({
        data: [{ invalid: 'data' }],
        options: {},
        context: {}
      })
    })
    
    await assertErrorResponse(response, 400)
  })
  
  await t.step('Handles missing authentication', async () => {
    const response = await fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: generateTestDocumentData(1),
        options: {},
        context: {}
      })
    })
    
    await assertErrorResponse(response, 401)
  })
  
  // Security tests
  await t.step('Handles malicious input', async () => {
    const maliciousInput = generateMaliciousInput()
    
    for (const [type, input] of Object.entries(maliciousInput)) {
      const response = await fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify({
          data: [{
            content: input,
            metadata: { type: input }
          }],
          options: { type },
          context: {}
        })
      })
      
      // Should not crash or expose sensitive information
      const data = await response.json()
      assertStringIncludes(data.error, 'Invalid input')
    }
  })
  
  await t.step('Includes security headers', async () => {
    const response = await fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.access_token}`
      },
      body: JSON.stringify({
        data: generateTestDocumentData(1),
        options: {},
        context: {}
      })
    })
    
    validateSecurityHeaders(response)
  })
  
  // Performance tests
  await t.step('Meets performance requirements', async () => {
    const { executionTime } = await measureExecutionTime(async () => {
      const response = await fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify({
          data: generateTestDocumentData(3),
          options: {
            performOcr: true,
            extractEntities: true
          },
          context: {}
        })
      })
      
      await assertSuccessfulResponse(response)
    })
    
    // Should complete within 20 seconds for 3 documents with OCR
    assertEquals(executionTime < 20000, true)
  })
  
  await t.step('Handles concurrent requests', async () => {
    const { averageTime, throughput } = await loadTest(
      async () => {
        const response = await fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${testUser.access_token}`
          },
          body: JSON.stringify({
            data: generateTestDocumentData(1),
            options: {},
            context: {}
          })
        })
        
        await assertSuccessfulResponse(response)
      },
      2, // concurrency
      3 // iterations
    )
    
    // Average time should be under 10 seconds
    assertEquals(averageTime < 10000, true)
    // Should handle at least 0.3 requests per second
    assertEquals(throughput >= 0.3, true)
  })
  
  // Rate limiting tests
  await t.step('Enforces rate limits', async () => {
    const requests = Array(30).fill(null).map(() =>
      fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify({
          data: generateTestDocumentData(1),
          options: {},
          context: {}
        })
      })
    )
    
    const responses = await Promise.all(requests)
    const rateLimited = responses.filter(r => r.status === 429)
    
    // Some requests should be rate limited
    assertEquals(rateLimited.length > 0, true)
  })
  
  // Caching tests
  await t.step('Uses caching effectively', async () => {
    const documentData = generateTestDocumentData(1)
    const requestBody = {
      data: documentData,
      options: { test: 'cache' },
      context: {}
    }
    
    // First request
    const response1 = await fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.access_token}`
      },
      body: JSON.stringify(requestBody)
    })
    
    const data1 = await assertSuccessfulResponse(response1)
    
    // Second request (should be cached)
    const response2 = await fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.access_token}`
      },
      body: JSON.stringify(requestBody)
    })
    
    const data2 = await assertSuccessfulResponse(response2)
    
    // Response times should be significantly different
    const time1 = response1.headers.get('x-response-time')
    const time2 = response2.headers.get('x-response-time')
    
    assertEquals(Number(time2) < Number(time1) * 0.5, true)
  })
  
  // Model consensus tests
  await t.step('Combines model results effectively', async () => {
    const response = await fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.access_token}`
      },
      body: JSON.stringify({
        data: generateTestDocumentData(1),
        options: {},
        context: {}
      })
    })
    
    const data = await assertSuccessfulResponse(response)
    
    // Check analyses structure
    assertExists(data.data.analyses)
    assertExists(data.data.confidence)
    assertEquals(typeof data.data.confidence, 'number')
    assertEquals(data.data.confidence >= 0 && data.data.confidence <= 1, true)
    
    // Check model analyses
    assertEquals(data.data.modelAnalyses.length, 3)
    data.data.modelAnalyses.forEach(analysis => {
      assertExists(analysis.provider)
      assertExists(analysis.model)
      assertExists(analysis.analysis)
      assertExists(analysis.confidence)
    })
    
    // Check analysis details
    data.data.analyses.forEach(analysis => {
      assertExists(analysis.documentId)
      assertExists(analysis.entities)
      assertExists(analysis.sentiment)
      assertExists(analysis.language)
      assertExists(analysis.ocrText)
      assertExists(analysis.confidence)
    })
  })
  
  // Error recovery tests
  await t.step('Recovers from model failures', async () => {
    // Mock a model failure
    const originalFetch = globalThis.fetch
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      if (input.toString().includes('anthropic')) {
        throw new Error('Model failure')
      }
      return originalFetch(input, init)
    }
    
    const response = await fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.access_token}`
      },
      body: JSON.stringify({
        data: generateTestDocumentData(1),
        options: {},
        context: {}
      })
    })
    
    // Restore original fetch
    globalThis.fetch = originalFetch
    
    // Should still return a valid response with remaining models
    const data = await assertSuccessfulResponse(response)
    assertEquals(data.data.modelAnalyses.length, 2) // OpenAI and Google only
  })
  
  // Data persistence tests
  await t.step('Persists analysis results', async () => {
    const documentData = generateTestDocumentData(1)
    const response = await fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.access_token}`
      },
      body: JSON.stringify({
        data: documentData,
        options: {},
        context: {}
      })
    })
    
    const data = await assertSuccessfulResponse(response)
    
    // Check database
    const { data: results, error } = await testClient
      .from('document_analysis_results')
      .select()
      .eq('user_id', testUser.id)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (error) throw error
    
    assertEquals(results.length, 1)
    assertEquals(results[0].analysis_data.analyses, data.data.analyses)
  })
  
  // Edge case tests
  await t.step('Handles empty document set', async () => {
    const response = await fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.access_token}`
      },
      body: JSON.stringify({
        data: [],
        options: {},
        context: {}
      })
    })
    
    await assertErrorResponse(response, 400)
  })
  
  await t.step('Handles large documents', async () => {
    const response = await fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.access_token}`
      },
      body: JSON.stringify({
        data: generateTestDocumentData(1, true), // Generate a large document
        options: {
          maxDocumentSize: '10MB',
          chunkSize: '1MB'
        },
        context: {}
      })
    })
    
    const data = await assertSuccessfulResponse(response)
    assertExists(data.data.analyses[0].chunks)
  })
  
  // OCR tests
  await t.step('Processes OCR correctly', async () => {
    const response = await fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.access_token}`
      },
      body: JSON.stringify({
        data: generateTestDocumentData(1, false, true), // Generate document with image
        options: {
          performOcr: true,
          ocrLanguage: 'eng'
        },
        context: {}
      })
    })
    
    const data = await assertSuccessfulResponse(response)
    assertExists(data.data.analyses[0].ocrText)
    assertExists(data.data.analyses[0].ocrConfidence)
  })
  
  // Entity extraction tests
  await t.step('Extracts entities effectively', async () => {
    const response = await fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.access_token}`
      },
      body: JSON.stringify({
        data: generateTestDocumentData(1),
        options: {
          extractEntities: true,
          entityTypes: ['PERSON', 'DATE', 'LOCATION', 'ORGANIZATION']
        },
        context: {}
      })
    })
    
    const data = await assertSuccessfulResponse(response)
    const analysis = data.data.analyses[0]
    
    // Check entity extraction
    assertExists(analysis.entities)
    assertExists(analysis.entities.PERSON)
    assertExists(analysis.entities.DATE)
    assertExists(analysis.entities.LOCATION)
    assertExists(analysis.entities.ORGANIZATION)
    
    // Check entity details
    Object.values(analysis.entities).forEach(entities => {
      entities.forEach(entity => {
        assertExists(entity.text)
        assertExists(entity.type)
        assertExists(entity.confidence)
        assertExists(entity.mentions)
      })
    })
  })
  
  // Language detection tests
  await t.step('Detects language correctly', async () => {
    const response = await fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.access_token}`
      },
      body: JSON.stringify({
        data: generateTestDocumentData(1, false, false, true), // Generate multilingual document
        options: {
          detectLanguage: true,
          supportedLanguages: ['en', 'es', 'fr', 'de']
        },
        context: {}
      })
    })
    
    const data = await assertSuccessfulResponse(response)
    const analysis = data.data.analyses[0]
    
    // Check language detection
    assertExists(analysis.language)
    assertExists(analysis.languageConfidence)
    assertExists(analysis.languageDistribution)
    
    // Check language distribution
    Object.entries(analysis.languageDistribution).forEach(([lang, percentage]) => {
      assertEquals(typeof percentage, 'number')
      assertEquals(percentage >= 0 && percentage <= 100, true)
    })
  })
  
  // Sentiment analysis tests
  await t.step('Analyzes sentiment effectively', async () => {
    const response = await fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.access_token}`
      },
      body: JSON.stringify({
        data: generateTestDocumentData(1, false, false, false, true), // Generate document with varied sentiment
        options: {
          analyzeSentiment: true,
          sentimentGranularity: 'sentence'
        },
        context: {}
      })
    })
    
    const data = await assertSuccessfulResponse(response)
    const analysis = data.data.analyses[0]
    
    // Check sentiment analysis
    assertExists(analysis.sentiment)
    assertExists(analysis.sentiment.overall)
    assertExists(analysis.sentiment.sentences)
    
    // Check sentiment details
    assertEquals(typeof analysis.sentiment.overall.score, 'number')
    assertEquals(analysis.sentiment.overall.score >= -1 && analysis.sentiment.overall.score <= 1, true)
    
    analysis.sentiment.sentences.forEach(sentence => {
      assertExists(sentence.text)
      assertExists(sentence.score)
      assertExists(sentence.magnitude)
    })
  })
}) 