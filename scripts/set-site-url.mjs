#!/usr/bin/env node
// Moves every public link to a new web address in one go (for example when the app gets its own domain).
// Usage: node scripts/set-site-url.mjs https://genesisheritage.ca
// Changes the page metadata, sitemap, robots.txt, guides, marketing drafts and the daily health check.
// Afterwards: add the new address to allowed_origins and site_url in app_settings, and to Supabase Auth URLs.
import fs from 'node:fs';
import path from 'node:path';

const OLD = 'https://genesisheritage.netlify.app';
const next = (process.argv[2] ?? '').replace(/\/$/, '');
if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(next)) {
  console.error('Give the new address, like: node scripts/set-site-url.mjs https://genesisheritage.ca');
  process.exit(1);
}

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const places = ['index.html', 'public', 'marketing', 'scripts/generate-sitemap.ts', '.github/workflows/daily-health.yml',
  'supabase/functions/geocode-places/index.ts'];
const textFile = /\.(html|md|txt|xml|ts|yml|json)$/;
const walk = (p) => fs.statSync(p).isDirectory() ? fs.readdirSync(p).flatMap((f) => walk(path.join(p, f))) : [p];

let changed = 0;
for (const file of places.flatMap((p) => walk(path.join(root, p))).filter((f) => textFile.test(f))) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.includes(OLD)) continue;
  fs.writeFileSync(file, text.split(OLD).join(next));
  console.log('updated', path.relative(root, file));
  changed++;
}
console.log(changed ? `${changed} files now use ${next}.` : 'Nothing to change.');
