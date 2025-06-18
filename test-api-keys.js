import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 API Key Diagnostic Tool\n');

// Check environment variables
const keys = {
  openai: process.env.VITE_OPENAI_API_KEY,
  anthropic: process.env.VITE_ANTHROPIC_API_KEY,
  gemini: process.env.VITE_GEMINI_API_KEY
};

console.log('📋 Environment Check:');
Object.entries(keys).forEach(([service, key]) => {
  const exists = !!key;
  const length = key?.length || 0;
  const preview = key ? `${key.substring(0, 8)}...` : 'NOT SET';
  console.log(`${service.toUpperCase()}: ${exists ? '✅' : '❌'} ${preview} (${length} chars)`);
});

console.log('\n🧪 Testing API Services...\n');

// Test OpenAI
async function testOpenAI() {
  console.log('🤖 Testing OpenAI...');
  if (!keys.openai) {
    console.log('❌ No OpenAI key found');
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keys.openai}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5
      })
    });

    if (response.ok) {
      console.log('✅ OpenAI: Working');
    } else {
      const error = await response.text();
      console.log(`❌ OpenAI Error (${response.status}): ${response.statusText}`);
      if (error.includes('invalid_api_key')) {
        console.log('   → Invalid API key');
      } else if (error.includes('billing')) {
        console.log('   → Billing issue - add payment method');
      } else if (error.includes('quota')) {
        console.log('   → Quota exceeded');
      } else {
        console.log(`   → ${error.substring(0, 100)}...`);
      }
    }
  } catch (error) {
    console.log(`❌ OpenAI Network Error: ${error.message}`);
  }
}

// Test Anthropic
async function testAnthropic() {
  console.log('\n🧠 Testing Anthropic...');
  if (!keys.anthropic) {
    console.log('❌ No Anthropic key found');
    return;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keys.anthropic}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Hi' }]
      })
    });

    if (response.ok) {
      console.log('✅ Anthropic: Working');
    } else {
      const error = await response.text();
      console.log(`❌ Anthropic Error (${response.status}): ${response.statusText}`);
      if (error.includes('invalid_api_key')) {
        console.log('   → Invalid API key');
      } else if (error.includes('authentication')) {
        console.log('   → Authentication failed');
      } else if (error.includes('quota')) {
        console.log('   → Quota exceeded');
      } else {
        console.log(`   → ${error.substring(0, 100)}...`);
      }
    }
  } catch (error) {
    console.log(`❌ Anthropic Network Error: ${error.message}`);
  }
}

// Test Google Gemini
async function testGemini() {
  console.log('\n🔍 Testing Google Gemini...');
  if (!keys.gemini) {
    console.log('❌ No Gemini key found');
    return;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${keys.gemini}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Hi' }]
        }],
        generationConfig: {
          maxOutputTokens: 5,
          temperature: 0.7
        }
      })
    });

    if (response.ok) {
      console.log('✅ Google Gemini: Working');
    } else {
      const error = await response.text();
      console.log(`❌ Google Gemini Error (${response.status}): ${response.statusText}`);
      if (error.includes('API_KEY_INVALID')) {
        console.log('   → Invalid API key');
      } else if (error.includes('API_KEY_NOT_FOUND')) {
        console.log('   → API key not found');
      } else if (error.includes('quota')) {
        console.log('   → Quota exceeded');
      } else {
        console.log(`   → ${error.substring(0, 100)}...`);
      }
    }
  } catch (error) {
    console.log(`❌ Google Gemini Network Error: ${error.message}`);
  }
}

// Run all tests
async function runTests() {
  await testOpenAI();
  await testAnthropic();
  await testGemini();
  
  console.log('\n📝 Summary:');
  console.log('• Check your .env file for correct API keys');
  console.log('• Visit each service dashboard to verify key status');
  console.log('• Ensure billing is set up for paid services');
  console.log('• Check if you have remaining quota/credits');
}

runTests(); 