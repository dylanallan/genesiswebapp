# Legacy SQL (not applied)

Earlier one-off SQL scripts and backups, kept for reference only. **Do not run these.**
The database is defined entirely by `supabase/migrations/` (tested by `npm run test:db`).
Several of these files conflict with each other and with the migrations, and some store
API keys in tables, which the app no longer does.
