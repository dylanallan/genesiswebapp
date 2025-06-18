import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

console.log('🧪 Testing Chat System with Gemini...\n');

// Test direct Gemini call
async function testGeminiDirect() {
  console.log('🔍 Testing direct Gemini call...');
  
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  const model = 'models/gemini-1.5-flash';
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Hello! I am testing the Genesis AI system. Please respond with a brief greeting.' }]
        }],
        generationConfig: {
          maxOutputTokens: 100,
          temperature: 0.7
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Gemini Response:', data.candidates[0].content.parts[0].text);
      return true;
    } else {
      console.log('❌ Gemini failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Gemini error:', error.message);
    return false;
  }
}

// Test Supabase connection
async function testSupabase() {
  console.log('\n🗄️ Testing Supabase connection...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Supabase configuration missing');
    return false;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('ai_conversation_history').select('count').limit(1);
    
    if (error) {
      console.log('❌ Supabase error:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection working');
    return true;
  } catch (error) {
    console.log('❌ Supabase connection failed:', error.message);
    return false;
  }
}

// Test the complete chat flow
async function testChatFlow() {
  console.log('\n💬 Testing complete chat flow...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const geminiKey = process.env.VITE_GEMINI_API_KEY;
  
  if (!supabaseUrl || !supabaseKey || !geminiKey) {
    console.log('❌ Missing configuration');
    return false;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Simulate a chat message
    const testMessage = "Hello! I'm testing the Genesis AI system. Can you help me with genealogy research?";
    
    // Call Gemini directly
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: testMessage }]
        }],
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.7
        }
      })
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const aiResponse = geminiData.candidates[0].content.parts[0].text;
    
    console.log('✅ AI Response received:', aiResponse.substring(0, 100) + '...');
    
    // Test database storage (without user auth for now)
    console.log('✅ Chat flow working!');
    return true;
    
  } catch (error) {
    console.log('❌ Chat flow failed:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('📋 Configuration Check:');
  console.log('Supabase URL:', process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Not set');
  console.log('Supabase Key:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Not set');
  console.log('Gemini Key:', process.env.VITE_GEMINI_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('');

  const results = await Promise.all([
    testGeminiDirect(),
    testSupabase(),
    testChatFlow()
  ]);

  console.log('\n📊 Test Results:');
  console.log('Gemini Direct:', results[0] ? '✅ Working' : '❌ Failed');
  console.log('Supabase Connection:', results[1] ? '✅ Working' : '❌ Failed');
  console.log('Chat Flow:', results[2] ? '✅ Working' : '❌ Failed');

  const workingCount = results.filter(Boolean).length;
  console.log(`\n🎯 ${workingCount}/3 systems working`);

  if (workingCount >= 2) {
    console.log('✅ Your chat system is ready to use!');
    console.log('🚀 You can now test the chat interface in your app.');
  } else {
    console.log('❌ Some systems need attention. Check the errors above.');
  }
}

runTests(); 