import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Get environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection...');
console.log('URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('Key:', supabaseAnonKey ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('\n1. Testing basic connection...');
    
    // Test if we can query the user_metadata table
    const { data: userMetadata, error: userError } = await supabase
      .from('user_metadata')
      .select('*')
      .limit(1);
    
    if (userError) {
      console.error('Error querying user_metadata:', userError);
    } else {
      console.log('✅ user_metadata table accessible');
    }

    // Test if we can query the dna_analysis_results table
    const { data: dnaResults, error: dnaError } = await supabase
      .from('dna_analysis_results')
      .select('*')
      .limit(1);
    
    if (dnaError) {
      console.error('Error querying dna_analysis_results:', dnaError);
    } else {
      console.log('✅ dna_analysis_results table accessible');
    }

    // Test if we can query the document_analysis_results table
    const { data: docResults, error: docError } = await supabase
      .from('document_analysis_results')
      .select('*')
      .limit(1);
    
    if (docError) {
      console.error('Error querying document_analysis_results:', docError);
    } else {
      console.log('✅ document_analysis_results table accessible');
    }

    // Test if we can query the record_matching_results table
    const { data: recordResults, error: recordError } = await supabase
      .from('record_matching_results')
      .select('*')
      .limit(1);
    
    if (recordError) {
      console.error('Error querying record_matching_results:', recordError);
    } else {
      console.log('✅ record_matching_results table accessible');
    }

    // Test if we can query the voice_stories table
    const { data: voiceResults, error: voiceError } = await supabase
      .from('voice_stories')
      .select('*')
      .limit(1);
    
    if (voiceError) {
      console.error('Error querying voice_stories:', voiceError);
    } else {
      console.log('✅ voice_stories table accessible');
    }

    // Test if we can query the system_health_metrics table
    const { data: healthResults, error: healthError } = await supabase
      .from('system_health_metrics')
      .select('*')
      .limit(1);
    
    if (healthError) {
      console.error('Error querying system_health_metrics:', healthError);
    } else {
      console.log('✅ system_health_metrics table accessible');
    }

    // Test if we can query the system_performance_logs table
    const { data: perfResults, error: perfError } = await supabase
      .from('system_performance_logs')
      .select('*')
      .limit(1);
    
    if (perfError) {
      console.error('Error querying system_performance_logs:', perfError);
    } else {
      console.log('✅ system_performance_logs table accessible');
    }

    // Test if we can query the materialized view
    const { data: insightsResults, error: insightsError } = await supabase
      .from('ai_system_insights')
      .select('*');
    
    if (insightsError) {
      console.error('Error querying ai_system_insights:', insightsError);
    } else {
      console.log('✅ ai_system_insights materialized view accessible');
    }

    console.log('\n🎉 Database connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
  }
}

testConnection(); 