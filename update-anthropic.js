import fs from 'fs';

// Replace with your real Anthropic API key in your .env file, not in source code!
const newAnthropicKey = 'ANTHROPIC_API_KEY_HERE';

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