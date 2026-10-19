# Genesis vs Ancestry and MyHeritage: what to build next

Written 18 October 2026. Research used public web search results only (no scraping, no copied code or text).
The competitors' own websites could not be opened directly from the research tool (the address lookup failed), so
competitor facts come from search summaries of their help pages, blogs, press releases and independent
genealogy blogs. Anything marked **(unverified)** should be checked on the company's own site before it goes
into marketing. No numbers below are estimates of ours; every figure is quoted from a source, with its URL.

---

## Status (19 October 2026)

All eight below are built, tested and on the `heritage-features` branch:
Listen (read aloud) · Read an old document · Date an old photo · Scan an album page · Quebec names in record hints ·
living relatives hidden from view-only family plus an "edit the tree" level · Slideshow video · Put Genesis on your phone.
The document reader, photo dating and album scan use the same Google AI key as photo restore (GEMINI_API_KEY in Supabase).

## Top 8 to build next

Each one is software only, 1 to 5 days of work, and needs no licensed records, DNA lab or big user base.

| # | Build this | Effort | Needs | Plays to |
|---|---|---|---|---|
| 1 | **Storybook read aloud**, in a relative's recorded voice (with consent) or a standard voice, in French or English | M | Existing voice functions; ElevenLabs key for cloned voices; browser voices work free as a fallback | Stories and voices, French, ease of use |
| 2 | **Old document reader**: photograph a baptism, marriage or burial record or a letter; get a transcription, a plain-language translation and the key facts, then add them to a person | M | Gemini key (already used for photo restore) | French (Quebec parish records), price, ease of use |
| 3 | **"When was this photo taken?"** — an estimated decade with a clear "this is a guess" range | S | Gemini key | Price, ease of use |
| 4 | **Scan a whole album page with the phone camera**: find each photo, crop and straighten it, save each one separately | M | Gemini key (or in-browser cropping) | Ease of use for older users |
| 5 | **Quebec names done right**: "dit" names, women's birth names kept as the main name, and French sound-alike matching in record hints | M | None | French, Quebec families |
| 6 | **Hide living relatives from view-only family members by default**, and add a third "can edit" role | S | Database change only | Privacy, family sharing |
| 7 | **Narrated slideshow video of a life story**: photos plus a recorded voice, saved as a video file to send to family | M–L | None for a basic version (browser recording); voice key optional | Stories and voices, family sharing |
| 8 | **"Put Genesis on your phone" in two taps**: install prompt plus a picture guide for iPhone and Android, opening on a big-button home screen | S | None (the app already has a web app manifest and offline page) | Ease of use, price (no app store needed) |

Why this order: items 1 to 3 copy nothing but answer the newest and most talked-about competitor features
(Ancestry's AI audio stories, MyHeritage's Scribe AI and PhotoDater) with tools Genesis already half has.
Items 5 and 6 are things big global sites are unlikely to tune for Quebec families or for privacy-first sharing.

---

## What Ancestry and MyHeritage offer in 2026

