// Writes public/sitemap.xml (and points robots.txt at it) before each build.
// Only public, crawlable pages are listed; everything else requires sign-in.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = (process.env.SITE_URL || process.env.URL || 'https://example.com').replace(/\/$/, ''); // Netlify sets URL
const pages = ['/', '/pricing'];
const today = new Date().toISOString().slice(0, 10);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${site}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`;
writeFileSync(join(root, 'public', 'sitemap.xml'), xml);

const robotsPath = join(root, 'public', 'robots.txt');
const robots = readFileSync(robotsPath, 'utf8').replace(/^Sitemap:.*$/m, '').trimEnd();
writeFileSync(robotsPath, `${robots}\nSitemap: ${site}/sitemap.xml\n`);
console.log(`sitemap.xml written for ${site} (${pages.length} pages)`);
