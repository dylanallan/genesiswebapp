# Launch checklist

Follow these steps in order. Each one is small. Tick them off as you go.
Commands run in a terminal inside this project folder.

## 1. Supabase (database, sign-in, backend)

1. Create a project at https://supabase.com (or use the existing one).
2. Install the Supabase CLI and link the project:
   ```sh
   npx supabase login
   npx supabase link --project-ref YOUR-PROJECT-REF
   ```
3. Create all tables, security rules and functions:
   ```sh
   npx supabase db push
   ```
4. Deploy the backend functions:
   ```sh
   npx supabase functions deploy
   ```
5. In the Supabase dashboard → Authentication → URL Configuration, set **Site URL** to your domain
   and add it to **Redirect URLs** (needed for email confirmation and Google sign-in).
6. Optional: Authentication → Providers → enable **Google**.
7. Make yourself an admin (unlocks admin dashboards). In the SQL editor:
   ```sql
   insert into admin_roles (user_id) select id from auth.users where email = 'YOUR-EMAIL';
   ```

## 2. AI provider (at least one)

Get an API key from Anthropic, OpenAI or Google AI Studio, then:
```sh
npx supabase secrets set ANTHROPIC_API_KEY=...   # and/or OPENAI_API_KEY / GEMINI_API_KEY
```

## 3. Stripe (getting paid)

1. Create a Stripe account and complete business verification.
2. Products → add **Genesis Pro** with a monthly price (and optionally a yearly price). Copy the price IDs (`price_...`).
3. Developers → Webhooks → add endpoint:
   `https://YOUR-PROJECT.supabase.co/functions/v1/stripe-webhook`
   with events: `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`. Copy the signing secret (`whsec_...`).
4. Settings → Billing → Customer portal → turn it on (lets customers cancel / update cards).
5. Save the secrets:
   ```sh
   npx supabase secrets set STRIPE_SECRET_KEY=sk_live_... STRIPE_WEBHOOK_SECRET=whsec_... \
     STRIPE_PRICE_MONTHLY=price_... STRIPE_PRICE_YEARLY=price_...
   ```
   Test first with `sk_test_` keys and card `4242 4242 4242 4242`, then switch to live keys.

## 4. Site settings for the backend

```sh
npx supabase secrets set SITE_URL=https://your-domain.com ALLOWED_ORIGINS=https://your-domain.com \
  CONTACT_EMAIL=you@your-domain.com
```

## 5. Deploy the website (Netlify or Vercel)

1. Connect the GitHub repo in Netlify (or Vercel). Build command and output folder are already configured.
2. Add environment variables from the "Frontend" section of `env.example`
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and the optional display values).
3. Deploy, then visit the site and sign up with a real email.

## 6. Optional features

| Feature | What to set |
|---|---|
| Voice narration | `TTS_SERVER_URL` (self-hosted open-source Kokoro-FastAPI) **or** `ELEVENLABS_API_KEY` + `VOICE_ID_EN` |
| Voice stories | `GOOGLE_TTS_API_KEY` (Google Cloud Text-to-Speech) |
| More record sources | `DPLA_API_KEY`, `EUROPEANA_API_KEY` (both free) |
| Automation | each customer connects their own n8n instance inside the app |

## 7. Before you announce it

- [ ] Sign up, confirm email, sign in, sign out.
- [ ] Chat with the AI assistant; hit the free limit; upgrade with a Stripe test card; confirm the plan badge says **Pro**.
- [ ] Manage billing → cancel → plan returns to Free at period end.
- [ ] Search historical records and save one.
- [ ] Add a family member; upload a raw DNA file.
- [ ] Add a **Privacy Policy** and **Terms of Service** (required for Stripe and for handling DNA and family data). Have a lawyer review them; genetic data has extra rules in many states and countries.

## Checks you can run any time

```sh
npm run typecheck      # no type errors
npm test               # unit tests
npm run build          # production build
npm run test:beta      # opens every screen in a real browser against a simulated backend
npm run test:db        # applies every migration to a blank Postgres (needs PGHOST/PGPORT/PGUSER)
```
