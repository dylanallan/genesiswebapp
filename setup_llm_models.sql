-- Insert default model configurations
WITH api_keys AS (
    SELECT 
        key_name,
        id as api_key_id
    FROM api_key_management
    WHERE key_name IN ('anthropic_api_key', 'openai_api_key', 'google_api_key')
)
INSERT INTO llm_model_configs (
    provider,
    model_name,
    api_key_id,
    configuration,
    capabilities,
    context_window,
    max_tokens,
    temperature,
    is_active
)
SELECT 
    provider,
    model_name,
    api_key_id,
    configuration,
    capabilities,
    context_window,
    max_tokens,
    temperature,
    is_active
FROM (
    VALUES 
        (
            'anthropic',
            'claude-3-opus-20240229',
            (SELECT api_key_id FROM api_keys WHERE key_name = 'anthropic_api_key'),
            jsonb_build_object(
                'max_tokens', 4096,
                'temperature', 0.7,
                'top_p', 1,
                'anthropic_version', '2023-06-01'
            ),
            ARRAY['chat', 'completion', 'analysis', 'summarization'],
            200000,
            4096,
            0.7,
            true
        ),
        (
            'openai',
            'gpt-4-turbo-preview',
            (SELECT api_key_id FROM api_keys WHERE key_name = 'openai_api_key'),
            jsonb_build_object(
                'max_tokens', 4096,
                'temperature', 0.7,
                'top_p', 1,
                'frequency_penalty', 0,
                'presence_penalty', 0
            ),
            ARRAY['chat', 'completion', 'analysis', 'summarization', 'code'],
            128000,
            4096,
            0.7,
            true
        ),
        (
            'google',
            'gemini-pro',
            (SELECT api_key_id FROM api_keys WHERE key_name = 'google_api_key'),
            jsonb_build_object(
                'max_tokens', 2048,
                'temperature', 0.7,
                'top_p', 1,
                'top_k', 40
            ),
            ARRAY['chat', 'completion', 'analysis'],
            32768,
            2048,
            0.7,
            true
        )
) AS models (
    provider,
    model_name,
    api_key_id,
    configuration,
    capabilities,
    context_window,
    max_tokens,
    temperature,
    is_active
)
ON CONFLICT (id) DO UPDATE SET
    configuration = EXCLUDED.configuration,
    capabilities = EXCLUDED.capabilities,
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- Verify the setup
SELECT 
    m.provider,
    m.model_name,
    m.is_active,
    k.key_name as api_key_name
FROM llm_model_configs m
JOIN api_key_management k ON k.id = m.api_key_id
ORDER BY m.provider; 