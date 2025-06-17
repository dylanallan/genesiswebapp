import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing AI Integration...\n');

// Test OpenAI
async function testOpenAI() {
  console.log('🤖 Testing OpenAI...');
  const apiKey = process.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey || apiKey === 'your_openai_key_here') {
    console.log('❌ OpenAI key not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say "OpenAI is working!"' }],
        max_tokens: 10
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenAI:', data.choices[0].message.content);
      return true;
    } else {
      console.log('❌ OpenAI failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ OpenAI error:', error.message);
    return false;
  }
}

// Test Anthropic
async function testAnthropic() {
  console.log('\n🧠 Testing Anthropic...');
  const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
  
  if (!apiKey || apiKey === 'your_anthropic_key_here') {
    console.log('❌ Anthropic key not configured');
    return false;
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "Anthropic is working!"' }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Anthropic:', data.content[0].text);
      return true;
    } else {
      console.log('❌ Anthropic failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Anthropic error:', error.message);
    return false;
  }
}

// Test Google Gemini
async function testGemini() {
  console.log('\n🔍 Testing Google Gemini...');
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_key_here') {
    console.log('❌ Gemini key not configured');
    return false;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Say "Gemini is working!"' }]
        }],
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0.7
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Gemini:', data.candidates[0].content.parts[0].text);
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

// Run all tests
async function runTests() {
  console.log('📋 Environment Check:');
  console.log('OpenAI Key:', process.env.VITE_OPENAI_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('Anthropic Key:', process.env.VITE_ANTHROPIC_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('Gemini Key:', process.env.VITE_GEMINI_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('');

  const results = await Promise.all([
    testOpenAI(),
    testAnthropic(),
    testGemini()
  ]);

  console.log('\n📊 Results:');
  console.log('OpenAI:', results[0] ? '✅ Working' : '❌ Failed');
  console.log('Anthropic:', results[1] ? '✅ Working' : '❌ Failed');
  console.log('Gemini:', results[2] ? '✅ Working' : '❌ Failed');

  const workingCount = results.filter(Boolean).length;
  console.log(`\n🎯 ${workingCount}/3 AI providers working`);

  if (workingCount > 0) {
    console.log('✅ Your AI integration is ready!');
  } else {
    console.log('❌ No AI providers working. Check your API keys.');
  }
}

runTests(); 