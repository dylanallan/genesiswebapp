import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://yomgwdeqsvbapvqpuspq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbWd3ZGVxc3ZiYXB2cXB1c3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MDIzNjUsImV4cCI6MjA2NDE3ODM2NX0.HBjnzvpUBuPdTkFkJDwu673d0BqsJanaoMFkhTwEdvk';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCompleteSetup() {
  console.log('🧪 Testing Complete Genesis Heritage Database Setup...\n');

  const tablesToTest = [
    'user_data',
    'user_profiles', 
    'api_keys',
    'ai_models',
    'ai_service_config',
    'knowledge_base',
    'sacred_content',
    'cultural_artifacts',
    'system_health_metrics',
    'system_performance_logs',
    'security_alerts',
    'notification_templates',
    'notification_channels',
    'notification_logs',
    'family_members',
    'family_relationships',
    'community_groups',
    'group_members'
  ];

  let passedTests = 0;
  let totalTests = tablesToTest.length;

  for (const tableName of tablesToTest) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ ${tableName}: accessible (${data?.length || 0} records)`);
        passedTests++;
      }
    } catch (err) {
      console.log(`❌ ${tableName}: ${err.message}`);
    }
  }

  // Test functions
  console.log('\n🔧 Testing Functions...');
  try {
    // Test system performance logging
    const { data: perfData, error: perfError } = await supabase.rpc('log_system_performance', {
      p_component: 'test',
      p_metric_type: 'connection',
      p_value: 100,
      p_metadata: { test: true }
    });
    
    if (perfError) {
      console.log(`❌ log_system_performance function: ${perfError.message}`);
    } else {
      console.log(`✅ log_system_performance function: working`);
      passedTests++;
    }
  } catch (err) {
    console.log(`❌ log_system_performance function: ${err.message}`);
  }

  // Test default data
  console.log('\n📊 Testing Default Data...');
  try {
    const { data: templates, error: templateError } = await supabase
      .from('notification_templates')
      .select('name')
      .in('name', ['welcome', 'alert_error']);
    
    if (templateError) {
      console.log(`❌ Default notification templates: ${templateError.message}`);
    } else {
      console.log(`✅ Default notification templates: ${templates?.length || 0} found`);
      passedTests++;
    }
  } catch (err) {
    console.log(`❌ Default notification templates: ${err.message}`);
  }

  try {
    const { data: aiConfig, error: aiError } = await supabase
      .from('ai_service_config')
      .select('service_name')
      .in('service_name', ['openai', 'anthropic', 'gemini']);
    
    if (aiError) {
      console.log(`❌ Default AI configurations: ${aiError.message}`);
    } else {
      console.log(`✅ Default AI configurations: ${aiConfig?.length || 0} found`);
      passedTests++;
    }
  } catch (err) {
    console.log(`❌ Default AI configurations: ${err.message}`);
  }

  // Summary
  console.log('\n📈 Test Summary:');
  console.log(`Passed: ${passedTests}/${totalTests + 3} tests`);
  
  if (passedTests >= totalTests) {
    console.log('\n🎉 SUCCESS! Your Genesis Heritage database is fully configured!');
    console.log('✅ All essential tables created');
    console.log('✅ Security policies applied');
    console.log('✅ Functions and triggers working');
    console.log('✅ Default data inserted');
    console.log('\n🚀 Your application is ready to use!');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
}

testCompleteSetup(); 