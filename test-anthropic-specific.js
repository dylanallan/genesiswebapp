import dotenv from 'dotenv';

dotenv.config();

// Replace with your real Anthropic API key in your .env file, not in source code!
const anthropicKey = 'ANTHROPIC_API_KEY_HERE';

console.log('🧠 Testing Anthropic API Key...\n');
console.log('Key starts with:', anthropicKey.substring(0, 20) + '...');
console.log('Key length:', anthropicKey.length);

async function testAnthropic() {
  try {
    console.log('🔍 Making API request...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anthropicKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "Hello"' }]
      })
    });

    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Anthropic Response:', data.content[0].text);
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Anthropic Error Response:', errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
    return false;
  }
}

testAnthropic(); 