import fs from 'fs';

const newAnthropicKey = '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';

// Read current .env file
const envPath = '.env';
let envContent = fs.readFileSync(envPath, 'utf8');

// Replace the Anthropic API key
envContent = envContent.replace(
  /VITE_ANTHROPIC_API_KEY=.*/,
  `VITE_ANTHROPIC_API_KEY=${newAnthropicKey}`
);

// Write back to .env file
fs.writeFileSync(envPath, envContent);

console.log('✅ Updated .env file with new Anthropic API key!');
console.log('🔄 Your dev server should automatically restart...'); 