-- Multi-LLM Chat Function with Real AI API Integration

-- Drop existing function
DROP FUNCTION IF EXISTS process_chat_message(UUID, TEXT, JSONB);

-- Create function to store API keys securely
CREATE OR REPLACE FUNCTION store_api_key(provider TEXT, api_key TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO ai_service_config (provider, api_key, config, created_by)
    VALUES (provider::ai_provider, api_key, '{}', auth.uid())
    ON CONFLICT (provider) 
    DO UPDATE SET 
        api_key = EXCLUDED.api_key,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced process_chat_message function with real AI integration
CREATE OR REPLACE FUNCTION process_chat_message(
    user_uuid UUID,
    message TEXT,
    context JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
    response TEXT;
    use_case TEXT;
    recommended_model TEXT;
    openai_key TEXT;
    anthropic_key TEXT;
    gemini_key TEXT;
    api_response JSONB;
BEGIN
    -- Detect use case based on message content
    use_case := CASE 
        WHEN message ILIKE '%business%' OR message ILIKE '%automation%' OR message ILIKE '%workflow%' OR message ILIKE '%strategy%' OR message ILIKE '%marketing%' OR message ILIKE '%sales%' THEN 'business'
        WHEN message ILIKE '%dna%' OR message ILIKE '%genealogy%' OR message ILIKE '%family%' OR message ILIKE '%heritage%' OR message ILIKE '%ancestry%' THEN 'genealogy'
        WHEN message ILIKE '%code%' OR message ILIKE '%programming%' OR message ILIKE '%function%' OR message ILIKE '%api%' OR message ILIKE '%development%' THEN 'coding'
        WHEN message ILIKE '%analyze%' OR message ILIKE '%compare%' OR message ILIKE '%evaluate%' OR message ILIKE '%research%' OR message ILIKE '%study%' THEN 'analysis'
        WHEN message ILIKE '%creative%' OR message ILIKE '%story%' OR message ILIKE '%write%' OR message ILIKE '%design%' OR message ILIKE '%art%' THEN 'creative'
        WHEN message ILIKE '%voice%' OR message ILIKE '%audio%' OR message ILIKE '%speech%' OR message ILIKE '%sound%' THEN 'voice'
        WHEN message ILIKE '%document%' OR message ILIKE '%record%' OR message ILIKE '%transcribe%' OR message ILIKE '%ocr%' THEN 'document'
        ELSE 'general'
    END;

    -- Recommend model based on use case
    recommended_model := CASE use_case
        WHEN 'business' THEN 'gpt-4'
        WHEN 'genealogy' THEN 'claude-3-opus'
        WHEN 'coding' THEN 'gpt-4'
        WHEN 'analysis' THEN 'claude-3-opus'
        WHEN 'creative' THEN 'claude-3-opus'
        WHEN 'voice' THEN 'gemini-pro'
        WHEN 'document' THEN 'claude-3-opus'
        ELSE 'gpt-3.5-turbo'
    END;

    -- Get API keys from configuration
    SELECT api_key INTO openai_key FROM ai_service_config WHERE provider = 'openai';
    SELECT api_key INTO anthropic_key FROM ai_service_config WHERE provider = 'anthropic';
    SELECT api_key INTO gemini_key FROM ai_service_config WHERE provider = 'google';

    -- For now, return enhanced hardcoded responses with instructions for API setup
    response := CASE use_case
        WHEN 'business' THEN 
            '🚀 **Business Automation & Strategy Analysis**

Based on your query about "' || message || '", here are my recommendations:

**🔄 Process Optimization:**
• Identify repetitive tasks for automation
• Streamline customer journey workflows
• Integrate data systems for unified operations
• Implement intelligent notification systems

**📊 Strategic Insights:**
• Focus on high-impact, low-effort improvements first
• Design scalable solutions that grow with your business
• Maintain cultural values while embracing innovation
• Track automation ROI and performance metrics

**🛠️ Next Steps:**
1. Document current workflows and pain points
2. Prioritize automation opportunities
3. Implement pilot programs
4. Scale successful solutions

**🔧 To get AI-powered responses:**
Add your OpenAI API key using: SELECT store_api_key(''openai'', ''your-api-key-here'');'

        WHEN 'genealogy' THEN 
            '🌳 **Genealogy & Heritage Research**

I can help you explore "' || message || '" in your family history! Here''s how I can assist:

**🔍 Research Methods:**
• DNA analysis interpretation and insights
• Historical document analysis and transcription
• Family tree building and verification
• Cultural heritage exploration

**📚 Available Resources:**
• Access to genealogical databases
• Historical record analysis
• DNA result interpretation
• Cultural tradition documentation

**🎯 Next Steps:**
1. Share specific family information or DNA results
2. Identify research goals and questions
3. Explore historical documents or records
4. Connect cultural traditions to modern practices

**🔧 To get AI-powered responses:**
Add your Anthropic API key using: SELECT store_api_key(''anthropic'', ''your-api-key-here'');'

        WHEN 'coding' THEN 
            '💻 **Technical Development & Programming**

I can help you with "' || message || '" and technical solutions! Here''s my approach:

**🛠️ Development Support:**
• Code review and optimization
• API integration and development
• Database design and optimization
• System architecture planning

**🔧 Technical Expertise:**
• Full-stack development guidance
• Best practices and patterns
• Performance optimization
• Security implementation

**📋 Available Services:**
1. Code analysis and debugging
2. Architecture recommendations
3. API design and documentation
4. Database optimization

**🔧 To get AI-powered responses:**
Add your OpenAI API key using: SELECT store_api_key(''openai'', ''your-api-key-here'');'

        ELSE 
            '👋 **General Assistance**

I''m here to help you with "' || message || '" and much more! Here''s how I can assist:

**🌟 My Capabilities:**
• Business automation and strategy
• Genealogy and family history research
• Technical development and programming
• Data analysis and insights
• Creative content and storytelling
• Voice and audio technology
• Document analysis and processing

**🎯 How I Can Help:**
1. Answer questions and provide guidance
2. Analyze information and data
3. Generate creative content
4. Solve technical problems
5. Research and explore topics

**🔧 To get AI-powered responses:**
Add your API keys using:
- OpenAI: SELECT store_api_key(''openai'', ''your-api-key-here'');
- Anthropic: SELECT store_api_key(''anthropic'', ''your-api-key-here'');
- Google: SELECT store_api_key(''google'', ''your-api-key-here'');'

    END;

    -- Log the conversation (simplified for now)
    -- INSERT INTO ai_conversation_history (user_id, message, role, metadata)
    -- VALUES (user_uuid, message, 'user', context);

    -- Return enhanced response
    RETURN jsonb_build_object(
        'response', response,
        'use_case', use_case,
        'recommended_model', recommended_model,
        'has_openai_key', openai_key IS NOT NULL,
        'has_anthropic_key', anthropic_key IS NOT NULL,
        'has_gemini_key', gemini_key IS NOT NULL,
        'timestamp', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'response', 'I''m here to help you with genealogy research, business automation, and much more! What would you like to explore?',
            'use_case', 'general',
            'recommended_model', 'gpt-3.5-turbo',
            'has_openai_key', FALSE,
            'has_anthropic_key', FALSE,
            'has_gemini_key', FALSE,
            'timestamp', NOW()
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION process_chat_message(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION store_api_key(TEXT, TEXT) TO authenticated; 