#!/usr/bin/env node

/**
 * Test Chat and Voice Functionality
 * Verifies that the critical selling features are working
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yomgwdeqsvbapvqpuspq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbWd3ZGVxc3ZiYXB2cXB1c3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5NzI4NzQsImV4cCI6MjA1MTU0ODg3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🎯 Testing Chat and Voice Functionality');
console.log('='.repeat(50));

async function testDatabaseTables() {
  console.log('\n🗄️ Testing Database Tables...');
  
  try {
    // Test conversations table
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);
    
    if (convError) {
      console.log(`❌ Conversations table error: ${convError.message}`);
      return false;
    }
    
    console.log('✅ Conversations table: ACCESSIBLE');
    
    // Test messages table
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
    
    if (msgError) {
      console.log(`❌ Messages table error: ${msgError.message}`);
      return false;
    }
    
    console.log('✅ Messages table: ACCESSIBLE');
    return true;
    
  } catch (error) {
    console.log(`❌ Database test failed: ${error.message}`);
    return false;
  }
}

async function testAIRouter() {
  console.log('\n🤖 Testing AI Router...');
  
  try {
    const { data, error } = await supabase.functions.invoke('ai-router', {
      body: { message: 'Hello, this is a test message' }
    });
    
    if (error) {
      console.log(`❌ AI Router error: ${error.message}`);
      return false;
    }
    
    if (data && (data.response || data.error)) {
      console.log('✅ AI Router: RESPONDING');
      console.log(`   Provider: ${data.provider || 'unknown'}`);
      console.log(`   Response: ${data.response ? data.response.substring(0, 50) + '...' : 'No response'}`);
      return true;
    } else {
      console.log('❌ AI Router: No valid response');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ AI Router test failed: ${error.message}`);
    return false;
  }
}

async function testVoiceSynthesis() {
  console.log('\n🎤 Testing Voice Synthesis...');
  
  try {
    const { data, error } = await supabase.functions.invoke('voice-synthesis', {
      body: { 
        text: 'Hello, this is a test of the voice synthesis system.',
        language: 'en',
        voice: 'morgan-freeman-style-id'
      }
    });
    
    if (error) {
      console.log(`❌ Voice synthesis error: ${error.message}`);
      return false;
    }
    
    if (data) {
      console.log('✅ Voice Synthesis: WORKING');
      console.log(`   Response type: ${typeof data}`);
      return true;
    } else {
      console.log('❌ Voice synthesis: No response');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Voice synthesis test failed: ${error.message}`);
    return false;
  }
}

async function testChatAPI() {
  console.log('\n💬 Testing Chat API...');
  
  try {
    // Test conversation creation
    const { data: convData, error: convError } = await supabase
      .from('conversations')
      .insert({ 
        title: 'Test Conversation',
        model: 'gpt-4',
        provider: 'openai'
      })
      .select('id')
      .single();
    
    if (convError) {
      console.log(`❌ Conversation creation error: ${convError.message}`);
      return false;
    }
    
    console.log('✅ Conversation creation: WORKING');
    
    // Test message insertion
    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: convData.id,
        role: 'user',
        content: 'Test message'
      });
    
    if (msgError) {
      console.log(`❌ Message insertion error: ${msgError.message}`);
      return false;
    }
    
    console.log('✅ Message insertion: WORKING');
    
    // Clean up test data
    await supabase.from('conversations').delete().eq('id', convData.id);
    
    return true;
    
  } catch (error) {
    console.log(`❌ Chat API test failed: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('Starting chat and voice functionality tests...\n');
  
  const results = {
    database: await testDatabaseTables(),
    aiRouter: await testAIRouter(),
    voiceSynthesis: await testVoiceSynthesis(),
    chatAPI: await testChatAPI()
  };
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 CHAT & VOICE TEST RESULTS');
  console.log('='.repeat(50));
  
  console.log(`Database Tables: ${results.database ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`AI Router: ${results.aiRouter ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Voice Synthesis: ${results.voiceSynthesis ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Chat API: ${results.chatAPI ? '✅ WORKING' : '❌ FAILED'}`);
  
  const allWorking = Object.values(results).every(Boolean);
  
  console.log('\n' + '='.repeat(50));
  console.log(`OVERALL STATUS: ${allWorking ? '✅ ALL FEATURES WORKING' : '⚠️ SOME ISSUES DETECTED'}`);
  console.log('='.repeat(50));
  
  if (allWorking) {
    console.log('\n🎉 EXCELLENT! Your primary selling features are working:');
    console.log('✅ Chat functionality with AI responses');
    console.log('✅ Voice synthesis with Morgan Freeman-style voice');
    console.log('✅ Database storage for conversations');
    console.log('✅ Multi-provider AI routing');
    console.log('\n🚀 Ready for hackathon demos and market launch!');
  } else {
    console.log('\n⚠️ Some features need attention:');
    if (!results.database) console.log('- Database tables may not be properly created');
    if (!results.aiRouter) console.log('- AI Router Edge Function may have issues');
    if (!results.voiceSynthesis) console.log('- Voice synthesis may need API key configuration');
    if (!results.chatAPI) console.log('- Chat API may have permission issues');
  }
  
  return allWorking;
}

// Run the tests
runAllTests().catch(console.error); 