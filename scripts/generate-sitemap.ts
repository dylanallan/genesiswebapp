import { writeFileSync } from 'fs';
import { glob } from 'glob';
import { resolve } from 'path';

const BASE_URL = process.env.VITE_APP_URL || 'https://your-domain.com';

async function generateSitemap() {
  // Get all routes from your app
  const routes = [
    '/',
    '/about',
    '/contact',
    '/pricing',
    '/features',
    // Add more routes as needed
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${routes
    .map(
      (route) => `
  <url>
    <loc>${BASE_URL}${route}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === '/' ? '1.0' : '0.8'}</priority>
  </url>`
    )
    .join('')}
</urlset>`;

  writeFileSync(resolve(process.cwd(), 'public/sitemap.xml'), sitemap);
  console.log('Sitemap generated successfully!');
}

generateSitemap().catch(console.error); 