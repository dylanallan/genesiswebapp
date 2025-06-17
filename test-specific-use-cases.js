import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Specific Use Cases...');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSpecificUseCases() {
  try {
    const testCases = [
      { message: 'Help me automate my business', expected: 'business' },
      { message: 'I need help with DNA analysis', expected: 'genealogy' },
      { message: 'Can you help me code a function?', expected: 'coding' },
      { message: 'Analyze this data for me', expected: 'analysis' },
      { message: 'Write a creative story', expected: 'creative' },
      { message: 'Generate voice from text', expected: 'voice' },
      { message: 'Process this document', expected: 'document' }
    ];

    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: "${testCase.message}"`);
      
      const { data, error } = await supabase.rpc('process_chat_message', {
        user_uuid: '00000000-0000-0000-0000-000000000000',
        message: testCase.message,
        context: {}
      });
      
      if (error) {
        console.error(`❌ Error:`, error);
      } else {
        console.log(`✅ Use Case: ${data.use_case} (expected: ${testCase.expected})`);
        console.log(`🤖 Model: ${data.recommended_model}`);
        console.log(`📝 Response Preview: ${data.response.substring(0, 100)}...`);
        
        if (data.use_case === testCase.expected) {
          console.log(`🎯 Use case detection: CORRECT`);
        } else {
          console.log(`⚠️  Use case detection: INCORRECT (got ${data.use_case}, expected ${testCase.expected})`);
        }
      }
    }

    console.log('\n🎉 Use case testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSpecificUseCases(); 