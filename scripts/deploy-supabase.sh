#!/usr/bin/env bash
# Deploys the backend to Supabase: database migrations, then every Edge Function.
# Needs: SUPABASE_ACCESS_TOKEN (supabase.com → Account → Access Tokens),
#        SUPABASE_PROJECT_REF (Project Settings → General), SUPABASE_DB_PASSWORD (set when the project was created).
# Function secrets (API keys etc.) are set separately with `npx supabase secrets set` (see LAUNCH.md).
set -euo pipefail
cd "$(dirname "$0")/.."
: "${SUPABASE_ACCESS_TOKEN:?Set SUPABASE_ACCESS_TOKEN}"
: "${SUPABASE_PROJECT_REF:?Set SUPABASE_PROJECT_REF}"
: "${SUPABASE_DB_PASSWORD:?Set SUPABASE_DB_PASSWORD}"

npx --yes supabase@latest link --project-ref "$SUPABASE_PROJECT_REF" --password "$SUPABASE_DB_PASSWORD"
npx --yes supabase@latest db push --password "$SUPABASE_DB_PASSWORD"
npx --yes supabase@latest functions deploy --project-ref "$SUPABASE_PROJECT_REF"
echo "Supabase backend deployed."
