// Renders every ad in ads.json as PNG images: square (feed) and story (Reels / TikTok / Stories).
// Run: node marketing/render-ads.mjs   (uses the Chromium that Playwright already has)
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logo, visuals } from './visuals.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const ads = JSON.parse(readFileSync(join(here, 'ads.json'), 'utf8'));
const template = readFileSync(join(here, 'ad-template.html'), 'utf8');
const formats = [{ name: 'square', cls: 'sq', w: 1080, h: 1080 }, { name: 'story', cls: 'st', w: 1080, h: 1920 }];
const legalFor = (text) => /ancestry/i.test(text)
  ? '<p class="legal">Ancestry is a trademark of its owner. Genesis Heritage is an independent service and is not affiliated with Ancestry.</p>' : '';

mkdirSync(join(here, 'ads'), { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || undefined });
const page = await browser.newPage();
for (const ad of ads) {
  for (const f of formats) {
    const html = template
      .replace('FORMAT', f.cls).replace('EYEBROW', ad.eyebrow).replace('HEADLINE', ad.headline).replace('BODY', ad.body)
      .replace('VISUAL', visuals[ad.visual]).replace('LOGO', logo).replace('CTA', ad.cta)
      .replace('LEGAL', legalFor(ad.headline + ad.body))
      .replace(':root {', `:root { --w:${f.w}px; --h:${f.h}px;`);
    await page.setViewportSize({ width: f.w, height: f.h });
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: join(here, 'ads', `${ad.id}-${f.name}.png`) });
  }
}
// Link-preview image (Facebook, WhatsApp, iMessage...) from the first ad.
const og = ads[0];
await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(template
  .replace('FORMAT', 'og').replace('EYEBROW', og.eyebrow).replace('HEADLINE', og.headline).replace('BODY', og.body)
  .replace('VISUAL', visuals[og.visual]).replace('LOGO', logo).replace('CTA', og.cta).replace('LEGAL', legalFor(og.headline + og.body))
  .replace(':root {', ':root { --w:1200px; --h:630px;'), { waitUntil: 'load' });
await page.screenshot({ path: join(here, '..', 'public', 'og-image.png') });
await browser.close();
console.log(`Rendered ${ads.length * formats.length} images to marketing/ads/`);
