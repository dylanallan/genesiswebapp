# Genesis Heritage Pro

Family-history research and heritage preservation, with AI help and light business automation.

## What it does today

- **Historical records search** across open archives: Wikidata, Library of Congress (Chronicling America
  newspapers), Internet Archive, and, with free keys, DPLA and Europeana. Every result shows its source and license.
  Save results to your research.
- **Family tree** that you build and edit, with relationships and AI-suggested people you confirm or dismiss.
- **DNA file analysis** of raw data from 23andMe, AncestryDNA, MyHeritage or FamilyTreeDNA. The file is read
  in the browser and never uploaded. It reports marker counts, call rate, chromosome coverage and Y/mtDNA presence.
  Ethnicity estimates are planned (open reference panels); no health information is given.
- **Heritage library**: traditions, celebrations, recipes, stories, artifacts, family contacts and a timeline,
  all private to your account.
- **AI assistant** (Claude, GPT or Gemini, whichever is configured) with a free daily allowance and a Pro plan.
- **Voice narration** through a self-hosted open-source TTS server or ElevenLabs.
- **Automation**: connect your own n8n instance, import starter workflows and run workflows.
- **Billing** with Stripe Checkout and the Stripe customer portal.

Demo and showcase screens are labelled **Sample data** wherever their numbers are illustrative.

## Architecture

- **Frontend:** React + Vite + Tailwind (`src/`), deployed to Netlify or Vercel.
- **Backend:** Supabase. Postgres with row-level security on every user table (`supabase/migrations/`),
  Auth, Storage, and Edge Functions (`supabase/functions/`).
- **Security model:** every Edge Function verifies the caller's session. AI and Stripe keys exist only as
  function secrets. Users can only read and write their own rows. Plans can only be granted by the signed
  Stripe webhook.

## Getting started

Development:
```sh
npm install
cp env.example .env.local   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

Going live: follow **[LAUNCH.md](LAUNCH.md)** step by step.

## Quality checks

| Command | What it checks |
|---|---|
| `npm run typecheck` | TypeScript, zero errors (also runs on every build) |
| `npm test` | Unit tests (`src/**/*.test.ts`) |
| `npm run test:beta` | Opens every screen in Chromium against a simulated backend; fails on crashes |
| `npm run test:db` | Applies all migrations to a blank Postgres, checks they can be re-run |
| `psql -f supabase/tests/rls_test.sql` | Two-user privacy test (see the file header) |

## Data sources

See [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md). Only official APIs and open datasets are used;
sites whose terms forbid scraping are not scraped.
