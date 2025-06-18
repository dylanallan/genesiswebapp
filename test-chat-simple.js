import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

console.log('🧪 Simple Chat API Test\n');

// Test environment variables
console.log('🔍 Checking environment variables...');
console.log('OpenAI Key:', process.env.VITE_OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
console.log('Gemini Key:', process.env.VITE_GEMINI_API_KEY ? '✅ Set' : '❌ Missing');
console.log('Supabase URL:', process.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing');
console.log('Supabase Key:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');

// Test direct API calls
async function testAPIs() {
  console.log('\n🔍 Testing Direct API Calls...\n');

  // Test OpenAI
  if (process.env.VITE_OPENAI_API_KEY) {
    console.log('🤖 Testing OpenAI...');
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Say "Hello from OpenAI test" and nothing else' }],
          max_tokens: 50,
          temperature: 0.7
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ OpenAI Response:', data.choices[0].message.content);
      } else {
        console.log('❌ OpenAI failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('❌ OpenAI error:', error.message);
    }
  }

  // Test Gemini
  if (process.env.VITE_GEMINI_API_KEY) {
    console.log('\n🔍 Testing Gemini...');
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.VITE_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Say "Hello from Gemini test" and nothing else' }]
          }],
          generationConfig: {
            maxOutputTokens: 50,
            temperature: 0.7
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Gemini Response:', data.candidates[0].content.parts[0].text);
      } else {
        console.log('❌ Gemini failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('❌ Gemini error:', error.message);
    }
  }
}

// Test Supabase connection
async function testSupabase() {
  console.log('\n🔍 Testing Supabase Connection...');
  
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Supabase configuration missing');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test basic connection
    const { data, error } = await supabase.from('ai_conversation_history').select('count').limit(1);
    
    if (error) {
      console.log('❌ Supabase error:', error.message);
    } else {
      console.log('✅ Supabase connection working');
    }
  } catch (error) {
    console.log('❌ Supabase connection failed:', error.message);
  }
}

// Run all tests
async function runTests() {
  await testAPIs();
  await testSupabase();
  
  console.log('\n📊 Test Summary:');
  console.log('• Check if API keys are working');
  console.log('• Check if Supabase is connected');
  console.log('• If APIs work but chat doesn\'t, the issue is in the frontend');
}

runTests(); 