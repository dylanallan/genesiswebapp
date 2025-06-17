import fs from 'fs';

const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=https://yomgwdeqsvbapvqpuspq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbWd3ZGVxc3ZiYXB2cXB1c3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg2MDIzNjUsImV4cCI6MjA2NDE3ODM2NX0.HBjnzvpUBuPdTkFkJDwu673d0BqsJanaoMFkhTwEdvk

# AI Service API Keys
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_GEMINI_API_KEY=AIzaSyB90pAbcSbOxGMJM1feRKJCihtevglM_v0
VITE_ANTHROPIC_API_KEY=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

# Optional: Analytics and Monitoring
VITE_POSTHOG_KEY=your_posthog_key_here
VITE_SENTRY_DSN=your_sentry_dsn_here
`;

fs.writeFileSync('.env', envContent);
console.log('✅ .env file updated with working API keys!');
console.log('📝 Note: You still need to add a valid OpenAI API key');
console.log('🔗 Get one at: https://platform.openai.com/api-keys'); 