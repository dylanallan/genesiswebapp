-- Check database state and report issues
DO $$
DECLARE
    v_issues text[] := ARRAY[]::text[];
    v_view_type text;
    v_table_exists boolean;
    v_index_exists boolean;
BEGIN
    -- Check ai_system_insights
    SELECT EXISTS (
        SELECT 1 FROM pg_views WHERE viewname = 'ai_system_insights'
    ) INTO v_table_exists;
    
    IF v_table_exists THEN
        SELECT CASE 
            WHEN EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'ai_system_insights') 
            THEN 'materialized view'
            ELSE 'regular view'
        END INTO v_view_type;
        
        v_issues := array_append(v_issues, format('ai_system_insights exists as a %s', v_view_type));
    ELSE
        v_issues := array_append(v_issues, 'ai_system_insights does not exist');
    END IF;

    -- Check knowledge_base table and indexes
    SELECT EXISTS (
        SELECT 1 FROM pg_tables WHERE tablename = 'knowledge_base'
    ) INTO v_table_exists;
    
    IF v_table_exists THEN
        -- Check for essential indexes
        SELECT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'knowledge_base' 
            AND indexname = 'idx_knowledge_base_content'
        ) INTO v_index_exists;
        
        IF NOT v_index_exists THEN
            v_issues := array_append(v_issues, 'Missing idx_knowledge_base_content index');
        END IF;
    ELSE
        v_issues := array_append(v_issues, 'knowledge_base table does not exist');
    END IF;

    -- Check ai_conversation_history
    SELECT EXISTS (
        SELECT 1 FROM pg_tables WHERE tablename = 'ai_conversation_history'
    ) INTO v_table_exists;
    
    IF v_table_exists THEN
        -- Check for essential indexes
        SELECT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'ai_conversation_history' 
            AND indexname = 'idx_conversation_user_session'
        ) INTO v_index_exists;
        
        IF NOT v_index_exists THEN
            v_issues := array_append(v_issues, 'Missing idx_conversation_user_session index');
        END IF;
    ELSE
        v_issues := array_append(v_issues, 'ai_conversation_history table does not exist');
    END IF;

    -- Check essential functions
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_conversation_context') THEN
        v_issues := array_append(v_issues, 'Missing get_conversation_context function');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'find_similar_messages') THEN
        v_issues := array_append(v_issues, 'Missing find_similar_messages function');
    END IF;

    -- Check extensions
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        v_issues := array_append(v_issues, 'Missing vector extension');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
        v_issues := array_append(v_issues, 'Missing pg_trgm extension');
    END IF;

    -- Report issues
    IF array_length(v_issues, 1) > 0 THEN
        RAISE NOTICE 'Database state issues found:';
        FOR i IN 1..array_length(v_issues, 1) LOOP
            RAISE NOTICE '%: %', i, v_issues[i];
        END LOOP;
    ELSE
        RAISE NOTICE 'No issues found in database state';
    END IF;
END;
$$; 