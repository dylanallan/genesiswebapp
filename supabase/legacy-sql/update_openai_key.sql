-- Update OpenAI API key
UPDATE api_key_management 
SET 
    encrypted_key = encrypt_api_key('OPENAI_API_KEY_HERE'),
    updated_at = now(),
    metadata = jsonb_build_object(
        'model', 'gpt-4-turbo-preview',
        'organization', 'default'
    )
WHERE key_name = 'openai_api_key';

-- Verify the update
SELECT 
    key_name,
    provider,
    is_active,
    updated_at,
    jsonb_pretty(metadata) as metadata
FROM api_key_management
WHERE key_name = 'openai_api_key'; 