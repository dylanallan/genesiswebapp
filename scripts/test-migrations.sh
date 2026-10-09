#!/usr/bin/env bash
# Applies every migration, in order, to a brand-new database and reports any that fail.
# Usage: PGHOST=... PGPORT=... PGUSER=postgres scripts/test-migrations.sh
# Needs plain PostgreSQL 15+; Supabase-only pieces (auth, storage, pgvector) are stubbed.
set -uo pipefail
cd "$(dirname "$0")/../supabase"
DB="migtest_$(date +%s)"
psql -qc "create database $DB" || exit 1
psql -d "$DB" -q -v ON_ERROR_STOP=1 -f tests/supabase_stub.sql || exit 1
fail=0
for f in $(ls migrations/*.sql | sort); do
  sql=$(sed -E 's/create extension if not exists ("?vector"?)[^;]*;//Ig; s/extensions\.vector\(1536\)/extensions.vector/g; s/\bvector\(1536\)/extensions.vector/g' "$f")
  if out=$(printf '%s' "$sql" | psql -d "$DB" -q -v ON_ERROR_STOP=1 2>&1); then
    echo "ok    $f"
  else
    echo "FAIL  $f"; echo "$out" | grep -m3 ERROR; fail=1
  fi
done
# Re-apply everything: migrations must be safe to run twice.
for f in migrations/2025*.sql; do
  sql=$(sed -E 's/create extension if not exists ("?vector"?)[^;]*;//Ig; s/extensions\.vector\(1536\)/extensions.vector/g; s/\bvector\(1536\)/extensions.vector/g' "$f")
  printf '%s' "$sql" | psql -d "$DB" -q -v ON_ERROR_STOP=1 >/dev/null 2>&1 || { echo "NOT RE-RUNNABLE  $f"; fail=1; }
done
psql -qc "drop database $DB" >/dev/null
exit $fail
