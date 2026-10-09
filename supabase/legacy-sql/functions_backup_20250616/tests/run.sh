#!/bin/bash

# Exit on error
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting Edge Functions test suite...${NC}"

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
    echo -e "${RED}Error: Deno is not installed${NC}"
    echo "Please install Deno from https://deno.land"
    exit 1
fi

# Check if required environment variables are set
required_vars=(
    "SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
    "ANTHROPIC_API_KEY"
    "OPENAI_API_KEY"
    "GOOGLE_AI_API_KEY"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo -e "${RED}Error: Missing required environment variables:${NC}"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

# Run tests with Deno
echo -e "${YELLOW}Running tests...${NC}"
deno run \
    --allow-net \
    --allow-env \
    --allow-read \
    --allow-write \
    --allow-run \
    --unstable \
    tests/run_tests.ts

# Check test result
if [ $? -eq 0 ]; then
    echo -e "${GREEN}All tests passed successfully!${NC}"
else
    echo -e "${RED}Some tests failed. Please check the output above for details.${NC}"
    exit 1
fi 