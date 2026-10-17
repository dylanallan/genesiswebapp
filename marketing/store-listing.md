# App store listings: Microsoft Store and Google Play

Genesis Heritage is a web app that can be installed (a "PWA"). The stores accept it as it is: a free tool called
PWABuilder wraps the live website into a store package. Nothing is rebuilt; when the website updates, the store app
updates too.

Before you start, the website must be live at its final address with this version deployed (merge the open pull
requests first). The store checks the live site.

---

## 1. Microsoft Store (do this first: free, and you keep 100% of subscription money)

### Step by step (about 30 minutes)

1. **Make a developer account.** Go to https://partner.microsoft.com/dashboard/registration and choose
   **Individual**. It's free for individuals. Sign in with a Microsoft account (or make one with your email).
2. **Reserve the name.** In Partner Center choose **Apps and games → New product → MSIX or PWA app**, type
   `Genesis Heritage` and click **Reserve product name**.
3. **Get three codes from Partner Center.** Open the product, go to **Product management → Product identity**.
   Keep this page open. You'll need: *Package/Identity/Name*, *Package/Identity/Publisher* and *Publisher display name*.
4. **Make the package.** Go to https://www.pwabuilder.com, paste `https://genesisheritage.netlify.app` and press
   **Start**. It shows a score; the app already has its icons, screenshots, shortcuts and offline page set up.
   Press **Package for stores → Windows → Generate package**. Paste the three codes from step 3 and press
   **Download package**. You get a .zip.
5. **Upload it.** Back in Partner Center, start a **submission**:
   - **Pricing and availability:** Free (people subscribe inside the app). Markets: all, or Canada first.
   - **Properties:** Category *Lifestyle*. Privacy policy URL: `https://genesisheritage.netlify.app/privacy`.
     Tick that the app accesses the internet and that it has user-generated content.
   - **Age ratings:** answer the questionnaire (see "Age rating answers" below).
   - **Packages:** upload the `.msixbundle` from the .zip (not the "classic" one).
   - **Store listings:** add English (Canada) and French (Canada), and paste the text below.
6. **Submit.** Microsoft usually reviews within a few business days. If they ask for changes, send me the message.

### Listing text: English (Canada)

**Short description (up to 100 characters)**
Your family tree, voices and stories in one private place. Free to start.

**Description**
Genesis Heritage is the family-history app for everyone in the family, not just the researcher.

• Build your family tree, or bring it from Ancestry or MyHeritage with a GEDCOM file.
• Search free historical records, with no paywall on searching.
• Record a grandparent's stories in their own voice, and keep them forever.
• Send a relative a private link with questions; they answer from their phone, no account needed.
• Turn your family's stories and photos into a storybook you can print.
• Share with family for free, and choose who can only look and who can add.
• Use it in English or in French.

Private by default: we never sell your data or your family's data. Download everything at any time, or delete your
account in one step.

Free to start. Pro is one clear price in Canadian dollars, and you can cancel any time.

**Keywords (up to 7)**
family tree, genealogy, family history, ancestry, family stories, généalogie, arbre généalogique

**What's new (first release)**
First release on the Microsoft Store.

### Listing text: French (Canada)

**Description courte**
Votre arbre généalogique, vos voix et vos histoires, dans un endroit privé. Gratuit pour commencer.

**Description**
Genesis Heritage est l’application d’histoire familiale pour toute la famille, pas seulement pour le généalogiste.

• Bâtissez votre arbre généalogique, ou importez-le d’Ancestry ou de MyHeritage avec un fichier GEDCOM.
• Cherchez dans des archives historiques gratuites, sans frais pour chercher.
• Enregistrez les histoires d’un grand-parent avec sa propre voix, pour toujours.
• Envoyez à un proche un lien privé avec vos questions : il répond de son téléphone, sans créer de compte.
• Transformez les histoires et les photos de votre famille en un livre à imprimer.
• Partagez gratuitement avec votre famille et choisissez qui peut seulement regarder et qui peut ajouter.
• Utilisez l’application en français ou en anglais.

Privé par défaut : nous ne vendons jamais vos données ni celles de votre famille. Téléchargez tout quand vous voulez,
ou supprimez votre compte en une étape.

Gratuit pour commencer. Pro, c’est un prix clair en dollars canadiens, et vous pouvez annuler en tout temps.

**Mots-clés**
arbre généalogique, généalogie, histoire familiale, ancêtres, histoires de famille, family tree, genealogy

### Screenshots

Partner Center wants at least one screenshot (1366×768 or larger is best for Windows). Use these, taken from the app:

| File | What it shows |
|---|---|
| `public/screens/interview.png` | Interviewing a relative and keeping their voice |
| `public/screens/tree.png` | The family tree |
| `public/screens/life-story.png` | A life story built from the tree |
| `public/screens/research.png` | Free record search |

For the best store page, take 3–4 new full-window screenshots on a laptop (1920×1080) of the tree, the interview
screen, the storybook and the record hints. Use the sample family, never a real family's data.

### Age rating answers (IARC questionnaire)

These are honest answers based on how the app works today:

- Violence, sexual content, profanity, drugs, gambling: **No**.
- Users can communicate or share with other users: **Yes** (family sharing, and "Ask a relative" links). Sharing is
  only with people the user invites; there is no public feed or chat with strangers.
