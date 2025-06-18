import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Debugging API Keys...\n');

// Check if keys exist
console.log('1. Checking if API keys are loaded:');
console.log('OpenAI Key exists:', !!process.env.VITE_OPENAI_API_KEY);
console.log('OpenAI Key starts with:', process.env.VITE_OPENAI_API_KEY?.substring(0, 10) + '...');
console.log('Anthropic Key exists:', !!process.env.VITE_ANTHROPIC_API_KEY);
console.log('Anthropic Key starts with:', process.env.VITE_ANTHROPIC_API_KEY?.substring(0, 10) + '...');
console.log('Google Key exists:', !!process.env.VITE_GEMINI_API_KEY);
console.log('Google Key starts with:', process.env.VITE_GEMINI_API_KEY?.substring(0, 10) + '...\n');

// Test OpenAI with detailed error
async function testOpenAI() {
  console.log('2. Testing OpenAI API with detailed error:');
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ],
        max_tokens: 10
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenAI: Working!');
    } else {
      const errorText = await response.text();
      console.log('❌ OpenAI Error:', response.status, response.statusText);
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.log('❌ OpenAI Network Error:', error.message);
  }
}

// Test Anthropic with detailed error
async function testAnthropic() {
  console.log('\n3. Testing Anthropic API with detailed error:');
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VITE_ANTHROPIC_API_KEY}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Anthropic: Working!');
    } else {
      const errorText = await response.text();
      console.log('❌ Anthropic Error:', response.status, response.statusText);
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.log('❌ Anthropic Network Error:', error.message);
  }
}

// Test Google with detailed error
async function testGoogle() {
  console.log('\n4. Testing Google (Gemini) API with detailed error:');
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.VITE_GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: 'Hello'
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0.7
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Google AI: Working!');
    } else {
      const errorText = await response.text();
      console.log('❌ Google AI Error:', response.status, response.statusText);
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.log('❌ Google AI Network Error:', error.message);
  }
}

// Run all tests
async function runTests() {
  await testOpenAI();
  await testAnthropic();
  await testGoogle();
  
  console.log('\n🔧 Troubleshooting Tips:');
  console.log('• Check if your API keys are valid and not expired');
  console.log('• Verify you have credits/billing set up for each service');
  console.log('• Make sure your accounts are active and not suspended');
  console.log('• For OpenAI: Check if you need to add billing information');
  console.log('• For Anthropic: Verify your account is approved');
  console.log('• For Google: Make sure the API is enabled in Google Cloud Console');
}

runTests(); 