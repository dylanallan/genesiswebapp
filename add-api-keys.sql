-- Add API Keys to Supabase Database
-- This will store your API keys securely in the ai_service_config table

-- Add OpenAI API Key
INSERT INTO ai_service_config (provider, api_key, config, created_by)
VALUES ('openai', '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', '{}', NULL)
ON CONFLICT (provider) 
DO UPDATE SET 
    api_key = EXCLUDED.api_key,
    updated_at = NOW();

-- Add Anthropic API Key
INSERT INTO ai_service_config (provider, api_key, config, created_by)
VALUES ('anthropic', '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', '{}', NULL)
ON CONFLICT (provider) 
DO UPDATE SET 
    api_key = EXCLUDED.api_key,
    updated_at = NOW();

-- Add Google (Gemini) API Key
INSERT INTO ai_service_config (provider, api_key, config, created_by)
VALUES ('google', 'AIzaSyAykdwrfLMPkJ7m9H6_5gTGVq5LKkEI4iI', '{}', NULL)
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