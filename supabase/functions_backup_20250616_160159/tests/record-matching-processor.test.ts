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
  generateTestRecordData,
  assertSuccessfulResponse,
  assertErrorResponse,
  generateMaliciousInput,
  validateSecurityHeaders,
  measureExecutionTime,
  loadTest
} from './setup.ts'

// Test suite for record matching processor
Deno.test('Record Matching Processor', async (t) => {
  let testUser: any
  const endpoint = 'record-matching-processor'
  
  // Setup and teardown
  await t.step('Setup test environment', async () => {
    testUser = await createTestUser()
  })
  
  await t.step('Teardown test environment', async () => {
    await cleanupTestData('record_matching_results', testUser.id)
    await deleteTestUser(testUser.id)
  })
  
  // Basic functionality tests
  await t.step('Processes valid records successfully', async () => {
    const records = generateTestRecordData(3) // Generate 3 test records
    const response = await fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.access_token}`
      },
      body: JSON.stringify({
        records,
        criteria: {
          matchThreshold: 0.7,
          requiredFields: ['name', 'date', 'location'],
          optionalFields: ['occupation', 'family']
        },
        context: {
          researchGoals: ['family connections'],
          focusAreas: ['19th century'],
          constraints: []
        }
      })
    })
    
    const data = await assertSuccessfulResponse(response)
    assertExists(data.data.matches)
    assertExists(data.data.modelAnalyses)
    assertEquals(data.data.modelAnalyses.length, 3) // Anthropic, OpenAI, Google
  })
  
  // Error handling tests
  await t.step('Handles invalid record data', async () => {
    const response = await fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.access_token}`
      },
      body: JSON.stringify({
        records: [{ invalid: 'data' }],
        criteria: {},
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
        records: generateTestRecordData(2),
        criteria: {},
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
          records: [{
            name: input,
            date: input,
            location: input
          }],
          criteria: { type },
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
        records: generateTestRecordData(2),
        criteria: {},
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
          records: generateTestRecordData(5),
          criteria: {},
          context: {}
        })
      })
      
      await assertSuccessfulResponse(response)
    })
    
    // Should complete within 15 seconds for 5 records
    assertEquals(executionTime < 15000, true)
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
            records: generateTestRecordData(2),
            criteria: {},
            context: {}
          })
        })
        
        await assertSuccessfulResponse(response)
      },
      3, // concurrency
      5 // iterations
    )
    
    // Average time should be under 8 seconds
    assertEquals(averageTime < 8000, true)
    // Should handle at least 0.5 requests per second
    assertEquals(throughput >= 0.5, true)
  })
  
  // Rate limiting tests
  await t.step('Enforces rate limits', async () => {
    const requests = Array(50).fill(null).map(() =>
      fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${testUser.access_token}`
        },
        body: JSON.stringify({
          records: generateTestRecordData(2),
          criteria: {},
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
    const records = generateTestRecordData(2)
    const requestBody = {
      records,
      criteria: { test: 'cache' },
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
        records: generateTestRecordData(2),
        criteria: {},
        context: {}
      })
    })
    
    const data = await assertSuccessfulResponse(response)
    
    // Check matches structure
    assertExists(data.data.matches)
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
    
    // Check match details
    data.data.matches.forEach(match => {
      assertExists(match.record1)
      assertExists(match.record2)
      assertExists(match.confidence)
      assertExists(match.reasoning)
      assertExists(match.evidence)
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
        records: generateTestRecordData(2),
        criteria: {},
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
  await t.step('Persists matching results', async () => {
    const records = generateTestRecordData(2)
    const response = await fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.access_token}`
      },
      body: JSON.stringify({
        records,
        criteria: {},
        context: {}
      })
    })
    
    const data = await assertSuccessfulResponse(response)
    
    // Check database
    const { data: results, error } = await testClient
      .from('record_matching_results')
      .select()
      .eq('user_id', testUser.id)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (error) throw error
    
    assertEquals(results.length, 1)
    assertEquals(results[0].matching_data.matches, data.data.matches)
  })
  
  // Edge case tests
  await t.step('Handles empty record set', async () => {
    const response = await fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.access_token}`
      },
      body: JSON.stringify({
        records: [],
        criteria: {},
        context: {}
      })
    })
    
    await assertErrorResponse(response, 400)
  })
  
  await t.step('Handles single record', async () => {
    const response = await fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.access_token}`
      },
      body: JSON.stringify({
        records: generateTestRecordData(1),
        criteria: {},
        context: {}
      })
    })
    
    const data = await assertSuccessfulResponse(response)
    assertEquals(data.data.matches.length, 0)
  })
  
  await t.step('Handles large record set', async () => {
    const response = await fetch(`${testClient.supabaseUrl}/functions/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUser.access_token}`
      },
      body: JSON.stringify({
        records: generateTestRecordData(20),
        criteria: {
          matchThreshold: 0.8,
          maxMatches: 10
        },
        context: {}
      })
    })
    
    const data = await assertSuccessfulResponse(response)
    assertEquals(data.data.matches.length <= 10, true)
  })
}) 