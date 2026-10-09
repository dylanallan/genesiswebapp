# Edge Functions Test Suite

This directory contains the test suite for the Edge Functions implementation. The test suite is designed to ensure the reliability, security, and performance of our Edge Functions.

## Test Structure

The test suite is organized as follows:

- `setup.ts`: Common test utilities and setup functions
- `run_tests.ts`: Test runner that executes all test suites
- `run.sh`: Shell script to run tests in a Deno environment
- `*.test.ts`: Individual test suites for each Edge Function

### Test Suites

1. **DNA Analysis Processor** (`dna-analysis-processor.test.ts`)
   - Basic functionality tests
   - Error handling
   - Security tests
   - Performance tests
   - Rate limiting
   - Caching
   - Model consensus
   - Error recovery
   - Data persistence

2. **Record Matching Processor** (`record-matching-processor.test.ts`)
   - Basic functionality tests
   - Error handling
   - Security tests
   - Performance tests
   - Rate limiting
   - Caching
   - Model consensus
   - Error recovery
   - Data persistence
   - Edge cases

3. **Relationship Inference Processor** (`relationship-inference-processor.test.ts`)
   - Basic functionality tests
   - Error handling
   - Security tests
   - Performance tests
   - Rate limiting
   - Caching
   - Model consensus
   - Error recovery
   - Data persistence
   - Edge cases
   - Complex relationships

4. **Document Analysis Processor** (`document-analysis-processor.test.ts`)
   - Basic functionality tests
   - Error handling
   - Security tests
   - Performance tests
   - Rate limiting
   - Caching
   - Model consensus
   - Error recovery
   - Data persistence
   - Edge cases
   - OCR tests
   - Entity extraction
   - Language detection
   - Sentiment analysis

## Running Tests

### Prerequisites

1. Install Deno from https://deno.land
2. Set up required environment variables:
   ```bash
   export SUPABASE_URL="your-supabase-url"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   export ANTHROPIC_API_KEY="your-anthropic-api-key"
   export OPENAI_API_KEY="your-openai-api-key"
   export GOOGLE_AI_API_KEY="your-google-ai-api-key"
   ```

### Running the Test Suite

To run all tests:

```bash
./run.sh
```

This will:
1. Check for required dependencies
2. Validate environment variables
3. Run all test suites
4. Generate a detailed test report

### Test Output

The test runner provides:
- Overall test summary
- Duration of test execution
- Number of passed/failed/skipped tests
- Success rate
- Detailed results for each test suite
- Error messages for failed tests

## Adding New Tests

To add a new test:

1. Create a new test file `your-function.test.ts`
2. Import required utilities from `setup.ts`
3. Define your test suite
4. Add the test file to `run_tests.ts`

Example test structure:

```typescript
import { assertEquals } from 'std/testing/asserts.ts'
import { testClient, generateTestData } from './setup.ts'

const testSuite = [
  async function testBasicFunctionality() {
    // Test implementation
  },
  async function testErrorHandling() {
    // Test implementation
  }
  // Add more tests...
]

export default testSuite
```

## Test Utilities

The `setup.ts` file provides various utilities:

- `testClient`: Supabase client for test database operations
- `generateTestData`: Functions to generate test data
- `validateEnvironment`: Environment variable validation
- `mockResponse`: Mock API responses
- `assertResponse`: Response validation
- `securityTest`: Security testing utilities
- `performanceTest`: Performance testing utilities
- `healthCheck`: Health check utilities

## Best Practices

1. **Isolation**: Each test should be independent and not rely on the state from other tests
2. **Cleanup**: Always clean up test data after tests
3. **Mocking**: Use mocks for external services
4. **Error Cases**: Test both success and error scenarios
5. **Security**: Include security tests for all endpoints
6. **Performance**: Test performance under various conditions
7. **Documentation**: Document complex test scenarios

## Troubleshooting

Common issues and solutions:

1. **Deno not found**
   - Install Deno from https://deno.land
   - Ensure Deno is in your PATH

2. **Missing environment variables**
   - Check that all required variables are set
   - Verify variable names and values

3. **Test failures**
   - Check the detailed error messages
   - Verify test data and mocks
   - Ensure database is accessible
   - Check API key validity

4. **Performance issues**
   - Check network connectivity
   - Verify rate limits
   - Monitor resource usage

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Include comprehensive test cases
3. Add appropriate documentation
4. Update this README if necessary
5. Ensure all tests pass before submitting 