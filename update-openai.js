import fs from 'fs';

const newOpenAIKey = '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';

// Read current .env file
const envPath = '.env';
let envContent = fs.readFileSync(envPath, 'utf8');

// Replace the OpenAI API key
envContent = envContent.replace(
  /VITE_OPENAI_API_KEY=.*/,
  `VITE_OPENAI_API_KEY=${newOpenAIKey}`
);

// Write back to .env file
fs.writeFileSync(envPath, envContent);

console.log('✅ Updated .env file with new OpenAI API key!');
console.log('🔄 Your dev server should automatically restart...'); 