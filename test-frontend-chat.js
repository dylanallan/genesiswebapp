import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

console.log('🧪 Testing Frontend Chat API...\n');

// Simulate the frontend chat API call
async function testFrontendChatAPI() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Supabase configuration missing');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test the exact same logic as the frontend
  console.log('🔍 Testing Frontend Chat Logic...\n');

  const testMessage = 'Hello! Can you help me with genealogy research?';
  const conversationId = undefined; // New conversation
  const provider = 'auto'; // Auto-select
  const model = 'auto'; // Auto-select

  try {
    // Simulate the exact logic from chatApi.sendMessage
    console.log('📤 Sending message:', testMessage);
    console.log('🔧 Provider:', provider);
    console.log('🤖 Model:', model);

    // Get AI response using smart router (simulating the frontend logic)
    const providers = [
      { name: 'openai', test: () => process.env.VITE_OPENAI_API_KEY, defaultModel: 'gpt-3.5-turbo' },
      { name: 'gemini', test: () => process.env.VITE_GEMINI_API_KEY, defaultModel: 'models/gemini-1.5-flash' }
    ];

    let aiResult;
    
    // Try providers in order (this is the smart router logic)
    for (const provider of providers) {
      if (provider.test()) {
        try {
          console.log(`\n🔍 Trying ${provider.name}...`);
          
          if (provider.name === 'openai') {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: provider.defaultModel,
                messages: [{ role: 'user', content: testMessage }],
                max_tokens: 200,
                temperature: 0.7
              })
            });

            if (response.ok) {
              const data = await response.json();
              aiResult = {
                response: data.choices[0].message.content,
                provider: provider.name,
                model: provider.defaultModel
              };
              console.log(`✅ ${provider.name} succeeded!`);
              break;
            } else {
              console.log(`❌ ${provider.name} failed:`, response.status);
            }
          } else if (provider.name === 'gemini') {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${provider.defaultModel}:generateContent?key=${process.env.VITE_GEMINI_API_KEY}`, {
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

            if (response.ok) {
              const data = await response.json();
              aiResult = {
                response: data.candidates[0].content.parts[0].text,
                provider: provider.name,
                model: provider.defaultModel
              };
              console.log(`✅ ${provider.name} succeeded!`);
              break;
            } else {
              console.log(`❌ ${provider.name} failed:`, response.status);
            }
          }
        } catch (error) {
          console.log(`❌ ${provider.name} error:`, error.message);
          continue;
        }
      }
    }

    if (aiResult) {
      console.log('\n🎉 AI Response Generated:');
      console.log('📝 Response:', aiResult.response);
      console.log('🔧 Provider:', aiResult.provider);
      console.log('🤖 Model:', aiResult.model);
      
      // Simulate the response format the frontend expects
      const chatResponse = {
        response: aiResult.response,
        conversationId: conversationId || crypto.randomUUID(),
        provider: aiResult.provider,
        model: aiResult.model,
        timestamp: new Date().toISOString()
      };
      
      console.log('\n📤 Final Chat Response:');
      console.log(JSON.stringify(chatResponse, null, 2));
      
    } else {
      console.log('❌ No AI providers worked');
    }

  } catch (error) {
    console.error('❌ Chat API error:', error);
  }
}

// Run the test
testFrontendChatAPI(); 