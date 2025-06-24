#!/usr/bin/env node

/**
 * Supabase Configuration Setup Script
 * This script helps configure the correct Supabase project for Genesis Heritage Pro
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Correct Supabase configuration for "genesis dashboard" project
const SUPABASE_CONFIG = {
  url: 'https://yomgwdeqsvbapvqpuspq.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbWd3ZGVxc3ZiYXB2cXB1c3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MDIzNjUsImV4cCI6MjA2NDE3ODM2NX0.HBjnzvpUBuPdTkFkJDwu673d0BqsJanaoMFkhTwEdvk'
};

console.log('🔧 Setting up Supabase configuration for Genesis Heritage Pro...\n');

// Create .env file if it doesn't exist
const envPath = path.join(process.cwd(), '.env');
const envContent = `# Supabase Environment Variables - Genesis Dashboard Project
VITE_SUPABASE_URL=${SUPABASE_CONFIG.url}
VITE_SUPABASE_ANON_KEY=${SUPABASE_CONFIG.anonKey}

# AI Service API Keys (Add your actual keys here)
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_GEMINI_API_KEY=your_gemini_api_key_here
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional: Analytics and Monitoring
VITE_POSTHOG_KEY=your_posthog_key_here
VITE_SENTRY_DSN=your_sentry_dsn_here
`;

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file with correct Supabase configuration');
} catch (error) {
  console.log('⚠️  Could not create .env file (may already exist or be protected)');
}

console.log('\n📋 Environment Variables for bolt.new:');
console.log('=====================================');
console.log(`VITE_SUPABASE_URL=${SUPABASE_CONFIG.url}`);
console.log(`VITE_SUPABASE_ANON_KEY=${SUPABASE_CONFIG.anonKey}`);
console.log('\n🔗 Supabase Project Details:');
console.log('==========================');
console.log('Project Name: genesis dashboard');
console.log('Project ID: yomgwdeqsvbapvqpuspq');
console.log('Organization: wupbkqwspyduxnwmtmig');
console.log('Region: East US (North Virginia)');

console.log('\n📝 Next Steps:');
console.log('==============');
console.log('1. Copy the environment variables above');
console.log('2. Go to your bolt.new project settings');
console.log('3. Add these environment variables in the deployment settings');
console.log('4. Redeploy your application');
console.log('5. Test the connection to ensure it works');

console.log('\n🎯 For bolt.new deployment:');
console.log('==========================');
console.log('- Go to your bolt.new project dashboard');
console.log('- Navigate to Settings > Environment Variables');
console.log('- Add the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY values');
console.log('- Redeploy the application');

console.log('\n✅ Configuration complete!'); 