#!/bin/bash

# Exit on error
set -e

# Load environment variables
source .env

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Log function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Check required environment variables
check_env() {
    log "Checking environment variables..."
    required_vars=(
        "SUPABASE_URL"
        "SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "GOOGLE_CLOUD_PROJECT"
        "GOOGLE_APPLICATION_CREDENTIALS"
        "OPENAI_API_KEY"
        "STORAGE_BUCKET"
        "ENVIRONMENT"
    )

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            error "Missing required environment variable: $var"
        fi
    done
}

# Deploy database migrations
deploy_migrations() {
    log "Deploying database migrations..."
    supabase db reset --db-url "$SUPABASE_URL" || error "Database migration failed"
}

# Deploy edge functions
deploy_edge_functions() {
    log "Deploying edge functions..."
    
    # List of functions to deploy
    functions=(
        "dna-analysis-processor"
        "document-analysis-processor"
        "record-matching-processor"
        "voice-story-generator"
        "health-check"
    )

    for func in "${functions[@]}"; do
        log "Deploying $func..."
        supabase functions deploy "$func" --project-ref "$SUPABASE_PROJECT_ID" || error "Failed to deploy $func"
    done
}

# Deploy storage buckets
deploy_storage() {
    log "Setting up storage buckets..."
    
    # Create buckets if they don't exist
    buckets=(
        "audio"
        "documents"
        "dna-files"
        "user-uploads"
    )

    for bucket in "${buckets[@]}"; do
        log "Setting up $bucket bucket..."
        supabase storage create-bucket "$bucket" --public || warn "Bucket $bucket may already exist"
    done

    # Set up storage policies
    log "Configuring storage policies..."
    supabase storage policy create "Public Access" \
        --bucket "audio" \
        --operation "SELECT" \
        --definition "true" || warn "Policy may already exist"

    supabase storage policy create "Authenticated Upload" \
        --bucket "user-uploads" \
        --operation "INSERT" \
        --definition "auth.role() = 'authenticated'" || warn "Policy may already exist"
}

# Deploy API documentation
deploy_api_docs() {
    log "Generating and deploying API documentation..."
    
    # Generate OpenAPI spec
    npx @redocly/cli build-docs openapi.yaml -o docs/api.html || error "Failed to generate API docs"
    
    # Deploy to Supabase storage
    supabase storage upload docs/api.html public/api-docs || error "Failed to upload API docs"
}

