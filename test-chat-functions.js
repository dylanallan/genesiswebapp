import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Chat Functions...');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testChatFunctions() {
  try {
    console.log('\n1. Testing if chat functions exist...');
    
    // Test if process_chat_message function exists
    const { data: chatData, error: chatError } = await supabase.rpc('process_chat_message', {
      user_uuid: '00000000-0000-0000-0000-000000000000', // Test UUID
      message: 'Hello',
      context: {}
    });
    
    if (chatError) {
      console.error('❌ process_chat_message function error:', chatError);
    } else {
      console.log('✅ process_chat_message function accessible');
      console.log('Response:', chatData);
    }

    // Test if get_chat_history function exists
    const { data: historyData, error: historyError } = await supabase.rpc('get_chat_history', {
      user_uuid: '00000000-0000-0000-0000-000000000000',
      conversation_id: null
    });
    
    if (historyError) {
      console.error('❌ get_chat_history function error:', historyError);
    } else {
      console.log('✅ get_chat_history function accessible');
    }

    // Test if get_conversation_list function exists
    const { data: listData, error: listError } = await supabase.rpc('get_conversation_list', {
      user_uuid: '00000000-0000-0000-0000-000000000000'
    });
    
    if (listError) {
      console.error('❌ get_conversation_list function error:', listError);
    } else {
      console.log('✅ get_conversation_list function accessible');
    }

    console.log('\n2. Testing frontend chat API...');
    
    // Test the frontend chat API
    const { chatApi } = await import('./src/api/chat.ts');
    
    try {
      // This will fail without authentication, but we can see if the import works
      console.log('✅ Frontend chat API imports successfully');
    } catch (error) {
      console.error('❌ Frontend chat API import error:', error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testChatFunctions(); 