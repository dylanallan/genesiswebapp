#!/bin/bash

# Exit on error
set -e

# Load environment variables
if [ -f .env ]; then
  source .env
fi

# Check required environment variables
required_vars=(
  "SUPABASE_URL"
  "SUPABASE_ANON_KEY"
  "SUPABASE_SERVICE_ROLE_KEY"
  "GOOGLE_CLOUD_CREDENTIALS"
)

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "Error: $var is not set"
    exit 1
  fi
done

# Function to deploy a single edge function
deploy_function() {
  local function_name=$1
  local function_dir="supabase/functions/$function_name"
  
  echo "Deploying $function_name..."
  
  # Check if function directory exists
  if [ ! -d "$function_dir" ]; then
    echo "Error: Function directory $function_dir does not exist"
    return 1
  fi
  
  # Install dependencies
  if [ -f "$function_dir/package.json" ]; then
    echo "Installing dependencies for $function_name..."
    cd "$function_dir"
    npm install
    cd - > /dev/null
  fi
  
  # Deploy function
  echo "Deploying $function_name to Supabase..."
  supabase functions deploy "$function_name" \
    --project-ref "$(echo $SUPABASE_URL | cut -d'.' -f1 | cut -d'/' -f4)" \
    --no-verify-jwt
  
  echo "$function_name deployed successfully"
}

# Deploy all edge functions
echo "Starting edge function deployment..."

# Deploy shared utilities first
echo "Deploying shared utilities..."
deploy_function "shared"

# Deploy main functions
functions=(
  "dna-analysis-processor"
  "document-analysis-processor"
  "record-matching-processor"
  "voice-story-generator"
)

for function in "${functions[@]}"; do
  deploy_function "$function"
done

# Verify deployment
echo "Verifying deployment..."

# Function to verify a single edge function
verify_function() {
  local function_name=$1
  local response
  
  echo "Verifying $function_name..."
  response=$(curl -s -o /dev/null -w "%{http_code}" \
    "$SUPABASE_URL/functions/v1/$function_name/health")
  
  if [ "$response" = "200" ]; then
    echo "$function_name is healthy"
    return 0
  else
    echo "Error: $function_name health check failed with status $response"
    return 1
  fi
}

# Verify all functions
for function in "${functions[@]}"; do
  verify_function "$function"
done

echo "Edge function deployment completed successfully" 