- User-generated content: **Yes** (stories, photos, recordings).
- Shares the user's location: **No**.
- Digital purchases: **Yes** (Pro subscription).
- The app contains an AI assistant that writes text from the family's saved information.

Expect a rating around "Everyone / 3+" or "Teen" depending on how the sharing answer is weighed. Either is fine.

---

## 2. Google Play (after the Microsoft Store)

Cost: **$25 USD, one time**, for a Google Play developer account (https://play.google.com/console/signup).

Google now asks new personal accounts to run a **closed test with at least 12 testers for 14 days** before the app can
be published to everyone. Ask 12 family members or waitlist friends early. (Check the current rule in Play Console when
you sign up; Google changes it from time to time.)

### Step by step

1. **Make the developer account** (link above). Google checks your ID; this can take a few days.
2. **Make the package.** At https://www.pwabuilder.com, enter the site, then **Package for stores → Android →
   Generate package**. Keep the suggested package name (for example `app.netlify.genesisheritage.twa`) or pick your
   own; **write it down, it can never change**. Download the .zip. It contains an `.aab` file (the app) and a
   `signing.keystore` file with its passwords. **Keep the keystore and passwords safe and private** (for example in a
   password manager). Never put them in GitHub.
3. **Create the app** in Play Console: name *Genesis Heritage*, default language English (Canada), App, Free.
4. **Upload** the `.aab` to the closed testing track and add your testers' emails.
5. **Link the app to the website** so it opens full-screen with no browser bar. In Play Console go to
   **Setup → App signing** and copy the **SHA-256 certificate fingerprint**. Send it to me together with the package
   name from step 2. I'll put both into `public/.well-known/assetlinks.json` (it has TODO placeholders now) and deploy
   it. Until then, the Android app shows a small browser bar at the top.
6. Fill in the **store listing** (reuse the text from the Microsoft section; Google's short description limit is 80
   characters: *Your family tree, voices and stories in one private place.*), the **content rating** (same answers as
   above), and the **Data safety** form (answers below).
7. After the 14-day test, apply for **production** and publish.

### Payments on Google Play: read this first

Google's rule is that digital subscriptions sold inside an Android app normally go through Google Play Billing, which
takes 15% of subscriptions. PayPal and e-Transfer checkout inside the Android app may not be allowed in Canada. Before
submitting, check the current payments policy in Play Console for Canada. If outside payments aren't allowed, the
simplest honest option is for the Android app to not show the purchase buttons and to tell people they can manage
their plan on the website. Tell me which way you want it and I'll make that change. (The Microsoft Store has no such
rule for apps like this.)

### Data safety form: draft answers

Based on the privacy policy (`/privacy`) and the code as of this version. Check them again if features change.

**Does your app collect or share any of the required user data types?** Yes.

**Is all of the user data collected by your app encrypted in transit?** Yes (everything goes over HTTPS).

**Do you provide a way for users to request that their data is deleted?** Yes. In the app: My account → Your data &
privacy → Delete my account. It removes the account and everything in it.

**Data collected** (none of it is "shared" in Google's sense: the service providers that run the app for us,
Supabase, the website host, the AI providers and PayPal, don't count as sharing under Google's definition):

| Google's category | Collected? | Why | Optional? |
|---|---|---|---|
| Personal info → Email address | Yes | Account management | Required |
| Personal info → Name | Yes | App functionality (shown in the tree) | Optional |
| Personal info → Other info (family members' names, dates, places) | Yes | App functionality | Optional (whatever the user adds) |
| Photos and videos → Photos | Yes | App functionality (family photos) | Optional |
| Audio → Voice or sound recordings | Yes | App functionality (interviews, stories) | Optional |
| Files and docs | Yes | App functionality (GEDCOM import, DNA results file: only the summary is kept) | Optional |
| Messages → Other in-app messages | Yes | App functionality (messages to the AI helper) | Optional |
| Financial info → Purchase history | Yes | App functionality (plan, dates, a reference code; no card or bank details) | Required for Pro |
| App info and performance → Crash logs / diagnostics | Yes | Basic technical logs for security and keeping the app working | Required |
| Location | No | | |
| Contacts, calendar, SMS, call logs | No | | |
| Web browsing, advertising ID | No | No ads and no ad tracking | |

**Is data processed ephemerally?** No. It is stored so the family can keep it.

**Used for advertising or marketing?** No.

---

## 3. Apple App Store (later, not yet)

Apple needs extra work first: subscriptions sold in the iPhone app must use Apple's in-app purchase (15% for small
businesses), there must be a "Sign in with Apple" option if Google sign-in is offered, and plain website wrappers are
often rejected. See `marketing/where-to-sell.md`. Leave this until the web, Microsoft and Google versions have users.

---

## Notes for whoever maintains this

- The install details (name, icons, screenshots, shortcuts, colours) live in the `manifest` section of
  `vite.config.ts`. The build writes `dist/manifest.webmanifest` from it.
- Icons: `public/icons/icon-any-*.png` (rounded, "any") and `public/icons/maskable-*.png` (artwork inside the safe
  zone, for Android's shaped icons). `public/icons/icon-*.png` are the originals, still used as the browser tab icon.
- `public/.well-known/assetlinks.json` has TODO values: the Android package name and the Play app-signing SHA-256.
  `netlify.toml` serves it as JSON.
- `public/manifest.json` is an older copy that nothing links to (the page links `/manifest.webmanifest`).
