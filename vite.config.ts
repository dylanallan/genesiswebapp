import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
      // Read by browsers when someone installs the app, and by PWABuilder to make the Microsoft Store and Google Play
      // packages (see marketing/store-listing.md).
      manifest: {
        id: '/',
        name: 'Genesis Heritage',
        short_name: 'Genesis',
        description: 'Your family tree, voices, stories and records in one private place. Bilingual, private by default, priced in Canadian dollars.',
        lang: 'en-CA',
        dir: 'ltr',
        start_url: '/dashboard?source=pwa',
        scope: '/',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        orientation: 'any',
        theme_color: '#2E5A44',
        background_color: '#faf7f0',
        categories: ['lifestyle', 'education', 'social'],
        launch_handler: { client_mode: ['navigate-existing', 'auto'] },
        icons: [
          { src: '/icons/icon-any-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-any-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icons/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        screenshots: [
          { src: '/screens/interview.png', sizes: '1205x636', type: 'image/png', form_factor: 'wide', label: 'Interview a relative and keep their voice' },
          { src: '/screens/tree.png', sizes: '1205x1296', type: 'image/png', form_factor: 'narrow', label: 'Your family tree' },
          { src: '/screens/life-story.png', sizes: '1205x1583', type: 'image/png', form_factor: 'narrow', label: 'A life story from the tree' },
          { src: '/screens/research.png', sizes: '1205x1691', type: 'image/png', form_factor: 'narrow', label: 'Free record search' },
        ],
        shortcuts: [
          { name: 'My family tree', short_name: 'Tree', url: '/dashboard?feature=family-tree-chart&source=shortcut', icons: [{ src: '/icons/shortcut-96x96.png', sizes: '96x96', type: 'image/png' }] },
          { name: 'Record a story', short_name: 'Story', url: '/dashboard?feature=family-interview&source=shortcut', icons: [{ src: '/icons/shortcut-96x96.png', sizes: '96x96', type: 'image/png' }] },
          { name: 'Ask a relative', short_name: 'Ask', url: '/dashboard?feature=ask-relative&source=shortcut', icons: [{ src: '/icons/shortcut-96x96.png', sizes: '96x96', type: 'image/png' }] },
        ],
      },
      workbox: {
        // Only the app shell is downloaded ahead of time (the first page, shared libraries, French text, icons), so a
        // phone on mobile data is not made to fetch every screen. Other screens are kept once they have been opened.
        // Family data is never cached by the service worker.
        globPatterns: ['index.html', 'assets/index-*.{js,css}', 'assets/*-vendor-*.js', 'assets/i18n-fr-*.js', 'icons/*.png', '*.ico'],
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/assets/'),
            handler: 'CacheFirst', // file names change with every release, so a kept copy is never stale
            options: { cacheName: 'genesis-screens', expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 60 } },
          },
        ],
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        // Libraries every screen needs, in their own long-cached files. Everything else is split per screen and loads
        // only when that screen opens.
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js']
        }
      }
    },
    sourcemap: false, // no source maps in production: they would hand out readable source code
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      },
      mangle: { toplevel: true }, // shorter, less readable names everywhere, not only inside functions
      format: { comments: false }
    }
  },
  server: {
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; media-src 'self' blob: data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' ws: http://localhost:* http://127.0.0.1:* https://*.supabase.co wss://*.supabase.co; frame-src 'none'; worker-src 'self' blob:; manifest-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
      'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(), interest-cohort=()',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  }
});