### Tree tools
- **Ancestry:** free accounts can build a tree, add people, dates, places and photos (third-party blogs, unverified for 2026) — [whoareyoumadeof.com](https://whoareyoumadeof.com/blog/how-to-use-ancestry-without-a-subscription/), [Family Tree Magazine](https://familytreemagazine.com/websites/ancestry-com-free/). Ancestry has posted about new tree visualisations — [Ancestry feature spotlight](https://www.ancestry.com/corporate/blog/visualizing-family-trees) (details not read). A "census comparison" feature and a "Get Ideas" tool were mentioned in 2026 posts but could not be confirmed **(unverified)** — [Genea-Musings, Aug 2026](https://www.geneamusings.com/2026/08/ask-ai-ten-ancestrycom-new-and-updated.html?m=0).
- **MyHeritage:** free Basic family site holds up to 250 people and 500 MB of photos and documents (help pages in German/Swedish; another review says 250 MB) — [MyHeritage help (DE)](https://www.myheritage.com/help/de/articles/12852458-was-erhalte-ich-mit-einer-basic-myheritage-mitgliedschaft), [Family Tree Magazine](https://familytreemagazine.com/resources/software/family-tree-builder/). Premium raises it to 2,500 people and 1,000 MB; PremiumPlus is unlimited and adds the **Tree Consistency Checker** — [MyHeritage help (FI)](https://www.myheritage.com/help/fi/articles/13130253-millaisia-tilauksia-myheritage-tarjoaa). The checker runs 36 or 37 logic checks (sources differ) — [MyHeritage webinar PDF](https://familytreewebinars.com/wp-content/uploads/2021/07/webinar-free1579289434.pdf). New in 2026: **Country Coding**, flags on the tree for birth or death country — [Genea-Musings RootsTech recap](https://www.geneamusings.com/2026/03/myheritage-rootstech-2026-recap.html).

### Hints
- **Ancestry:** "shaky leaf" hints from records and other members' trees — [FamilySearch blog](https://familysearch.org/blog/en/ancestrys-shaky-leaf-hints). Attaching subscription records needs a paid plan — [Your DNA Guide](https://www.yourdnaguide.com/?p=32863).
- **MyHeritage:** Smart Matches (other users' trees), Record Matches (its record collection) and Instant Discoveries. Free accounts can see matches; confirming and saving them needs a paid plan — [The FHGuide](https://www.thefhguide.com/blog/understanding-myheritages-smart-matching-technology/), [MyHeritage help](https://www.myheritage.com/help/en/articles/12851444-how-can-i-check-smart-matches-and-record-matches-using-the-myheritage-app).
- Both rely on millions of user trees and licensed records: **out of scope** for Genesis.

### Record search
- **Ancestry:** the app listing says more than 30 billion records, most behind a trial or subscription — [App Store](https://apps.apple.com/us/app/-/id349554263). Holds the Drouin collection of Quebec parish records — [Ancestry collection 1092](https://www.ancestry.com/search/collections/1092/).
- **MyHeritage:** the Data plan unlocks its records (it says "over 35 billion") — [MyHeritage help (FI)](https://www.myheritage.com/help/fi/articles/13130253-millaisia-tilauksia-myheritage-tarjoaa). **AI Record Finder** is a chat search; free for limited use, unlimited with Data or Complete (2023 launch terms) — [Business Wire](https://www.businesswire.com/news/home/20231226134311/en/MyHeritage-Releases-AI-Record-Finder%E2%84%A2-and-AI-Biographer%E2%84%A2-%E2%80%94-Two-Groundbreaking-Features-That-Transform-Genealogy-Using-Artificial-Intelligence). Added 210 million records in January 2026, some from French newspapers via Gallica — [RFGenealogie](https://www.rfgenealogie.com/infos/210-millions-de-nouvelles-donnees-en-ligne-chez-myheritage).
- Licensed databases: **out of scope**.

### Photo tools
- **Ancestry:** colourise, restore and enhance, from a 2022 Photomyne deal; multi-photo scanning in the app — [PetaPixel](https://petapixel.com/2022/06/02/ancestry-com-now-lets-you-automatically-colorize-historical-photos), [Business Wire](https://www.businesswire.com/news/home/20220303005271/en). One test rated its colouring weakest of three tools — [Who Do You Think You Are? magazine](https://www.whodoyouthinkyouaremagazine.com/feature/best-photo-colourisation-apps).
- **MyHeritage:** Deep Nostalgia (animate faces), colourise, enhance; free use was capped at five animations with a watermark at launch (2021, may have changed) — [Techlicious](https://techlicious.com/blog/myheritage-photo-animation). **PhotoDater** estimates the year a photo was taken (1860–1990), free, MyHeritage claims within five years for nearly 60% of photos — [MyHeritage blog](https://blog.myheritage.com/2023/08/introducing-photodater-an-exclusive-free-new-feature-to-estimate-when-old-photos-were-taken/), [PetaPixel test](https://petapixel.com/2023/11/16/this-ai-tool-will-estimate-when-an-old-photo-was-taken/). **Reimagine** app scans album pages and crops each photo — [The Dead Pixels Society](https://thedeadpixelssociety.com/myheritage-launches-reimagine-photo-scanning-app). An animation feature called LiveMemory is listed in app stores; launch date unclear **(unverified)**.

### DNA
- **Ancestry:** ethnicity, matches and messaging free with a kit; ThruLines and full shared matches need a subscription; Pro Tools is an extra add-on — [DNA Explained](https://dna-explained.com/category/ancestrydna/page/2/), [The DNA Geek](https://thednageek.com/ancestrydnas-thrulines/) (older sources).
- **MyHeritage:** says all kits moved to whole genome sequencing in 2026 — [Genea-Musings](https://www.geneamusings.com/2026/03/myheritage-rootstech-2026-recap.html).
- Labs and match databases: **out of scope**.

### Mobile apps
- **Ancestry:** iOS and Android app for tree building, photo scanning, stories, hints and DNA — [App Store](https://apps.apple.com/us/app/-/id349554263). I found no sign of audio recording in the app (search result only, unverified). Storymaker Studio (2023) builds short stories with photos and audio in the app — [Genealogy à la Carte](https://genealogyalacarte.ca/?p=40616).
- **MyHeritage:** main app plus Reimagine. Omni includes unlimited photo scanning in the app — [search summary of MyHeritage help](https://www.myheritage.com/help/fi/articles/13130253-millaisia-tilauksia-myheritage-tarjoaa).

### Sharing and collaboration
- **Ancestry:** three roles: Guest (view and comment, living people hidden), Contributor (add photos and stories), Editor (full edit, sees living people). Invite by link, email or name — [Ancestry help: who can edit](https://help-redir.ancestry.com/hc/en-us/articles/53933301506835-Who-Can-Edit-Your-Ancestry-Tree).
- **MyHeritage:** family site members can add photos and comments; owner chooses who may edit the tree; site managers role — [MyHeritage help](https://www.myheritage.com/help/en/articles/12851472-how-can-i-enable-my-site-members-to-edit-my-family-tree-online), [FamilySearch blog](https://familysearch.org/blog/en/invite-family-members-build-myheritage-tree).

### Printing and books
- **MyHeritage:** stopped selling printed posters on 1 January 2023; still makes charts and family books as PDFs, with 9 chart formats — [MyHeritage sunset notice](https://blog.myheritage.com/2022/12/sunset-notice-for-printing-posters-of-family-tree-charts/), [MyHeritage education](https://education.myheritage.com/article/how-to-create-a-family-tree-chart-or-book-on-myheritage/).
- **Ancestry:** I found no current Ancestry printing service **(unverified)**.

### Stories and audio
- **Ancestry:** **AI Stories** (beta, December 2025 / January 2026) turn records attached to a person into narrated audio stories; users can upload letters and documents — [Semafor](https://www.semafor.com/article/12/12/2025/ancestrys-new-ai-feature-narrates-ancestors-stories), [NWS Genealogy](https://nwsgenealogy.org/2026/01/08/ancestry-com-introduces-ai-generated-audio-stories-and-expanded-ai-education-offerings/). Which plans get it: not found **(unverified)**.
- **MyHeritage:** **LiveStory** makes a talking portrait video with a generated voice, not the relative's real voice — [Mixed News](https://mixed-news.com/en/?p=2849), [Legal Genealogist](https://www.legalgenealogist.com/?p=22381). "Life Tribute", "Life Video" and "Walk of Life" videos were previewed at RootsTech 2026, status unknown — [Genea-Musings](https://www.geneamusings.com/2026/03/myheritage-rootstech-2026-recap.html).

### AI features
- **Ancestry:** "Ask AncestryAI" on Life Story pages answers set questions about a birth, marriage or death place and time (beta; one blogger found a wrong place) — [Genea-Musings 2024](https://www.geneamusings.com/2024/01/exploring-ancestryai-feature-on.html?m=0). AI Stories, above.
- **MyHeritage:** **Scribe AI** (March 2026) transcribes handwriting, translates it into your language and explains photos, letters and gravestones; free for a limited number of images — [MyHeritage blog](https://blog.myheritage.com/2026/03/introducing-scribe-ai/), [Genealogy à la Carte](https://genealogyalacarte.ca/?p=47150). **AI Biographer** writes a biography from records; a few free, then Complete — [MyHeritage blog](https://blog.myheritage.com/2023/12/introducing-ai-biographer-create-a-wikipedia-like-biography-for-any-ancestor-using-ai-enriched-with-historical-context/). **GAIA**, an assistant you ask about your tree, and **Family Infographics** were "coming soon" / in pilot in March 2026 — [Genea-Musings](https://www.geneamusings.com/2026/03/myheritage-rootstech-2026-recap.html).

### Onboarding
- Ancestry: 14-day free trial that charges the card unless cancelled — [Family Tree Magazine](https://familytreemagazine.com/websites/ancestry-com-free/). I found no reliable 2026 description of either site's first-run steps **(unverified)**.

### Pricing tiers
- **Ancestry.ca:** Canada Discovery, Canada Discovery Plus, World Deluxe and All Access (adds Fold3 and Newspapers.com) — [Ancestry help (en-CA)](https://help-redir.ancestry.com/hc/en-ca/articles/53933280003987). Canadian dollar prices: **not found**. US prices quoted by third parties disagree (for example All Access at US$54.99 a month) — [ThePricer](https://www.thepricer.org/how-much-does-ancestry-cost/). Ancestry has announced monthly price increases before — [Ancestry blog](https://www.ancestry.com/corporate/blog/were-increasing-our-monthly-subscription-prices-help-provide-you-more-content-and-new-product).
- **MyHeritage:** Basic (free), Premium, PremiumPlus, Data, Complete, Omni — [MyHeritage help (FI)](https://www.myheritage.com/help/fi/articles/13130253-millaisia-tilauksia-myheritage-tarjoaa). Prices found are old or conflicting (one 2026 tracker: Complete US$299 a year) — [Genealogy Explained](https://www.genealogyexplained.com/myheritage-review/). **Check before quoting.**

### Free tier limits
- **Ancestry:** tree free; most records, others' tree contents in DNA and ThruLines need a subscription (sources above, unverified for 2026).
- **MyHeritage:** 250 people, 500 MB; limited free uses of photo and AI tools; confirming matches needs a paid plan (sources above).

### Language
- MyHeritage says it is available in 50 languages — [Genea-Musings](https://www.geneamusings.com/2026/03/myheritage-rootstech-2026-recap.html). Whether Ancestry.ca has a French website: **not found**. Its iPhone app has been translated into French (undated source) and Ancestry Canada has run French webinars — [Genealogy à la Carte](https://genealogyalacarte.ca/?p=32028).

---

## What Genesis has today (from the code)

Customer menu in `src/components/Dashboard.tsx` (`CUSTOMER_MENU`):

- **Start here:** guided first tree (`GetStarted.tsx`, which also runs a first archive search for the oldest person), GEDCOM import and export (`TreeImport.tsx`, `lib/gedcom.ts`), "Move from Ancestry or MyHeritage" guide (`SwitchGuide.tsx`).
- **My family:** pedigree and descendants chart with a free printable poster (`PedigreeChart.tsx`, `lib/tree-poster.ts`, `lib/descendants.ts`), family map with "play the journey" (`FamilyMap.tsx`), "Where we come from" heritage mix from the tree, no DNA test (`lib/heritage-mix.ts`), family facts, life stories with world events including Canadian history (`lib/life-story.ts`), people list, tree checkup with duplicate merge (`TreeCheckup.tsx`, `lib/tree-checks.ts`, `lib/merge.ts`), timeline, contacts, sharing (viewer or contributor, `FamilySharing.tsx`), DNA file reader (`DNAInsights.tsx`, `lib/dna.ts`).
- **Memories:** spoken interviews with live transcription in fr-CA or en-CA (`FamilyInterview.tsx`), "Ask a relative by link" with no account (`AskRelative.tsx`), story library, AI family storybook with print in 6x9 or letter (`FamilyStorybook.tsx`, `lib/storybook-print.ts`), photo restore and colourise (Gemini, `supabase/functions/restore-photo`; 1 a day free, 10 a day Pro by default), photo faces, places and printed text (Google Vision, `analyze-photo`), recipes, traditions, celebrations, heirlooms, media library, voice recorder.
- **Research:** record hints with evidence (`RecordHints.tsx`, `lib/record-match.ts`), free open-archive search (Wikidata, Library of Congress, Internet Archive, DPLA, Europeana, Gallica in `_shared/records-connectors.ts`), links to BAnQ and Library and Archives Canada (`lib/archive-links.ts`), research assistant.
- **AI helper:** "Talk about my tree" (`FamilyTreeVoiceAgent.tsx`).
- **Account:** plans, privacy centre with one-zip "download everything" (`PrivacyCenter.tsx`, `lib/full-export.ts`).
- Also: whole app in Canadian French (`lib/i18n-fr*.ts`), gender-correct French relationship sentences (`lib/relationship-fr.ts`), larger text option (`lib/text-size.ts`), web app manifest and offline page (`public/manifest.json`, `public/offline.html`), gift cards, voice cloning with consent (`VoiceCloning.tsx`, ElevenLabs).

## The comparison, area by area

| Area | Ancestry / MyHeritage | Genesis today | Gap Genesis can close in software? |
|---|---|---|---|
| Tree tools | Big tree editors, consistency checker (paid at MyHeritage), country flags | Pedigree, descendants, map, checkup and merge, all free | Small: fan chart, country flags |
| Hints | From billions of records and millions of trees | From free open archives, with evidence | No (needs licensed data and users). Can improve French name matching |
| Record search | Licensed collections incl. Drouin | Free open archives, links to BAnQ and LAC | No (licensed data) |
| Photo colourise / enhance | Yes, both | Yes (restore and colourise) | Already matched |
| Photo animate | MyHeritage Deep Nostalgia | No | Yes but L effort, cost and consent concerns |
| Photo dating | MyHeritage PhotoDater | Reads printed dates only | **Yes, S** |
| Album scanning | Both, in apps | Single upload | **Yes, M** |
| Document transcribe and translate | MyHeritage Scribe AI | No | **Yes, M** |
| DNA | Labs, matches | Reads raw files privately | No (labs, users) |
| Mobile | Native apps | Installable web app, not promoted | **Yes, S** (install guide) |
| Sharing | Ancestry 3 roles, living people hidden from guests | 2 roles; shared view includes all people (see note) | **Yes, S** |
| Printing | PDF charts and books (MyHeritage), posters stopped | Free poster and book printing | Small: more chart styles |
| Stories and audio | Ancestry AI audio stories (beta), MyHeritage LiveStory | Recorded interviews, voice cloning, storybook (not read aloud) | **Yes, M** (read-aloud) |
| AI | AncestryAI, Scribe AI, AI Biographer, GAIA coming | Storybook, life stories, research assistant, tree chat | Mostly matched; add document reader |
| Onboarding | Free trial with card | Guided first tree, no card | Already strong |
| Pricing | Several tiers, add-ons | Free plus one Pro plan, $19/month or $190/year CAD | Already strong |
| French | MyHeritage in 50 languages; Ancestry.ca unclear | Full Canadian French | Quebec names still missing |

Note on sharing: in `supabase/migrations/20250701001400_sharing_storybooks_privacy.sql` the shared family view
returns every family member row (only `user_id` is removed), so living relatives' details appear to be visible
to anyone invited. Please confirm in the app before relying on this.

---

## Every gap, ranked

Effort: **S** about 1–2 days, **M** about 2–4 days, **L** about 4–5 days.

### 1. Storybook and stories read aloud — M
- **Value:** grandparents with poor eyesight can listen; a book read in Grandpa's own voice is something families keep forever. Quebec families hear it in French.
- **Dependency:** voice functions exist (`voice-synthesis`, `voice-clone`); ElevenLabs key for cloned voices. Browser speech (already used in `FamilyInterview.tsx`) as the free option. Cloned voices only with the recorded consent already built in.
- **Strengths:** stories and voices, French, ease of use. Answers Ancestry's AI audio stories with real family voices, not only generated ones.

### 2. Old document reader (transcribe, translate, explain) — M
- **Value:** Quebec parish records are handwritten in old French, sometimes Latin; many grandchildren read only English, many grandparents only French. One photo, one button.
- **Dependency:** Gemini key (already used by `restore-photo`). Accuracy on old handwriting is **uncertain**; show the image beside the text and let people correct it.
- **Strengths:** French, price (MyHeritage limits free use), ease of use.

### 3. Photo date estimate — S
- **Value:** "Who is this and when?" is the first question on every old photo. A decade range helps place people.
- **Dependency:** Gemini key. Must be shown as a guess with a range; we have no accuracy figure of our own and must not invent one.
- **Strengths:** price, ease of use.

### 4. Scan an album page with the phone — M
- **Value:** older people have albums, not files. Taking one picture of a page instead of scanning each print is the biggest time saver.
- **Dependency:** Gemini to find photo edges, or in-browser image cropping; phone camera input.
- **Strengths:** ease of use.

### 5. Quebec and French naming — M
- **Value:** Quebec records use "dit" names (for example a family known by two surnames) and women keep their birth names in records. The hint matcher uses American Soundex (`lib/record-match.ts`), which is built for English spellings. Better handling means fewer missed records and fewer duplicate people.
- **Dependency:** none.
- **Strengths:** French, Quebec families. Hard for global sites to prioritise.

### 6. Safer sharing: hide living people, add an editor role — S
- **Value:** families share with in-laws and cousins; living people's birth dates should not leak. An "editor" lets a trusted sibling fix mistakes.
- **Dependency:** database change to the shared view and roles.
- **Strengths:** privacy, family sharing.

### 7. Narrated life-story slideshow video — M to L
- **Value:** a one-minute video of Grandma's photos with her voice is easy to send by text or show at a funeral or anniversary.
- **Dependency:** none for a basic version using the browser's video recording; voice key optional.
- **Strengths:** stories and voices, family sharing. Uses real voices rather than talking-face animation.

### 8. Easy phone install — S
- **Value:** competitors are "an app on my phone"; older users don't know a website can be one. A plain picture guide closes that.
- **Dependency:** none; manifest and offline page exist.
- **Strengths:** ease of use, price (no app store cut).

### 9. Fan chart and more print styles — S
- **Value:** fan charts are a popular wall print and gift; MyHeritage offers 9 PDF chart formats.
- **Dependency:** none (reuse `lib/pedigree.ts` and `lib/tree-poster.ts`).
- **Strengths:** price (free printing).

### 10. One-page family infographic to share — S
- **Value:** "our family in numbers" image for a reunion or social media. MyHeritage has this in pilot.
- **Dependency:** none (data from `lib/family-facts.ts`).
- **Strengths:** family sharing, ease of use.

### 11. Country flags on the tree — S
- **Value:** quick visual of where branches came from (France, Ireland, Acadia). MyHeritage added this in 2026.
- **Dependency:** none (places already geocoded by `geocode-places`).
- **Strengths:** ease of use.

### 12. Weekly family email (new hints, birthdays, new stories) — M
- **Value:** brings people back without them remembering to log in. Competitor email practice not researched **(unverified)**.
- **Dependency:** email sending service key.
- **Strengths:** family sharing, ease of use.

### 13. Animate a face in a photo — L
- **Value:** emotional and popular, but some people find it unsettling (press called it "creepy or clever").
- **Dependency:** paid video AI service; cost per use unknown.
- **Strengths:** weak fit; lower priority than real voices.

Left out on purpose: record hints from other users' trees, licensed record collections (including Drouin), DNA
matching and ethnicity panels, and newspaper archives. These need licensed data, labs or a large user base.

---

## 5 things Genesis already does better

1. **Price and honest billing.** One free plan and one Pro plan in Canadian dollars ($19 a month or $190 a year by default), cancel in one tap, e-Transfer payments never renew, keep everything if you stop paying — `src/components/PricingPage.tsx` (`PROMISES`, `FREE_FEATURES`). Ancestry and MyHeritage have four to six tiers plus add-ons, and Ancestry's trial charges the card unless cancelled ([Family Tree Magazine](https://familytreemagazine.com/websites/ancestry-com-free/)).
2. **Unlimited free tree, free tree checkup and free records search.** `PricingPage.tsx` promises an unlimited tree on the free plan; `lib/tree-checks.ts` and `TreeCheckup.tsx` give the consistency check and merge free; record hints show their evidence (`lib/record-match.ts`). MyHeritage Basic stops at 250 people and its consistency checker is PremiumPlus ([MyHeritage help](https://www.myheritage.com/help/fi/articles/13130253-millaisia-tilauksia-myheritage-tarjoaa)).
3. **Privacy you can check.** DNA files are read in the browser and never uploaded (`lib/dna.ts`, README); "download everything" makes one zip of data, GEDCOM tree, photos and recordings (`lib/full-export.ts`); row-level security on every user table (`supabase/migrations/`).
4. **Real voices from real relatives, with no account needed.** `AskRelative.tsx` sends Grandma a private link she answers by speaking, with no password; `FamilyInterview.tsx` reads questions aloud and transcribes in fr-CA or en-CA; `VoiceCloning.tsx` keeps a voice only with recorded consent. MyHeritage LiveStory uses generated voices, not the relative's own ([Mixed News](https://mixed-news.com/en/?p=2849)); I found no audio recording in Ancestry's app (unverified).
5. **Made for French Canadian families.** The whole app in Canadian French (`lib/i18n-fr*.ts`), relationship sentences with correct French gender and articles (`lib/relationship-fr.ts`), Canadian history in life stories (`lib/life-story.ts`), links to BAnQ and Library and Archives Canada (`lib/archive-links.ts`), and French sources from Gallica (`_shared/records-connectors.ts`). MyHeritage supports many languages; whether Ancestry.ca has a French site was not confirmed.

Also worth saying: free printable tree poster and storybook (`lib/tree-poster.ts`, `lib/storybook-print.ts`),
while MyHeritage stopped printing posters in 2023 ([MyHeritage sunset notice](https://blog.myheritage.com/2022/12/sunset-notice-for-printing-posters-of-family-tree-charts/)).

---

## Before using any of this in marketing

- `src/components/ComparePage.tsx` still shows "[check current details]" for the competitor columns. Only fill
  those in after checking each company's own pricing and help pages; most figures above come from search
  summaries, not the pages themselves.
- Canadian prices for Ancestry.ca and MyHeritage were not found.
- Check whether Ancestry AI Stories and MyHeritage GAIA are in every plan or only paid ones.