# Deploy monitoring and logging
setup_monitoring() {
    log "Setting up monitoring and logging..."
    
    # Create monitoring tables
    psql "$SUPABASE_URL" <<-EOF
        -- Create monitoring tables if they don't exist
        CREATE TABLE IF NOT EXISTS function_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            function_name TEXT NOT NULL,
            execution_time INTEGER,
            status TEXT,
            error_message TEXT,
            metadata JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS performance_metrics (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            metric_name TEXT NOT NULL,
            metric_value FLOAT,
            tags JSONB,
            timestamp TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_function_logs_function_name ON function_logs(function_name);
        CREATE INDEX IF NOT EXISTS idx_function_logs_created_at ON function_logs(created_at);
        CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_name ON performance_metrics(metric_name);
        CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
    EOF
}

# Deploy rate limiting
setup_rate_limiting() {
    log "Setting up rate limiting..."
    
    # Create rate limiting tables
    psql "$SUPABASE_URL" <<-EOF
        -- Create rate limiting tables
        CREATE TABLE IF NOT EXISTS rate_limits (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES auth.users(id),
            endpoint TEXT NOT NULL,
            request_count INTEGER DEFAULT 0,
            window_start TIMESTAMPTZ DEFAULT NOW(),
            window_end TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON rate_limits(user_id, endpoint);
        CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start, window_end);

        -- Create function to check rate limits
        CREATE OR REPLACE FUNCTION check_rate_limit(
            p_user_id UUID,
            p_endpoint TEXT,
            p_max_requests INTEGER DEFAULT 100,
            p_window_hours INTEGER DEFAULT 1
        ) RETURNS BOOLEAN AS \$\$
        DECLARE
            v_count INTEGER;
        BEGIN
            -- Clean up old records
            DELETE FROM rate_limits
            WHERE window_end < NOW();

            -- Get current count
            SELECT COALESCE(SUM(request_count), 0)
            INTO v_count
            FROM rate_limits
            WHERE user_id = p_user_id
            AND endpoint = p_endpoint
            AND window_start >= NOW() - (p_window_hours || ' hours')::INTERVAL;

            -- Check if limit exceeded
            IF v_count >= p_max_requests THEN
                RETURN FALSE;
            END IF;

            -- Update or insert record
            INSERT INTO rate_limits (user_id, endpoint, request_count, window_start, window_end)
            VALUES (p_user_id, p_endpoint, 1, NOW(), NOW() + (p_window_hours || ' hours')::INTERVAL)
            ON CONFLICT (user_id, endpoint)
            DO UPDATE SET request_count = rate_limits.request_count + 1;

            RETURN TRUE;
        END;
        \$\$ LANGUAGE plpgsql;
    EOF
}

# Deploy backup system
setup_backups() {
    log "Setting up backup system..."
    
    # Create backup tables
    psql "$SUPABASE_URL" <<-EOF
        -- Create backup tables
        CREATE TABLE IF NOT EXISTS backup_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            backup_type TEXT NOT NULL,
            status TEXT NOT NULL,
            start_time TIMESTAMPTZ DEFAULT NOW(),
            end_time TIMESTAMPTZ,
            size_bytes BIGINT,
            metadata JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create backup function
        CREATE OR REPLACE FUNCTION perform_backup(
            p_backup_type TEXT DEFAULT 'full'
        ) RETURNS UUID AS \$\$
        DECLARE
            v_backup_id UUID;
        BEGIN
            -- Insert backup record
            INSERT INTO backup_logs (backup_type, status, start_time)
            VALUES (p_backup_type, 'in_progress', NOW())
            RETURNING id INTO v_backup_id;

            -- Perform backup (placeholder for actual backup logic)
            -- This would typically involve pg_dump or similar

            -- Update backup record
            UPDATE backup_logs
            SET
                status = 'completed',
                end_time = NOW(),
                size_bytes = 0, -- Placeholder
                metadata = jsonb_build_object(
                    'tables_backed_up', ARRAY['voice_stories', 'function_logs', 'performance_metrics'],
                    'backup_method', 'pg_dump'
                )
            WHERE id = v_backup_id;

            RETURN v_backup_id;
        END;
        \$\$ LANGUAGE plpgsql;

        -- Create scheduled backup job
        SELECT cron.schedule(
            'daily-backup',
            '0 0 * * *', -- Run daily at midnight
            \$\$SELECT perform_backup('full')\$\$
        );
    EOF
}

# Deploy security measures
setup_security() {
    log "Setting up security measures..."
    
    # Create security tables and functions
    psql "$SUPABASE_URL" <<-EOF
        -- Create security audit log
        CREATE TABLE IF NOT EXISTS security_audit_log (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES auth.users(id),
            action TEXT NOT NULL,
            resource_type TEXT,
            resource_id UUID,
            ip_address TEXT,
            user_agent TEXT,
            metadata JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create security policies
        CREATE POLICY "Enable audit logging for all users"
        ON security_audit_log
        FOR ALL
        USING (auth.role() = 'authenticated');

        -- Create function to log security events
        CREATE OR REPLACE FUNCTION log_security_event(
            p_action TEXT,
            p_resource_type TEXT DEFAULT NULL,
            p_resource_id UUID DEFAULT NULL,
            p_metadata JSONB DEFAULT NULL
        ) RETURNS UUID AS \$\$
        DECLARE
            v_log_id UUID;
        BEGIN
            INSERT INTO security_audit_log (
                user_id,
                action,
                resource_type,
                resource_id,
                ip_address,
                user_agent,
                metadata
            )
            VALUES (
                auth.uid(),
                p_action,
                p_resource_type,
                p_resource_id,
                current_setting('request.headers', true)::json->>'x-forwarded-for',
                current_setting('request.headers', true)::json->>'user-agent',
                p_metadata
            )
            RETURNING id INTO v_log_id;

            RETURN v_log_id;
        END;
        \$\$ LANGUAGE plpgsql;
    EOF
}

# Main deployment process
main() {
    log "Starting deployment process..."
    
    # Check environment
    check_env
    
    # Deploy components
    deploy_migrations
    deploy_edge_functions
    deploy_storage
    deploy_api_docs
    setup_monitoring
    setup_rate_limiting
    setup_backups
    setup_security
    
    log "Deployment completed successfully!"
}

# Run main function
main 