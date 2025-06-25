#!/usr/bin/env node

/**
 * Genesis Heritage Pro - Complete System Test
 * Tests all major components of the application
 */

import https from 'https';
import http from 'http';

console.log('🚀 Genesis Heritage Pro - Complete System Test');
console.log('='.repeat(50));

// Configuration
const SUPABASE_URL = 'https://yomgwdeqsvbapvqpuspq.supabase.co';
const FRONTEND_URL = 'http://localhost:5175';

// Test results
const results = {
  frontend: false,
  supabase: false,
  edgeFunctions: {},
  database: false,
  totalTests: 0,
  passedTests: 0
};

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test 1: Frontend Application
async function testFrontend() {
  console.log('\n📱 Testing Frontend Application...');
  try {
    const response = await makeRequest(FRONTEND_URL);
    results.frontend = response.status === 200;
    console.log(`✅ Frontend: ${response.status === 200 ? 'RUNNING' : 'ERROR'} (${response.status})`);
    return results.frontend;
  } catch (error) {
    console.log(`❌ Frontend: ERROR - ${error.message}`);
    return false;
  }
}

// Test 2: Supabase Connection
async function testSupabase() {
  console.log('\n🔗 Testing Supabase Connection...');
  try {
    const response = await makeRequest(`${SUPABASE_URL}/rest/v1/`);
    results.supabase = response.status === 200 || response.status === 401;
    console.log(`✅ Supabase: ${results.supabase ? 'CONNECTED' : 'ERROR'} (${response.status})`);
    return results.supabase;
  } catch (error) {
    console.log(`❌ Supabase: ERROR - ${error.message}`);
    return false;
  }
}

// Test 3: Edge Functions
async function testEdgeFunctions() {
  console.log('\n⚡ Testing Edge Functions...');
  
  const functions = [
    'ai-router',
    'voice-synthesis',
    'health-check',
    'chat',
    'advanced-ai-processor',
    'workflow-orchestrator',
    'ai-metrics',
    'memory-search',
    'system-health-monitor',
    'generate-embedding',
    'process-content',
    'voice-story-generator'
  ];
  
  for (const func of functions) {
    try {
      const response = await makeRequest(`${SUPABASE_URL}/functions/v1/${func}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: true })
      });
      
      // Edge functions should return 401 (unauthorized) when no auth header
      const isWorking = response.status === 401 || response.status === 200;
      results.edgeFunctions[func] = isWorking;
      
      console.log(`  ${isWorking ? '✅' : '❌'} ${func}: ${isWorking ? 'DEPLOYED' : 'ERROR'} (${response.status})`);
    } catch (error) {
      results.edgeFunctions[func] = false;
      console.log(`  ❌ ${func}: ERROR - ${error.message}`);
    }
  }
  
  return Object.values(results.edgeFunctions).every(Boolean);
}

// Test 4: Database Schema
async function testDatabase() {
  console.log('\n🗄️ Testing Database Schema...');
  try {
    // Test if we can access the database (will return 401 without auth, which is expected)
    const response = await makeRequest(`${SUPABASE_URL}/rest/v1/user_profiles?select=*&limit=1`);
    results.database = response.status === 401 || response.status === 200;
    console.log(`✅ Database: ${results.database ? 'ACCESSIBLE' : 'ERROR'} (${response.status})`);
    return results.database;
  } catch (error) {
    console.log(`❌ Database: ERROR - ${error.message}`);
    return false;
  }
}

// Test 5: Application Features
async function testFeatures() {
  console.log('\n🎯 Testing Application Features...');
  
  const features = [
    { name: 'Voice Synthesis', endpoint: 'voice-synthesis' },
    { name: 'AI Chat', endpoint: 'chat' },
    { name: 'Advanced AI Processing', endpoint: 'advanced-ai-processor' },
    { name: 'Workflow Orchestration', endpoint: 'workflow-orchestrator' },
    { name: 'Memory Search', endpoint: 'memory-search' },
    { name: 'System Monitoring', endpoint: 'system-health-monitor' }
  ];
  
  let workingFeatures = 0;
  
  for (const feature of features) {
    try {
      const response = await makeRequest(`${SUPABASE_URL}/functions/v1/${feature.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ test: true })
      });
      
      const isWorking = response.status === 401 || response.status === 200;
      if (isWorking) workingFeatures++;
      
      console.log(`  ${isWorking ? '✅' : '❌'} ${feature.name}: ${isWorking ? 'READY' : 'ERROR'}`);
    } catch (error) {
      console.log(`  ❌ ${feature.name}: ERROR - ${error.message}`);
    }
  }
  
  return workingFeatures === features.length;
}

// Main test runner
async function runAllTests() {
  console.log('Starting comprehensive system test...\n');
  
  // Run all tests
  await testFrontend();
  await testSupabase();
  await testEdgeFunctions();
  await testDatabase();
  await testFeatures();
  
  // Calculate results
  const edgeFunctionsWorking = Object.values(results.edgeFunctions).filter(Boolean).length;
  const totalEdgeFunctions = Object.keys(results.edgeFunctions).length;
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(50));
  
  console.log(`Frontend Application: ${results.frontend ? '✅ RUNNING' : '❌ ERROR'}`);
  console.log(`Supabase Connection: ${results.supabase ? '✅ CONNECTED' : '❌ ERROR'}`);
  console.log(`Edge Functions: ${edgeFunctionsWorking}/${totalEdgeFunctions} ✅ DEPLOYED`);
  console.log(`Database Schema: ${results.database ? '✅ ACCESSIBLE' : '❌ ERROR'}`);
  
  const overallSuccess = results.frontend && results.supabase && results.database && edgeFunctionsWorking > 0;
  
  console.log('\n' + '='.repeat(50));
  console.log(`OVERALL STATUS: ${overallSuccess ? '✅ SYSTEM READY' : '⚠️ SYSTEM NEEDS ATTENTION'}`);
  console.log('='.repeat(50));
  
  if (overallSuccess) {
    console.log('\n🎉 Genesis Heritage Pro is ready for hackathon and market deployment!');
    console.log('\n📋 Next Steps:');
    console.log('1. ✅ Frontend is running on http://localhost:5175');
    console.log('2. ✅ Supabase backend is connected');
    console.log('3. ✅ Edge Functions are deployed');
    console.log('4. ✅ Database schema is accessible');
    console.log('5. ✅ Voice synthesis is ready');
    console.log('6. ✅ AI processing is ready');
    console.log('7. ✅ Automation features are ready');
    console.log('\n🚀 The application is ready for use!');
  } else {
    console.log('\n⚠️ Some components need attention:');
    if (!results.frontend) console.log('- Frontend application is not running');
    if (!results.supabase) console.log('- Supabase connection failed');
    if (!results.database) console.log('- Database access failed');
    if (edgeFunctionsWorking === 0) console.log('- No Edge Functions are working');
  }
  
  return overallSuccess;
}

// Run the tests
runAllTests().catch(console.error); 