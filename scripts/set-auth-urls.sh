#!/usr/bin/env bash
# Sets Supabase Auth's Site URL and allowed redirect addresses, so sign-in, Google sign-in, password reset and
# confirmation emails come back to the real site (not localhost). Changes only these two settings; existing
# redirect addresses are kept. Needs SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF (repository secrets).
# Usage: SITE_URL=https://genesisheritage.netlify.app scripts/set-auth-urls.sh
set -euo pipefail
SITE_URL="${SITE_URL:-https://genesisheritage.netlify.app}"
API="https://api.supabase.com/v1/projects/${SUPABASE_PROJECT_REF}/config/auth"
host="${SITE_URL#https://}"
wanted="${SITE_URL}/**,https://deploy-preview-*--${host}/**,http://localhost:5173/**"

current=$(curl -fsS -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" "$API")
existing=$(echo "$current" | jq -r '.uri_allow_list // ""')
merged=$(printf '%s,%s' "$existing" "$wanted" | tr ',' '\n' | sed 's/^ *//;s/ *$//' | grep -v '^$' | awk '!seen[$0]++' | paste -sd, -)

echo "Site URL: $(echo "$current" | jq -r '.site_url // "(none)"') -> ${SITE_URL}"
curl -fsS -X PATCH -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" -H "Content-Type: application/json" \
  -d "$(jq -n --arg site "$SITE_URL" --arg list "$merged" '{site_url: $site, uri_allow_list: $list}')" "$API" >/dev/null
echo "Redirect addresses: ${merged}"
echo "Google sign-in enabled: $(echo "$current" | jq -r '.external_google_enabled // false')"
