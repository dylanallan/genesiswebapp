-- Add API Keys to Supabase Database
-- This will store your API keys securely in the ai_service_config table

-- Add OpenAI API Key
INSERT INTO ai_service_config (provider, api_key, config, created_by)
VALUES ('openai', 'OPENAI_API_KEY_HERE', '{}', NULL)
ON CONFLICT (provider) 
DO UPDATE SET 
    api_key = EXCLUDED.api_key,
    updated_at = NOW();

-- Add Anthropic API Key
INSERT INTO ai_service_config (provider, api_key, config, created_by)
VALUES ('anthropic', 'ANTHROPIC_API_KEY_HERE', '{}', NULL)
ON CONFLICT (provider) 
DO UPDATE SET 
    api_key = EXCLUDED.api_key,
    updated_at = NOW();

-- Add Google (Gemini) API Key
INSERT INTO ai_service_config (provider, api_key, config, created_by)
VALUES ('google', 'GOOGLE_API_KEY_HERE', '{}', NULL)
ON CONFLICT (provider) 
DO UPDATE SET 
    api_key = EXCLUDED.api_key,
    updated_at = NOW();

-- Verify the keys were added
SELECT provider, 
       CASE 
           WHEN LENGTH(api_key) > 20 THEN 
               LEFT(api_key, 10) || '...' || RIGHT(api_key, 10)
           ELSE 'INVALID'
       END as api_key_preview,
       created_at
FROM ai_service_config
ORDER BY provider; 