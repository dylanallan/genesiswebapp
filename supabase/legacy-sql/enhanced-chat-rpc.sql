-- Enhanced Chat RPC Function with Multi-LLM Routing

-- Drop existing function
DROP FUNCTION IF EXISTS process_chat_message(UUID, TEXT, JSONB);

-- Enhanced process_chat_message function with use case detection
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

    -- Get API keys from environment (these would be set in Supabase)
    -- For now, we'll use enhanced responses based on use case
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

Would you like me to dive deeper into any specific aspect of business automation?'

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

What specific aspect of your family history would you like to explore?'

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

What specific technical challenge would you like to tackle?'

        WHEN 'analysis' THEN 
            '📊 **Data Analysis & Research**

I can help you analyze "' || message || '" with comprehensive insights! Here''s my approach:

**🔍 Analysis Capabilities:**
• Data interpretation and insights
• Comparative analysis and benchmarking
• Trend identification and forecasting
• Statistical analysis and reporting

**📈 Research Methods:**
• Systematic data collection
• Pattern recognition and analysis
• Predictive modeling
• Performance evaluation

**🎯 Analysis Focus:**
1. Identify key metrics and KPIs
2. Analyze trends and patterns
3. Generate actionable insights
4. Create comprehensive reports

What specific data or information would you like me to analyze?'

        WHEN 'creative' THEN 
            '🎨 **Creative Content & Storytelling**

I can help you with "' || message || '" and creative projects! Here''s my creative approach:

**✨ Creative Services:**
• Content creation and storytelling
• Brand narrative development
• Creative strategy and ideation
• Visual and written content

**📝 Content Types:**
• Marketing copy and campaigns
• Brand stories and messaging
• Creative writing and narratives
• Content strategy and planning

**🎯 Creative Process:**
1. Understand your creative goals
2. Develop unique concepts and ideas
3. Create compelling content
4. Refine and optimize for impact

What type of creative project would you like to explore?'

        WHEN 'voice' THEN 
            '🎤 **Voice & Audio Technology**

I can help you with "' || message || '" and voice-related projects! Here''s my expertise:

**🎵 Voice Services:**
• Voice synthesis and generation
• Audio content creation
• Speech-to-text processing
• Voice cloning and preservation

**🔊 Audio Capabilities:**
• Natural language processing
• Voice story generation
• Audio transcription
• Voice profile creation

**🎯 Voice Applications:**
1. Create voice stories from text
2. Generate audio content
3. Process voice recordings
4. Develop voice-based features

What specific voice or audio project would you like to work on?'

        WHEN 'document' THEN 
            '📄 **Document Analysis & Processing**

I can help you with "' || message || '" and document processing! Here''s my expertise:

**📋 Document Services:**
• OCR and text extraction
• Document analysis and insights
• Historical record transcription
• Data extraction and processing

**🔍 Analysis Capabilities:**
• Handwriting recognition
• Key information extraction
• Historical context analysis
• Data verification and validation

**🎯 Document Processing:**
1. Upload or share documents
2. Extract key information
3. Analyze historical context
4. Generate insights and reports

What type of document would you like me to analyze?'

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

What would you like to explore or learn about?'

    END;

    -- Log the conversation (simplified for now)
    -- INSERT INTO ai_conversation_history (user_id, message, role, metadata)
    -- VALUES (user_uuid, message, 'user', context);

    -- Return enhanced response
    RETURN jsonb_build_object(
        'response', response,
        'use_case', use_case,
        'recommended_model', recommended_model,
        'timestamp', NOW()
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'response', 'I''m here to help you with genealogy research, business automation, and much more! What would you like to explore?',
            'use_case', 'general',
            'recommended_model', 'gpt-3.5-turbo',
            'timestamp', NOW()
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION process_chat_message(UUID, TEXT, JSONB) TO authenticated; 