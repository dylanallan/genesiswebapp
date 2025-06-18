import { assertEquals } from 'std/testing/asserts.ts'
import { testClient, validateEnvironment } from './setup.ts'

// Import test suites
import './dna-analysis-processor.test.ts'
import './record-matching-processor.test.ts'
import './relationship-inference-processor.test.ts'
import './document-analysis-processor.test.ts'

// Test runner configuration
const config = {
  parallel: true,
  failFast: false,
  timeout: 300000, // 5 minutes
  sanitizeOps: true,
  sanitizeResources: true
}

// Main test runner
async function runTests() {
  console.log('Starting test suite...')
  
  try {
    // Validate environment
    validateEnvironment()
    
    // Run tests
    const startTime = Date.now()
    
    const results = await Promise.all([
      runTestSuite('DNA Analysis Processor'),
      runTestSuite('Record Matching Processor'),
      runTestSuite('Relationship Inference Processor'),
      runTestSuite('Document Analysis Processor')
    ])
    
    const endTime = Date.now()
    const duration = (endTime - startTime) / 1000
    
    // Process results
    const totalTests = results.reduce((sum, r) => sum + r.total, 0)
    const passedTests = results.reduce((sum, r) => sum + r.passed, 0)
    const failedTests = results.reduce((sum, r) => sum + r.failed, 0)
    const skippedTests = results.reduce((sum, r) => sum + r.skipped, 0)
    
    // Print summary
    console.log('\nTest Summary:')
    console.log('-------------')
    console.log(`Duration: ${duration.toFixed(2)}s`)
    console.log(`Total Tests: ${totalTests}`)
    console.log(`Passed: ${passedTests}`)
    console.log(`Failed: ${failedTests}`)
    console.log(`Skipped: ${skippedTests}`)
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`)
    
    // Print detailed results
    console.log('\nDetailed Results:')
    console.log('-----------------')
    results.forEach(result => {
      console.log(`\n${result.name}:`)
      console.log(`  Total: ${result.total}`)
      console.log(`  Passed: ${result.passed}`)
      console.log(`  Failed: ${result.failed}`)
      console.log(`  Skipped: ${result.skipped}`)
      
      if (result.failed > 0) {
        console.log('\n  Failed Tests:')
        result.failures.forEach(failure => {
          console.log(`    - ${failure.name}: ${failure.error}`)
        })
      }
    })
    
    // Exit with appropriate code
    if (failedTests > 0) {
      Deno.exit(1)
    }
    
  } catch (error) {
    console.error('Test runner error:', error)
    Deno.exit(1)
  }
}

// Helper function to run a test suite
async function runTestSuite(name: string) {
  const result = {
    name,
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    failures: [] as { name: string; error: string }[]
  }
  
  try {
    const testModule = await import(`./${name.toLowerCase().replace(/\s+/g, '-')}.test.ts`)
    const testSuite = testModule.default || testModule
    
    for (const test of testSuite) {
      result.total++
      
      try {
        await test()
        result.passed++
      } catch (error) {
        result.failed++
        result.failures.push({
          name: test.name,
          error: error.message
        })
        
        if (config.failFast) {
          throw error
        }
      }
    }
  } catch (error) {
    console.error(`Error running ${name} test suite:`, error)
    result.failed++
  }
  
  return result
}

// Run tests if this file is executed directly
if (import.meta.main) {
  runTests()
}

// Export for programmatic usage
export { runTests, runTestSuite } 