import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

export default defineConfig({
  base: '/app/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['kokoro-js'],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        // webp included so the core symbol vocabulary (now WebP) is available
        // offline. The large character art is kept OUT of precache via the
        // '**/characters/**' ignore below and served on demand instead.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,json}'],
        // PAY-01: do NOT precache the character art (~148 MB of emotion PNGs +
        // sprite sheets). Precaching forced every device to download all of it
        // on first load — catastrophic on metered mobile data. These are now
        // fetched on demand and kept via the CacheFirst runtime rule below.
        globIgnores: [
          '**/tts.worker-*.js',
          '**/kokoroWorker-*.js',
          '**/*.wasm',
          '**/*.onnx',
          '**/characters/**',
        ],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            // PAY-01: character art is downloaded only when actually shown,
            // then cached so it works offline thereafter.
            urlPattern: /\/characters\/.*\.(?:png|webp|jpe?g)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'character-art',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/static\.arasaac\.org\/pictograms\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'arasaac-symbols',
              expiration: { maxEntries: 2000, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/api\.arasaac\.org\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'arasaac-api',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 5,
            },
          },
          // Kokoro model files — DO NOT cache with Workbox.
          // kokoro-js uses its own Cache API / IndexedDB internally.
          // Workbox CacheFirst was intercepting downloads and breaking
          // progress reporting (stuck at 0%).
        ],
        navigateFallback: '/app/index.html',
        // OFF-11: the app is served under /app/, so deny the real data/route
        // paths (data fetches must never fall back to index.html).
        navigateFallbackDenylist: [/^\/app\/api\//, /^\/api\//, /^\/admin\//, /^\/terms/],
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: false,
      devOptions: {
        enabled: false,
      },
    }),
  ],
  build: {
    sourcemap: false,
    target: ['es2020', 'safari15', 'chrome110'],
    outDir: 'dist/app',
  },
  server: {
    port: 5174,
  },
})
