# Where can we sell Genesis Heritage Pro?

Checked on **17 October 2026**. Fees and rules change often, so check each site again before you sign anything.

This guide answers two questions:

- **Part A:** Where can we sell **subscriptions** to families? (Today, Pro is $19 CAD a month or $190 a year.)
- **Part B:** If one day we want to sell **the whole app or business**, where and how?

**How sure are we?** Apple's rules below come from Apple's own guideline page, which we read directly. Several other official sites (Google's help pages, Acquire.com, BetaList, AppSumo, FE International) would not open from our research tool. For those, the numbers come from search results that quote the official page, or from review sites. Each item says which. **"Not confirmed"** means you should ask the company before you rely on it. We did not make up any numbers.

---

## Top 5 to do first

1. **Launch on our own website first, with PayPal and Interac e-Transfer.** No app store takes a cut there. The app already works as a web app that people can "install" from their browser. App stores can come later.
2. **Pick 3 or 4 genealogy societies and offer a deal: their members get a discount, and the society gets a share or a free talk.** Start with Quebec (FQSG member societies) and Ontario Ancestors. A table at a society conference is cheap: Ontario Ancestors charged commercial exhibitors $125 in 2024.
3. **Get on Product Hunt and BetaList, both free.** Use the waitlist to bring early support on launch day. BetaList is free but slow (about 2 months), so submit now.
4. **Get ready for Google Play next, and for Apple after that.** Google Play costs a one-time $25 USD and takes 15% of subscriptions. Apple costs $99 USD a year, takes 15% for small developers, and in Canada makes you sell Pro through Apple's own payment system. Both stores also want the app to feel like a real app, not just a website in a box.
5. **Keep clean records from day one:** monthly revenue, how many people cancel, signed papers showing we own the code, and no "lifetime deals". This is what a buyer checks first if we ever sell the business, and it costs nothing to start now.

---

# Part A: Where to sell subscriptions

## A1. Our own website (the best margin)

- This is where we keep the most money. Payments go through PayPal and Interac e-Transfer, with no app-store cut.
- Phones can add the web app to the home screen, so people can use it without any app store.
- Every app-store and partner link below should, where the rules allow, bring people back here.

## A2. Apple App Store (iPhone and iPad)

**How to get there:** wrap the web app with a tool such as **Capacitor** to make an iPhone app.

**Main rules (from Apple's App Review Guidelines, read directly on 17 Oct 2026):**

- **Rule 3.1.1:** to unlock features or a subscription **inside** the iPhone app, you **must use Apple's in-app purchase**.
- **Rules 3.1.1(a) and 3.1.3:** the **United States** App Store is now an exception. US apps may show buttons and links to pay on your website. **Canada is not an exception.** In the Canadian store, the app may not include buttons, links or other "calls to action" that send people to pay outside Apple.
- **Rule 3.1.3(b), multiplatform:** people who already paid on our website may sign in and use Pro in the iPhone app, **as long as Pro can also be bought through Apple's in-app purchase inside the app.**
- **Rule 3.1.3(a), "reader" apps:** this exception covers only magazines, newspapers, books, audio, music and video. A genealogy app does not fit it.
- **Rule 3.1.3:** we may still email our own users about paying on our website. We just can't push them to do it from inside the app.
- **Gift subscriptions:** digital gift cards or vouchers sold **inside** the app must use Apple's in-app purchase (rule 3.1.1).
- **Rule 4.2:** the app must offer more than "a repackaged website". Plain website wrappers get rejected. Add real phone features, such as voice recording that works with the microphone and offline, push reminders, and photo-library and camera access for scanning.
- **Rule 4.8:** our app offers **Google sign-in**. Apple then requires a second equal option that keeps data private, such as Sign in with Apple. The exception is if the iPhone app uses only our own email login.
- **Rule 5.1.1(v):** if people can make an account in the app, they must also be able to **delete it from inside the app**.

**Fees:**

| Item | Amount | Source |
|---|---|---|
| Developer membership | $99 USD a year (CAD price not confirmed) | [Apple forum / Adalo guide](https://studio.adalo.com/blog/apple-developer-program-guide) |
| Commission, standard subscription | 30% in a subscriber's first year, then 15% | [Adapty guide 2026](https://adapty.io/blog/app-store-small-business-program/) (third-party) |
| Commission, Small Business Program (under $1M USD proceeds a year) | 15% from the start | Same as above |
| Sales tax | Apple sells as the merchant and handles Canadian GST/HST (current process not confirmed) | [Apple developer forum](https://developer.apple.com/forums/thread/773230) |

**US court case, still open (only matters for US customers):** in April 2025 a judge ordered Apple to stop charging any fee on purchases made through outside links in US apps. In December 2025 the appeals court said Apple may charge some fee tied to its real costs. The US Supreme Court agreed to hear Apple's appeal (June 2026), and Apple filed its brief on 14 Sept 2026. No final ruling yet. Sources: [The Next Web](https://thenextweb.com/news/supreme-court-apple-epic-contempt-app-store-commission), [9to5Mac, 14 Sept 2026](https://9to5mac.com/2026/09/14/apple-files-supreme-court-brief-challenging-contempt-ruling-in-epic-case/), [Oyez case page](https://www.oyez.org/cases/2026/25-1311). **None of this changes the rules for the Canadian store.**

**Canada:** we found **no** Canadian rule change or Competition Bureau decision that lets Canadian iPhone apps link to outside payment. One guide says the US-style link is still a violation in Canada ([AppStoreReview guide](https://appstorereview.app/guides/app-store-external-payment-links-digital-purchases)). Not confirmed by an official Canadian source.

**What this means for us:** on iPhone in Canada we lose 15% of Pro sales made in the app, and we can't use Interac or PayPal there. One option: keep Pro the same price everywhere and accept the 15%. Another: charge a bit more in the app, which Apple allows. Either way, keep our website as the main place to buy.

Sources: [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/), [MobiLoud on web-wrapper rejections](https://www.mobiloud.com/blog/app-store-review-guidelines-webview-wrapper).

## A3. Google Play (Android)

**How to get there:** wrap the web app as a **Trusted Web Activity (TWA)** with Google's free **Bubblewrap** tool, or use Capacitor. Google Play now wants an Android App Bundle (.aab) file ([Vaadin guide](https://vaadin.com/blog/submitting-a-pwa-to-google-play-store-using-bubblewrap)).

**Fees:**

| Item | Amount | Source |
|---|---|---|
| Developer account | $25 USD, one time | [Vaadin guide](https://vaadin.com/blog/submitting-a-pwa-to-google-play-store-using-bubblewrap), [AppMaster docs](https://appmaster.io/docs/create-google-developer-account) |
| Subscriptions (markets still on the old fees, which we believe includes Canada) | **15%** | [Google Play Console Help: Service fees](https://support.google.com/googleplay/android-developer/answer/112622?hl=en) (as quoted in search results; the page would not open directly) |
| New fees in the US, UK and Europe from 30 June 2026 | 10% service fee plus 5% if you use Google's billing (15% in all) | Same page; [Android Developers Blog, March 2026](https://android-developers.googleblog.com/2026/03/a-new-era-for-choice-and-openness.html) |
| Rest of the world | One source says the new fees reach the rest of the world by **30 Sept 2027**. **Canada is not named.** | [Adapty](https://adapty.io/blog/google-play-billing-changes-subscriptions-fees/) (third-party, not confirmed) |

**Paying another way:** in the US, UK and Europe, Google now lets apps use their own billing or link to a website. **For Canada, we could not confirm** whether you can skip Google's billing yet. Until we confirm it, plan to use Google Play Billing inside the Android app.

## A4. Microsoft Store (Windows computers)

- **Free for individual developers** since Sept 2025 (company accounts reportedly still pay a one-time $99 USD).
- **Web apps (PWAs) are accepted.** The free **PWABuilder** tool packages them.
- **Non-game apps may use their own payment system and keep 100% of the revenue.** This is the friendliest store for us.
- Many of our users (older family historians) use Windows computers, so this is a good, low-cost extra channel.
- Sources: [Microsoft Windows Developer Blog, 10 Sept 2025](https://blogs.windows.com/windowsdeveloper/2025/09/10/free-developer-registration-for-individual-developers-on-microsoft-store/), [PWABuilder blog](https://blog.pwabuilder.com/posts/publish-your-pwa-to-the-microsoft-store-on-windows-for-free), [BetaNews](https://betanews.com/2025/09/12/microsoft-helps-out-app-developers-by-wiping-out-store-fees/).

## A5. Amazon Appstore

- **Closed on regular Android phones on 20 Aug 2025.** It still runs on Amazon **Fire tablets and Fire TV**.
- Low priority. Consider it only if many users have Fire tablets.
- Sources: [Android Authority](https://www.androidauthority.com/amazon-shuts-down-android-app-store-3528170), [Android Central](https://www.androidcentral.com/apps-software/amazon-will-suspend-support-for-its-appstore-on-android).

## A6. Samsung Galaxy Store

- No sign-up fee and no yearly fee.
- Since 15 May 2025 Samsung keeps **15% of subscriptions** (and 20% of other sales) made through Samsung Checkout.
- You need "commercial seller" status. **We could not confirm** whether Samsung accepts a wrapped web app.
- Low priority: Samsung phones can already use Google Play.
- Sources: [Samsung Developer news, 13 Mar 2025](https://developer.samsung.com/sdp/news/en/2025/03/13/new-revenue-share-model-for-galaxy-store), [Samsung Seller Portal guide](https://developer.samsung.com/galaxy-store/learn-about-seller-portal.html).

## A7. Launch websites: Product Hunt, BetaList, AppSumo

**Product Hunt** ([SaaS City guide](https://saascity.io/directories/product-hunt), [Launchlist guide](https://app.getlaunchlist.com/blog/how-to-launch-on-product-hunt-2026))

- **Free to launch.** Launches go live at 12:01 am Pacific time. You can relaunch a product only once every 6 months, unless Product Hunt approves an earlier one.
- Product Hunt staff choose which launches get "featured" on the homepage, and fewer get featured than before.
- **Don't ask people to "upvote us"; Product Hunt forbids it.** Instead, ask the waitlist to try the app and leave honest comments.
- Product Hunt's audience is mostly tech people, not our main buyers. Its real value is press, links back to our site, and early fans.

**BetaList** ([BetaList support page](https://betalist.com/support) as quoted in search, [Flowjam guide](https://www.flowjam.com/blog/beta-list-submission-guide-2024-get-featured-fast))

- **Free**, but review can take a few weeks, and being featured typically takes **about 2 months** after acceptance.
- A paid fast review is offered. Guides say it costs **$129 USD** (price not confirmed on BetaList's own page). If rejected, you get a full refund.
- It suits us because we are still before launch. **Submit now.**

**AppSumo (lifetime deals)**

- **How it works:** people pay once and get the app "forever".
- **What AppSumo keeps:** **not confirmed.** Review sites say AppSumo keeps up to **70%** on its main marketplace. Some say the split is reversed (you keep 70%) if you bring your own buyers ([Freemius](https://freemius.com/blog/appsumo-marketplace-breakdown/), [Autoposting.ai review](https://autoposting.ai/blog/appsumo-review)). Ask AppSumo directly.
- **Pros:** quick cash, lots of early users and reviews.
- **Cons:**
  - We would support those users forever while they pay nothing more. Our AI storybooks and voice recordings cost us money every time they are used.
  - Founders say lifetime deals **lower the price a buyer will pay for the business** ([Indie Hackers](https://www.indiehackers.com/post/did-you-consider-launching-on-appsumo-a4f0e060d1)).
  - One report says AppSumo's revenue has fallen sharply ([PPC Land](https://ppc.land/appsumos-revenue-crashes-50-as-lifetime-deal-model-faces-existential-crisis/), single source).
- **Our advice:** skip it, or offer only a small, capped deal (for example a limited number of "founding family" spots on our own site) with clear AI limits.

## A8. Genealogy societies and RootsTech

**RootsTech** (run by FamilySearch, Salt Lake City, **4–6 March 2027**)

- Sponsor and exhibitor packages in 2026 ran from **$1,600 to $60,000 USD**. The onsite package included a 10x20-foot booth and one class session. **Prices for 2027 are not published.** Email exhibitor@rootstech.org.
- Sources: [FamilySearch sponsor page](https://www.familysearch.org/ja/rootstech/expohall/sponsor), [Deseret News, 23 Sept 2026](https://www.deseret.com/faith/2026/09/23/rootstech-2027-registration-keynote-speakers/).
- RootsTech also runs a large free online event. Giving an online talk can bring attention without paying for a booth.

**Genealogy societies (the best fit for our users)**

- **What to offer:**
  - a member discount;
  - a free talk such as "How to record Grandma's stories";
  - a referral share for the society;
  - a society group plan.
- **Ontario Ancestors (Ontario Genealogical Society):** its 2024 conference charged **$125 for a commercial exhibitor table**, and the event expected more than 600 people ([OGS conference 2024](https://conference2024.ogs.on.ca/?p=183)). 2026/2027 prices not found.
- Most societies ban selling in their groups and newsletters unless you ask first. Always ask the society.

## A9. Canadian channels

**Quebec: Fédération québécoise des sociétés de généalogie (FQSG)**

- Founded in 1984. It had **59 member societies** in 2008, in Quebec, Ontario and the US. A December 2025 brief says it runs the yearly **Semaine nationale de la généalogie**, with member societies and partners. Sources: [FQSG brief to Quebec Finance, 2026–27 budget](https://cdn-contenu.quebec.ca/cdn-contenu/adm/min/finances/publications-adm/Consultations_prebudgetaires/2026-2027/ONLC_FQSG.pdf), [Cap-aux-Diamants article (Érudit)](https://erudit.org/fr/revues/cd/1993-n34-cd1043033/8420ac.pdf).
- **Why this matters:** MyHeritage bought **MesAieux.com**, a Quebec French-Canadian genealogy site, in Sept 2024 ([Business Wire](https://www.businesswire.com/news/home/20240906232778/en/MyHeritage-Acquires-MesAieux.com)). Quebec family history is valuable, and our full French version is an advantage.
- **Idea:** sponsor or give a French-language talk during the Semaine nationale de la généalogie. Offer FQSG member societies a discount code.

**Libraries**

- Many Canadian libraries already pay for Ancestry Library Edition (sold through ProQuest), often for **in-library use only**. Halifax Public Libraries is one example ([Halifax Public Libraries](https://www.halifaxpubliclibraries.ca/resource/ancestry-library-edition/), [ProQuest ALE](https://about.proquest.com/es/products-services/ale/)).
- Selling a library edition is a bigger project, so it is a later step. A good first step: offer free "Record your family's stories" workshops at libraries. Libraries like free community programs, and people sign up for our free plan there.
- We found no Canadian library group-buying (consortium) deal for genealogy tools. Not confirmed.

## A10. Gifts and holiday markets

- **Our selling point is the gift:** "Give Mom a book of her own stories." The storybook is already described as a gift in the app.
- **Busy times:** Mother's Day (May), Father's Day (June), and Christmas and holidays (Nov–Dec).
- **Sell gift subscriptions or gift codes on our own website** (PayPal or Interac). Inside the iPhone app, digital gift cards must go through Apple ([Apple rule 3.1.1](https://developer.apple.com/app-store/review/guidelines/)).
- **Local holiday craft fairs and seniors' centre events:** a small table with printed sample storybooks and a QR code. Costs vary by event (no data collected).
- Our Partners page already lists "photo restoration, printing, memory books and gift shops" and "gift-subscription arrangements" as partner types.

## A11. Affiliate programs (people who earn money for sending us customers)

**What our competitors pay their affiliates (not confirmed, from affiliate directories):**

- Ancestry: about **up to 20%** in the US and 4% in the UK ([FlexOffers: Ancestry](https://www.flexoffers.com/affiliate-programs/ancestry-com-affiliate-program/), [FlexOffers: Ancestry Canada](https://www.flexoffers.com/affiliate-programs/ancestry-canada-affiliate-program)).
- MyHeritage: about **8%** on DNA kits, or a small fixed amount per trial ([FlexOffers: MyHeritage UK](https://www.flexoffers.com/affiliate-programs/myheritage-uk-affiliate-program/)).
- **We can beat them**, for example with 25–30% recurring for the first year. That is our own choice, not a market number.

**Who to recruit:** genealogy bloggers, YouTubers, podcast hosts, professional genealogists and society newsletters.

**Tools:** because we use **PayPal**, we need affiliate software that works with PayPal:

- **Tapfiliate** says it has a PayPal integration ([Tapfiliate PayPal page](https://tapfiliate.com/integrations/paypal)).
- Tolt and FirstPromoter can pay affiliates by PayPal. Their tracking of **PayPal subscriptions** is not confirmed.
- Interac payments can't be tracked automatically. Give each affiliate a **discount code** instead.

## A12. Facebook genealogy groups

- Groups are large and active, but **most ban self-promotion and ads** ([FamilySearch blog](https://familysearch.org/blog/en/finding-ancestors-facebook), [FamilySearch community self-promotion policy](https://community.familysearch.org/en/discussion/110928/familysearch-community-self-promotion-policy)).
- **The safe way:**
  1. Read each group's "Rules" or "About" section.
  2. **Ask an admin before posting anything about Genesis.**
  3. Use only "promo day" threads if the group has them.
  4. Help people first (for example, with GEDCOM questions or tips for recording relatives).
  5. Never post private details about living people.
- Better still: start **our own Facebook group** (for example "Record your family's stories, Canada / Racontez vos histoires de famille").

---

# Part B: Selling the app or business later

## B1. Marketplaces and brokers

All prices in USD. "Multiple" means: sale price ÷ yearly profit (or revenue).

| Site | Seller fees | Minimum they want | SaaS prices they publish | Sources (checked 17 Oct 2026) |
|---|---|---|---|---|
| **Acquire.com** (Andrew Gazdecki's company) | Listing fee **$25, $50 or $100 a month** by asking price, plus a closing fee of **8% (under $250K), 7% ($250K–$1M), 6% (over $1M)**. Older reviews say "4%, no listing fee", but that predates an April 2024 change. | "Generally" lists only startups with revenue. A few pre-revenue SaaS exceptions. Its help page suggests reaching **$25K yearly revenue** before listing. | Jan 2026 report: closed SaaS sales had a **median of 3.9x yearly profit** (in both 2024 and 2025). Its guidance says many SaaS deals sell for **1x–3x yearly revenue** or 3x–5x yearly profit. | [Dealstonic, fees checked 24 Sept 2026](https://dealstonic.com/cost-to-sell-app-saas-acquire-flippa/), [CT Acquisitions](https://ctacquisitions.com/microacquire-acquire-com-platform-guide/), [Acquire help: seller FAQs](https://help.acquire.com/seller-faqs-1), [Acquire help: rejected listings](https://help.acquire.com/why-was-my-startup-listing-rejected), [Acquire multiples report, Jan 2026](https://blog.acquire.com/acquire-com-biannual-acquisition-multiples-report-jan-2026/), [Acquire SaaS multiples](https://blog.acquire.com/saas-valuation-multiples/) |
| **Flippa** | Success fee **10% (under $50K), 7.5% ($50K–$100K), 5% (over $100K)**. Listing fee about **$29–$599** by package (reviews differ). Broker option costs $399–$1,499 upfront plus a success fee. | Takes almost anything, including small and early projects. | H1 2026 report: SaaS sold for an **average 2.47x profit** (top quarter of deals: 4.06x). Owner-run SaaS: about **2.5x–4.5x profit**. | [Flippa blog: valuation multiples](https://flippa.com/blog/digital-business-valuation-multiples/), [Flippa: how to value a SaaS](https://flippa.com/blog/how-to-value-a-saas-company/), [CPI Inflation Calculator review, checked 21 Sept 2026](https://cpiinflationcalculator.com/flippa-review/), [TruePick review](https://truepick.net/online-business-marketplaces/flippa-review/) |
| **Empire Flippers** (broker) | Fee on a sliding scale: **15% of the first $700K**, 8% from $700K to $5M, lower above that. Listing fee: sources disagree ($297 vs none). | About **$2,000 a month average profit** over 12 months (not confirmed in 2026). | Since 8 Sept 2026 it shows **yearly** multiples. Older scoreboard (all business types, not just SaaS): about **26x monthly profit, which is about 2.2x yearly**. Its SaaS listings asked about 29x–41x monthly, roughly 2.4x–3.4x yearly. | [Empire Flippers: switching to annual multiples](https://empireflippers.com/switching-to-annual-multiples/), [Empire Flippers scoreboard](https://empireflippers.com/scoreboard/), [ExitBid review](https://exitbid.io/blog/empire-flippers-review-2026), [Investors Club review](https://investors.club/empire-flippers-review/) |
| **FE International** (broker, larger deals) | Its own pricing page, as quoted in search: **5% (under $250K), 4% ($250K–$1M), 3% (over $1M)**. Some reviews say 10–15%. The page would not open for us, so ask them. No upfront fees, free valuation. | Usually businesses worth **$100K or more** with at least 12 months of steady revenue (reviews). | No SaaS multiples table found. It values businesses under $10M on yearly owner profit (SDE) and larger ones on EBITDA. | [FE seller pricing](https://www.feinternational.com/pricing/seller), [FE: SaaS metrics](https://www.feinternational.com/blog/saas-metrics-value-saas-business), [ExitBid review](https://exitbid.io/blog/fe-international-review-2026) |
| **Microns.io** (small startups) | Microns says **free to list and no commission**. One other site claims 10%/8%/6%. Not confirmed. Buyers pay about $299 a year. | Small projects, roughly **$1K to $1M** asking price. No revenue minimum found. | No multiples published that we found. | [Microns blog](https://microns.io/blog/microns-tiny-acquisitions-alternative-best-online-startup-marketplace), [Microns sign-up page](https://microns.io/signup), [TrustMRR comparison](https://trustmrr.com/compare/trustmrr-vs-microns) |
| **Tiny Acquisitions** (now **Little Exits**, by Stephen Campbell, *not* Gazdecki) | **Not found.** | Projects up to **$100K**. Pre-revenue projects allowed. The new name, Little Exits, describes projects under about $5K. | None found. | [Mercury blog](https://mercury.com/blog/sell-a-business-for-under-1m), [Tiny Acquisitions blog](https://blog.tinyacquisitions.com/tiny-acquisitions-a-microacquire-alternative/), [Indie Hackers](https://www.indiehackers.com/post/tiny-acquisitions-7331431bde) |

**In plain words:**

- Small online software businesses like ours usually sell for about **2x to 4x one year's profit**, or about **1x to 3x one year's revenue**.
- **Example:** if Genesis made $50,000 profit in a year, a fair range might be $100,000 to $200,000. This is an example, not a promise.
- Growth, low cancellations and clean paperwork push the price up.
- Big public software companies sell for more, but those numbers don't apply to a business our size.
- **Which site when:**
  - Under about $100K: Flippa or Microns.
  - $100K to $1M with real revenue: Acquire.com.
  - Larger, profitable deals: Empire Flippers or FE International.

## B2. Likely buyers in genealogy and family memories

These are companies that might want to buy Genesis. Nobody has shown interest. This list only shows who has bought similar companies before.

| Possible buyer | Why they might want Genesis | Evidence |
|---|---|---|
| **MyHeritage** (owned by private-equity firm Francisco Partners since 2021) | Buys smaller genealogy sites, including **MesAieux.com (Quebec, Sept 2024)**. That was its 13th acquisition, and it also bought Geni and Filae. Our French-Canadian users and content fit what it has bought before. | [Business Wire, MesAieux](https://www.businesswire.com/news/home/20240906232778/en/MyHeritage-Acquires-MesAieux.com), [Francisco Partners](https://www.franciscopartners.com/media/myheritage-to-be-acquired-by-leading-private-equity-firm-francisco-partners) |
| **Ancestry** (owned by Blackstone) | Bought Geneanet (France) in 2021 and ProGenealogists earlier. | [Tracxn: Ancestry acquisitions](https://tracxn.com/d/acquisitions/acquisitions-by-ancestry/__8HmCAGxg2xzL0uZO-4YL--Q-IKV0zKMrGDOKCTlHhgg), [Gizmodo](https://gizmodo.com/worlds-biggest-landlord-buys-worlds-biggest-genealogy-w-1844630685) |
| **Findmypast / DC Thomson Family History** (UK, family-owned DC Thomson) | Bought Mocavo (US) in 2014. Has partnered with FamilySearch. | [FamilySearch blog](https://www.familysearch.org/en/blog/dc-thomson-family-history-and-familysearch-org-announce-new-partnership), [DC Thomson](https://www.dcthomson.co.uk/about/) |
| **Story and memory companies** (Storyworth, Remento and similar) | Our voice recording, "ask a relative" links and AI storybooks overlap with what they sell. We found **no** recent purchases by them. One competitor's blog says HereAfter AI shut down in Aug 2026, which shows this market is moving fast (not confirmed elsewhere). | [PitchBook: StoryWorth](https://pitchbook.com/profiles/company/58136-95), [Afterlife.ai](https://www.afterlife.ai/best-life-story-app) |
| **Canadian or Quebec heritage organizations** | Possible partners rather than buyers. FamilySearch is a non-profit, so a partnership is more likely than a purchase. | (none found) |

## B3. What buyers check before they buy

Sources: [Flippa due-diligence guide](https://flippa.com/blog/buying-a-saas-business-the-complete-guide-to-due-diligence/), [BigIdeasDB, 615 Acquire listings](https://bigideasdb.com/saas-acquisition-due-diligence-checklist), [ExitBid checklist](https://exitbid.io/blog/saas-due-diligence-checklist), [FE International: SaaS metrics](https://www.feinternational.com/blog/saas-metrics-value-saas-business).

1. **Monthly recurring revenue (MRR) and its trend.** Buyers want 12–24 months of history, checked against the **payment system itself** (PayPal reports), not a spreadsheet. **Interac payments are harder to prove,** so record every Interac payment with a date, customer ID and plan.
2. **Churn: how many customers cancel each month,** counted both as people and as dollars, and whether newer customers stay longer.
3. **No single big customer.** A warning sign is one customer bringing in more than about 15% of revenue. This could matter for society or library deals.
4. **We own the code and the name (IP).** We need signed papers from every contractor or helper saying they give us the rights to their work. Without them, the rights may stay with the person who made it. We also need to check that the open-source licences we use are respected.
5. **Clean, documented code** that another team can run. Tests and the LAUNCH.md checklist help here.
6. **Business assets are in the business's name,** not one person's: domain, Supabase, PayPal, app-store accounts, email, social accounts.
7. **The business can run without the founder,** with written steps for daily tasks.
8. **Privacy and legal records:** privacy policy, consent for recordings of living relatives, Canadian privacy law (PIPEDA, and Quebec Law 25). Being privacy-first is a selling point here, but only if it is written down and followed.
9. **No lifetime-deal debt.** Lots of lifetime users who will never pay again lower the price.
10. **Running costs per user,** especially AI and storage costs, so the buyer can see the profit margin.

---

## What we could not confirm (ask before relying on it)

- Apple's membership price in CAD, and whether Canada will get any outside-payment rule.
- Google Play's date for the new fees in Canada, and whether apps can skip Google billing in Canada.
- AppSumo's current revenue split.
- BetaList's current fast-review price ($129 USD is from guides).
- FE International's real fee (its own page says 3–5%, reviews say 10–15%).
- Microns' commission, and Little Exits' fees.
- Empire Flippers' 2026 minimum profit and listing fee.
- RootsTech 2027 booth prices, and 2026/2027 prices for Ontario Ancestors and FQSG events.
- Whether Samsung Galaxy Store accepts wrapped web apps.

**Note on sources:** our research tool could not open several official websites directly (Google help pages, Acquire.com, BetaList, AppSumo, FE International, Microns). Those numbers come from search results quoting the official page, or from review sites. Some review sites run competing marketplaces, so they may be biased.
