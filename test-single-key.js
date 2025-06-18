import dotenv from 'dotenv';

dotenv.config();

const testKey = 'AIzaSyB90pAbcSbOxGMJM1feRKJCihtevglM_v0';

console.log('🔍 Testing Google API Key...\n');

async function listModels() {
  console.log('📋 Checking available models...');
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${testKey}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Available models:');
      data.models.forEach(model => {
        console.log(`- ${model.name}: ${model.description || 'No description'}`);
      });
      return data.models;
    } else {
      const error = await response.text();
      console.log(`❌ Error listing models: ${error}`);
      return [];
    }
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
    return [];
  }
}

async function testGoogleKey() {
  console.log('Testing key:', testKey.substring(0, 10) + '...');
  
  // First list available models
  const models = await listModels();
  
  // Find a suitable model for text generation
  const textModel = models.find(m => 
    m.name.includes('gemini') && 
    m.supportedGenerationMethods?.includes('generateContent')
  );
  
  if (!textModel) {
    console.log('❌ No suitable text generation model found');
    return;
  }
  
  console.log(`\n🧪 Testing with model: ${textModel.name}`);
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${textModel.name}:generateContent?key=${testKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Hello, can you respond with just "Working!"' }]
        }],
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0.7
        }
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Google API Key: WORKING!');
      console.log('Response:', data.candidates[0].content.parts[0].text);
      
      // Update .env file
      console.log('\n📝 Updating .env file...');
      const envContent = `VITE_OPENAI_API_KEY=${process.env.VITE_OPENAI_API_KEY || 'your_openai_key_here'}
VITE_ANTHROPIC_API_KEY=${process.env.VITE_ANTHROPIC_API_KEY || 'your_anthropic_key_here'}
VITE_GEMINI_API_KEY=${testKey}
VITE_SUPABASE_URL=${process.env.VITE_SUPABASE_URL || 'your_supabase_url'}
VITE_SUPABASE_ANON_KEY=${process.env.VITE_SUPABASE_ANON_KEY || 'your_supabase_anon_key'}`;
      
      const fs = await import('fs');
      fs.writeFileSync('.env', envContent);
      console.log('✅ .env file updated with working Google API key');
      
    } else {
      const error = await response.text();
      console.log(`❌ Google API Error (${response.status}): ${response.statusText}`);
      console.log('Error details:', error);
    }
  } catch (error) {
    console.log(`❌ Network Error: ${error.message}`);
  }
}

testGoogleKey(); 