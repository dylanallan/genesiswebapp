import { createClient } from '@supabase/supabase-js'
import { assertEquals, assertExists } from 'std/testing/asserts.ts'
import { mock, spy } from 'std/testing/mock.ts'
import { delay } from 'std/async/delay.ts'

// Test environment setup
export const TEST_ENV = {
  SUPABASE_URL: Deno.env.get('SUPABASE_URL') ?? 'http://localhost:54321',
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? 'test-key',
  ANTHROPIC_API_KEY: Deno.env.get('ANTHROPIC_API_KEY') ?? 'test-key',
  OPENAI_API_KEY: Deno.env.get('OPENAI_API_KEY') ?? 'test-key',
  GOOGLE_AI_API_KEY: Deno.env.get('GOOGLE_AI_API_KEY') ?? 'test-key'
}

// Initialize test client
export const testClient = createClient(
  TEST_ENV.SUPABASE_URL,
  TEST_ENV.SUPABASE_SERVICE_ROLE_KEY
)

// Test utilities
export async function createTestUser() {
  const { data: user, error } = await testClient.auth.admin.createUser({
    email: `test-${Date.now()}@example.com`,
    password: 'test-password',
    email_confirm: true
  })
  
  if (error) throw error
  return user
}

export async function deleteTestUser(userId: string) {
  const { error } = await testClient.auth.admin.deleteUser(userId)
  if (error) throw error
}

export async function cleanupTestData(table: string, userId: string) {
  const { error } = await testClient
    .from(table)
    .delete()
    .eq('user_id', userId)
  
  if (error) throw error
}

// Mock utilities
export function mockLLMResponse(response: string) {
  return {
    content: [{ text: response }],
    choices: [{ message: { content: response } }],
    text: () => response
  }
}

export function mockRateLimiter() {
  return {
    waitForSlot: spy(() => Promise.resolve()),
    reset: spy(() => {})
  }
}

export function mockCache<T>() {
  const cache = new Map<string, T>()
  return {
    get: spy((key: string) => cache.get(key)),
    set: spy((key: string, value: T) => cache.set(key, value)),
    clear: spy(() => cache.clear())
  }
}

// Test data generators
export function generateTestDNAData() {
  return {
    markers: [
      { name: 'RS123', value: 'AG' },
      { name: 'RS456', value: 'CT' }
    ],
    haplogroups: ['R1b', 'H1'],
    ethnicity: ['European', 'British']
  }
}

export function generateTestRecord() {
  return {
    id: `record-${Date.now()}`,
    type: 'birth',
    title: 'Birth Certificate',
    date: '1900-01-01',
    location: 'London, UK',
    content: {
      name: 'John Smith',
      parents: ['James Smith', 'Mary Smith'],
      witnesses: ['Robert Brown', 'Sarah Jones']
    }
  }
}

export function generateTestRelationshipData() {
  return {
    individuals: [
      {
        id: 'person-1',
        name: 'John Smith',
        birthDate: '1900-01-01',
        birthPlace: 'London, UK'
      },
      {
        id: 'person-2',
        name: 'James Smith',
        birthDate: '1870-01-01',
        birthPlace: 'Manchester, UK'
      }
    ],
    metadata: {
      source: 'test',
      timestamp: new Date().toISOString(),
      version: '1.0'
    }
  }
}

export function generateTestDocument() {
  return {
    id: `doc-${Date.now()}`,
    type: 'certificate',
    title: 'Marriage Certificate',
    text: 'This is a test document content.',
    source: 'test',
    date: '1920-01-01',
    location: 'Birmingham, UK',
    metadata: {
      format: 'text',
      quality: 'high'
    }
  }
}

// Test assertions
export async function assertSuccessfulResponse(response: Response) {
  assertEquals(response.status, 200)
  const data = await response.json()
  assertExists(data.data)
  assertEquals(data.status, 'success')
  return data
}

export async function assertErrorResponse(response: Response, expectedStatus = 500) {
  assertEquals(response.status, expectedStatus)
  const data = await response.json()
  assertExists(data.error)
  assertEquals(data.status, 'error')
  return data
}

// Test helpers
export async function retryUntil(
  fn: () => Promise<boolean>,
  maxAttempts = 5,
  delayMs = 1000
): Promise<void> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (await fn()) return
    if (attempt < maxAttempts) await delay(delayMs)
  }
  throw new Error(`Condition not met after ${maxAttempts} attempts`)
}

export async function waitForDatabaseUpdate(
  table: string,
  userId: string,
  maxAttempts = 5,
  delayMs = 1000
) {
  return retryUntil(async () => {
    const { data, error } = await testClient
      .from(table)
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (error) throw error
    return data && data.length > 0
  }, maxAttempts, delayMs)
}

// Security testing utilities
export function generateMaliciousInput() {
  return {
    sqlInjection: "' OR '1'='1",
    xss: '<script>alert("xss")</script>',
    commandInjection: '; rm -rf /',
    pathTraversal: '../../../etc/passwd',
    largePayload: 'A'.repeat(1000000)
  }
}

export function validateSecurityHeaders(response: Response) {
  const headers = response.headers
  assertEquals(headers.get('content-security-policy'), "default-src 'none'")
  assertEquals(headers.get('x-content-type-options'), 'nosniff')
  assertEquals(headers.get('x-frame-options'), 'DENY')
  assertEquals(headers.get('x-xss-protection'), '1; mode=block')
}

// Performance testing utilities
export async function measureExecutionTime(fn: () => Promise<any>) {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()
  return {
    result,
    executionTime: end - start
  }
}

export async function loadTest(
  fn: () => Promise<any>,
  concurrency: number,
  iterations: number
) {
  const results = []
  const start = performance.now()
  
  for (let i = 0; i < iterations; i += concurrency) {
    const batch = Array(Math.min(concurrency, iterations - i))
      .fill(null)
      .map(() => fn())
    results.push(...await Promise.all(batch))
  }
  
  const end = performance.now()
  return {
    results,
    totalTime: end - start,
    averageTime: (end - start) / iterations,
    throughput: iterations / ((end - start) / 1000)
  }
}

// Health check utilities
export async function checkFunctionHealth(endpoint: string) {
  const response = await fetch(`${TEST_ENV.SUPABASE_URL}/functions/v1/${endpoint}/health`)
  const data = await response.json()
  return {
    status: response.status,
    data,
    healthy: response.status === 200 && data.status === 'healthy'
  }
}

export async function monitorFunctionHealth(
  endpoint: string,
  intervalMs = 60000,
  maxFailures = 3
) {
  let failures = 0
  const startTime = Date.now()
  
  while (true) {
    const { healthy } = await checkFunctionHealth(endpoint)
    
    if (!healthy) {
      failures++
      if (failures >= maxFailures) {
        throw new Error(`Function ${endpoint} unhealthy after ${failures} failures`)
      }
    } else {
      failures = 0
    }
    
    await delay(intervalMs)
  }
}

// Export all utilities
export default {
  TEST_ENV,
  testClient,
  createTestUser,
  deleteTestUser,
  cleanupTestData,
  mockLLMResponse,
  mockRateLimiter,
  mockCache,
  generateTestDNAData,
  generateTestRecord,
  generateTestRelationshipData,
  generateTestDocument,
  assertSuccessfulResponse,
  assertErrorResponse,
  retryUntil,
  waitForDatabaseUpdate,
  generateMaliciousInput,
  validateSecurityHeaders,
  measureExecutionTime,
  loadTest,
  checkFunctionHealth,
  monitorFunctionHealth
} 