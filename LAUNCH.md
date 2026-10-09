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
   Or let GitHub do steps 2–4 automatically on every merge to `main`: add repository secrets
   `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` and `SUPABASE_DB_PASSWORD`
   (GitHub → Settings → Secrets and variables → Actions). The **Deploy Supabase backend** workflow
   can also be run by hand from the Actions tab.
5. In the Supabase dashboard → Authentication → URL Configuration, set **Site URL** to your domain
   and add it to **Redirect URLs** (needed for email confirmation and Google sign-in).
6. Optional: Authentication → Providers → enable **Google**.
7. Make yourself an admin (unlocks admin dashboards). In the SQL editor:
   ```sql
   insert into admin_roles (user_id) select id from auth.users where email = 'YOUR-EMAIL';
   ```

## 2. AI (free options first)

The app tries each AI service you set up, free ones first, and moves to the next one if a service is down or
out of free quota. One is enough; two or three free ones give a good safety net.

| Service | Cost | Where to get the key | Secret name |
|---|---|---|---|
| Google Gemini | free tier | https://aistudio.google.com/apikey | `GEMINI_API_KEY` |
| Groq (Llama) | free tier | https://console.groq.com/keys | `GROQ_API_KEY` |
| OpenRouter (`:free` models) | free models | https://openrouter.ai/keys | `OPENROUTER_API_KEY` |
| Mistral | free Experiment plan | https://console.mistral.ai/api-keys | `MISTRAL_API_KEY` |
| NVIDIA | free developer access | https://build.nvidia.com | `NVIDIA_API_KEY` |
| Anthropic / OpenAI | paid | console.anthropic.com / platform.openai.com | `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` |

```sh
npx supabase secrets set GEMINI_API_KEY=... GROQ_API_KEY=...
```

**OmniRoute (optional):** [OmniRoute](https://github.com/diegosouzapw/OmniRoute) is a free, open-source gateway
that pools many free AI providers behind one address. It has to run on a server the internet can reach (for
example a small Docker host); Supabase cannot reach a copy running only on your own computer. Once it runs and you
have connected providers in its dashboard, set `OMNIROUTE_BASE_URL=https://your-omniroute-host/v1` and, if you
turned on its API keys, `OMNIROUTE_API_KEY` (Dashboard → Endpoints). It is tried first.

To prefer a paid model, set `AI_PROVIDER_ORDER=anthropic` (comma-separated names go first).

## 3. Getting paid

### PayPal (automatic monthly / yearly subscriptions; customers can pay by card or PayPal)
1. Open a **PayPal Business** account and finish verification.
2. Go to https://developer.paypal.com → **Apps & Credentials** → create an app. Copy the **Client ID** and **Secret**
   (use the **Sandbox** tab first for testing, then **Live**).
3. Create the plans (prints two plan IDs):
   ```sh
   PAYPAL_CLIENT_ID=... PAYPAL_CLIENT_SECRET=... PAYPAL_ENV=sandbox \
   MONTHLY_PRICE=19.00 YEARLY_PRICE=190.00 CURRENCY=USD node scripts/paypal-setup.mjs
   ```
4. In the same app → **Webhooks** → add
   `https://YOUR-PROJECT.supabase.co/functions/v1/paypal-webhook`
   with events `BILLING.SUBSCRIPTION.ACTIVATED`, `BILLING.SUBSCRIPTION.UPDATED`, `BILLING.SUBSCRIPTION.CANCELLED`,
   `BILLING.SUBSCRIPTION.SUSPENDED`, `BILLING.SUBSCRIPTION.EXPIRED`, `BILLING.SUBSCRIPTION.PAYMENT.FAILED`,
   `PAYMENT.SALE.COMPLETED`. Copy the **Webhook ID**.
5. Save the secrets:
   ```sh
   npx supabase secrets set PAYPAL_ENV=sandbox PAYPAL_CLIENT_ID=... PAYPAL_CLIENT_SECRET=... \
     PAYPAL_WEBHOOK_ID=... PAYPAL_PLAN_MONTHLY=P-... PAYPAL_PLAN_YEARLY=P-...
   ```
6. Test with a PayPal **sandbox buyer** account (Developer Dashboard → Sandbox → Accounts). When everything works,
   repeat steps 2–5 on the **Live** tab with `PAYPAL_ENV=live`.

### PayPal payment links (no developer credentials needed)
Works with any PayPal Business account. Customers get a reference code, pay through your link (PayPal or card),
and you confirm the payment in the app. It does not renew automatically.
1. In PayPal → **Pay & get paid → Payment links and buttons**, create two links in **CAD** at the same prices as
   e-Transfer (for example 19.00 and 190.00). Add a customer note field named **Reference code** (required).
2. In the app as an admin → **Payments (admin)** → paste the two links → **Save**. A "Pay with PayPal or card" button
   appears on the Plans page. If automatic subscriptions (above) are not set up, their button is hidden.
3. When a payment arrives, check that its note shows the customer's code, then press **Received** in **Payments (admin)**.

### Interac e-Transfer (manual; Canada)
1. Sign in to the app as an admin → Dashboard → **Payments (admin)**.
2. Enter the email that receives your e-Transfers and the monthly / yearly prices in CAD → **Save**.
   The e-Transfer option now appears on the Plans page.
3. Customers get a reference code like `GEN-3F9A2C` to put in the e-Transfer message.
   When the money arrives, find that code in **Payments (admin)** and press **Received**. Pro switches on immediately.
4. Tip: turn on **Autodeposit** with your bank so transfers land without security questions.

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
| Family voice preservation (cloning, with consent) | `ELEVENLABS_API_KEY` (ElevenLabs plan that includes Instant Voice Cloning) |
| Family photo analysis (faces, places, printed dates) | `GOOGLE_VISION_API_KEY` (Google Cloud Vision API enabled) |
| AI memory (search your own notes and documents) | `OPENAI_API_KEY` (used for embeddings even if chat uses another provider) |
| More record sources | `DPLA_API_KEY`, `EUROPEANA_API_KEY` (both free) |
| Automation | each customer connects their own n8n instance inside the app |

## 7. Before you announce it

- [ ] Sign up, confirm email, sign in, sign out.
- [ ] Chat with the AI assistant; hit the free limit; subscribe with a PayPal sandbox buyer; confirm the badge says **Pro**.
- [ ] Plans → **Cancel subscription** → Pro stays until the paid-through date, then returns to Free.
- [ ] Request an e-Transfer, confirm it in **Payments (admin)**, and check the customer becomes **Pro**.
- [ ] Search historical records and save one.
- [ ] Add a family member; upload a raw DNA file.
- [ ] Add a **Privacy Policy** and **Terms of Service** (required by PayPal and for handling DNA and family data). Have a lawyer review them; genetic data has extra rules in many states and countries.

## Checks you can run any time

```sh
npm run typecheck      # no type errors
npm test               # unit tests
npm run build          # production build
npm run test:beta      # opens every screen in a real browser against a simulated backend
npm run test:db        # applies every migration to a blank Postgres (needs PGHOST/PGPORT/PGUSER)
npm run check:functions  # type-checks every Supabase Edge Function (Deno)
npm run test:functions   # Edge Function unit tests
```
