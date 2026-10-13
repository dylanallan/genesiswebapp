# Protecting Genesis Heritage from copycats

This is a plain-language guide, not legal advice. For the trademark especially, a one-hour consultation with a Canadian IP lawyer or registered trademark agent is worth it.

## What protects what

| What you want to protect | How | Status |
|---|---|---|
| The app's code, text, designs and ads | **Copyright.** In Canada it exists automatically. Registering it gives you a certificate you can use in court. | Automatic now. Register for $63 (steps below). |
| The name "Genesis Heritage" and the logo | **Trademark.** Stops others using a confusingly similar name for the same kind of service. | Not filed. About $491 plus $149 per extra class. |
| Ideas and features (for example "AI storybooks") | Ideas can't be copyrighted. A patent is possible only for a genuinely new technical method; it costs thousands and takes years. | Usually not worth it. Speed and brand protect you better. |
| Keeping the code secret | Private code repository, no public source maps, proprietary licence | Partly done (see below) |

## Already done in the app

- **Proprietary licence (`LICENSE`).** All rights reserved; no copying, reverse engineering or scraping.
- **Copyright notice.** "© Genesis Heritage. All rights reserved." appears on the sign-in page.
- **Terms of Service.** New sections ban scraping, bulk downloading and copying the app, and state who owns the brand and software.
- **Source maps turned off.** The public website no longer ships the readable original code.
- **AI crawlers blocked.** `robots.txt` blocks AI-training crawlers (GPTBot, CCBot, ClaudeBot, Google-Extended and others).
- **Daily limits.** Record searches are capped per person per day, and AI messages already were, so bots can't use the app to bulk-copy data.
- **Data stays private.** Every person's data is only visible to them (row-level security), checked by automated tests on every change.

## Still to do (only you can)

1. **Make the code private (30 seconds).**
   - Go to github.com/dylanallan/genesiswebapp and open **Settings**.
   - Scroll to the bottom and find **Danger Zone**.
   - Click **Change visibility**, then **Make private**, and confirm.
   - The website keeps working.
2. **Register the copyright ($63, about 10 minutes).** See the next section.
3. **Trademark search, then filing.** See the trademark section below.

## Registering the copyright with CIPO

1. Go to the Canadian Intellectual Property Office (CIPO) site and choose **Copyright, then Register a copyright online**.
2. Create an **ISED account** if you don't have one.
3. Fill in the application:
   - **Title:** Genesis Heritage Pro (family history web application)
   - **Category:** Literary work, which covers computer programs. You do **not** upload the code.
   - **Owner:** your full legal name (or your company's name if you have one), with your address.
   - **Author:** your full legal name. Anything written with AI tools under your direction is generally claimed by you as the person who commissioned and directed it; mention that to a lawyer if it matters to you.
   - **Published?** Yes. **Date and place of first publication:** the date the website first went live, in Canada.
4. Pay $63 by credit card. The certificate usually arrives within days to weeks.
5. Optionally, register the ad images and marketing text as a separate "artistic" or "literary" work in the same way.

## Trademark ("Genesis Heritage" and the logo)

**Be careful: the word "Genesis" is crowded.** Hyundai owns GENESIS marks for cars and has challenged others over the name. A genealogy service is a very different field, which helps, but a professional clearance search is wise before spending money on filing.

Steps:
1. Search the **Canadian Trademarks Database** (CIPO) and the **USPTO** (US) for "Genesis Heritage" and similar names in these Nice classes:
   - **9:** downloadable software
   - **42:** software as a service, which is where genealogy apps sit
   - **45:** genealogical research services
2. If it's clear, file online with CIPO: **$491.06 for the first class plus $149.04 for each extra class** (2026 fees). Classes 42 and 45 are the core.
3. Registration usually takes **12 to 24 months**. You can use the ™ symbol now; ® only after registration.
4. For the US later, file with the USPTO, or use the Madrid Protocol to cover several countries in one application.

## The real moat

Competitors can copy features, but not:
- your families' trust
- your community
- how fast you improve the app

The things that protect Genesis best are:
- the stories, recordings and storybooks families build up over time
- the privacy promise
- shipping improvements faster than the big companies can

## Sources

- [CIPO: copyright registration fees ($63 online)](https://ised-isde.canada.ca/site/canadian-intellectual-property-office/en/node/509)
- [Copyright Regulations fee tariff](https://laws-lois.justice.gc.ca/eng/regulations/SOR-97-457/page-2.html)
- [CIPO: fees for trademarks](https://ised-isde.canada.ca/site/canadian-intellectual-property-office/en/node/220)
- [Protecting software IP in Canada: patent vs copyright](https://lawyerinfo.ca/guides/money-taxes-ip/intellectual-property/how-to-protect-software-intellectual-property-in-canada-patent-vs-copyright/)
- [Hyundai and the Toronto "Genesis" store trademark dispute (Globe and Mail)](https://www.theglobeandmail.com/business/small-business/article-hyundai-lawsuit-genesis-clothing)
