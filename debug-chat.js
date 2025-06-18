import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

console.log('🔍 Debugging Chat API...\n');

// Test direct API calls
async function testDirectAPIs() {
  console.log('📋 Testing Direct API Calls...\n');

  // Test OpenAI
  console.log('🤖 Testing OpenAI...');
  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say something unique about genealogy research' }],
        max_tokens: 100,
        temperature: 0.7
      })
    });

    if (openaiResponse.ok) {
      const data = await openaiResponse.json();
      console.log('✅ OpenAI Response:', data.choices[0].message.content);
    } else {
      console.log('❌ OpenAI failed:', openaiResponse.status);
    }
  } catch (error) {
    console.log('❌ OpenAI error:', error.message);
  }

  // Test Gemini
  console.log('\n🔍 Testing Gemini...');
  try {
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.VITE_GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Say something unique about business automation' }]
        }],
        generationConfig: {
          maxOutputTokens: 100,
          temperature: 0.7
        }
      })
    });

    if (geminiResponse.ok) {
      const data = await geminiResponse.json();
      console.log('✅ Gemini Response:', data.candidates[0].content.parts[0].text);
    } else {
      console.log('❌ Gemini failed:', geminiResponse.status);
    }
  } catch (error) {
    console.log('❌ Gemini error:', error.message);
  }
}

// Test the chat API functions
async function testChatAPI() {
  console.log('\n💬 Testing Chat API Functions...\n');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Supabase configuration missing');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test the smart AI router logic
  console.log('🧠 Testing Smart AI Router...');
  
  const providers = [
    { name: 'openai', test: () => process.env.VITE_OPENAI_API_KEY, defaultModel: 'gpt-3.5-turbo' },
    { name: 'gemini', test: () => process.env.VITE_GEMINI_API_KEY, defaultModel: 'models/gemini-1.5-flash' }
  ];

  const testMessage = 'Tell me something interesting about cultural heritage preservation';

  for (const provider of providers) {
    if (provider.test()) {
      console.log(`\n🔍 Testing ${provider.name}...`);
      try {
        let response;
        
        if (provider.name === 'openai') {
          response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: provider.defaultModel,
              messages: [{ role: 'user', content: testMessage }],
              max_tokens: 150,
              temperature: 0.7
            })
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ ${provider.name} Response:`, data.choices[0].message.content);
          } else {
            console.log(`❌ ${provider.name} failed:`, response.status);
          }
        } else if (provider.name === 'gemini') {
          response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${provider.defaultModel}:generateContent?key=${process.env.VITE_GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{ text: testMessage }]
              }],
              generationConfig: {
                maxOutputTokens: 150,
                temperature: 0.7
              }
            })
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ ${provider.name} Response:`, data.candidates[0].content.parts[0].text);
          } else {
            console.log(`❌ ${provider.name} failed:`, response.status);
          }
        }
      } catch (error) {
        console.log(`❌ ${provider.name} error:`, error.message);
      }
    }
  }
}

// Run all tests
async function runDebug() {
  await testDirectAPIs();
  await testChatAPI();
  
  console.log('\n📊 Debug Summary:');
  console.log('• Check if the responses above are unique and varied');
  console.log('• If responses are the same, there might be a caching issue');
  console.log('• If responses are different, the issue might be in the frontend');
}

runDebug(); 