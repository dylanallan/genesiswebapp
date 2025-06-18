import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Checking Database Functions...');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkFunctions() {
  try {
    console.log('\n1. Testing process_chat_message function...');
    
    // Test with a business-related message
    const { data, error } = await supabase.rpc('process_chat_message', {
      user_uuid: '00000000-0000-0000-0000-000000000000',
      message: 'Help me automate my business processes',
      context: {}
    });
    
    if (error) {
      console.error('❌ Function error:', error);
    } else {
      console.log('✅ Function response:');
      console.log('Use case:', data.use_case);
      console.log('Model:', data.recommended_model);
      console.log('Response preview:', data.response.substring(0, 200) + '...');
      
      // Check if it's the enhanced response
      if (data.response.includes('🚀 **Business Automation')) {
        console.log('🎯 ENHANCED FUNCTION IS WORKING!');
      } else if (data.response.includes('Hello! Welcome to Genesis Heritage')) {
        console.log('⚠️  OLD SIMPLE FUNCTION IS STILL ACTIVE');
      } else {
        console.log('❓ UNKNOWN FUNCTION VERSION');
      }
    }

    console.log('\n2. Testing different message types...');
    
    const testMessages = [
      'Help me automate my business',
      'I need DNA analysis help',
      'Can you help me code?'
    ];
    
    for (const message of testMessages) {
      const { data: response, error: msgError } = await supabase.rpc('process_chat_message', {
        user_uuid: '00000000-0000-0000-0000-000000000000',
        message: message,
        context: {}
      });
      
      if (msgError) {
        console.error(`❌ Error with "${message}":`, msgError);
      } else {
        console.log(`✅ "${message}" -> Use case: ${response.use_case}, Model: ${response.recommended_model}`);
      }
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkFunctions(); 