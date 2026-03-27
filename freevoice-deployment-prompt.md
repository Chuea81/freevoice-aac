# FreeVoice AAC — Deployment, Launch & Distribution Automation
## Claude Code Prompt — Everything That Can Be Automated

---

Read `freevoice-prd.md` before starting. This prompt covers every deployment,
CI/CD, PWA, and distribution task that Claude Code can build without manual
intervention. Tasks requiring human credentials or manual steps are clearly
marked with 🧑 MANUAL.

Work through each section in order. Do not skip sections.

---

## Section 1 — GitHub Actions CI/CD Pipeline

### 1.1 Build and Deploy to GitHub Pages

Create `.github/workflows/deploy.yml`:

```yaml
name: Build & Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: write
  pages: write
  id-token: write

jobs:
  # ── Run on every push and PR ──────────────────────────────────
  build-and-test:
    name: Build & Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check
        continue-on-error: false

      - name: Lint
        run: npm run lint
        continue-on-error: false

      - name: Build
        run: npm run build
        env:
          NODE_ENV: production

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 7

  # ── Deploy only on push to main ───────────────────────────────
  deploy:
    name: Deploy to GitHub Pages
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - name: Download artifact
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          cname: freevoice.app   # 🧑 MANUAL: Change to your actual domain
          force_orphan: true     # Clean deploy — no history bloat
```

### 1.2 Pull Request Preview Deployments

Create `.github/workflows/preview.yml`:

```yaml
name: PR Preview

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  preview:
    name: Deploy Preview
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Build with preview base path
        run: npm run build
        env:
          NODE_ENV: production
          VITE_BASE_URL: /freevoice-preview-${{ github.event.number }}/

      - name: Deploy PR preview
        uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
          destination_dir: preview/pr-${{ github.event.number }}
          keep_files: true

      - name: Comment preview URL on PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 🔍 Preview Deployment\n\n✅ Preview available at:\n**https://shellcraftlabs.github.io/freevoice/preview/pr-${{ github.event.number }}/**\n\nThis preview will be available until the PR is merged or closed.`
            })
```

### 1.3 Dependency Security Audit

Create `.github/workflows/security.yml`:

```yaml
name: Security Audit

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9am UTC
  push:
    paths:
      - 'package.json'
      - 'package-lock.json'

jobs:
  audit:
    name: npm audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - name: Run security audit
        run: npm audit --audit-level=high
      - name: Check ARASAAC license compliance
        run: |
          echo "Checking for prohibited symbol sources..."
          # Fail if PCS, SymbolStix, or Widgit are found as dependencies
          if npm ls | grep -iE "pcs|symbolstix|widgit|mayer-johnson"; then
            echo "ERROR: Prohibited symbol library detected in dependencies"
            exit 1
          fi
          echo "✅ No prohibited symbol sources detected"
```

---

## Section 2 — PWA Manifest and Service Worker

### 2.1 PWA Manifest

Create `public/manifest.json`:

```json
{
  "name": "FreeVoice AAC",
  "short_name": "FreeVoice",
  "description": "Free AAC communication app for nonverbal and minimally verbal children. No subscription. No account. Works offline.",
  "start_url": "/",
  "display": "standalone",
  "display_override": ["window-controls-overlay", "standalone", "minimal-ui"],
  "orientation": "any",
  "background_color": "#0C1428",
  "theme_color": "#0C1428",
  "categories": ["education", "health", "utilities", "accessibility"],
  "lang": "en-US",
  "dir": "ltr",
  "scope": "/",
  "icons": [
    {
      "src": "/icons/icon-72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-maskable-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/board-portrait.png",
      "sizes": "1170x2532",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "FreeVoice symbol board — Feelings category"
    },
    {
      "src": "/screenshots/board-landscape.png",
      "sizes": "2532x1170",
      "type": "image/png",
      "form_factor": "wide",
      "label": "FreeVoice in landscape mode on iPad"
    }
  ],
  "shortcuts": [
    {
      "name": "Open FreeVoice",
      "short_name": "Open",
      "description": "Open the AAC communication board",
      "url": "/",
      "icons": [{ "src": "/icons/icon-96.png", "sizes": "96x96" }]
    }
  ],
  "share_target": {
    "action": "/",
    "method": "GET",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  }
}
```

### 2.2 Vite PWA Plugin Configuration

Update `vite.config.ts` to add full PWA support with Workbox:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        // App shell — cache first, update in background
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Never cache the Kokoro model files via Workbox —
        // kokoro-js handles its own caching via transformers.js cache
        globIgnores: ['**/onnx*', '**/*.onnx', '**/kokoro*'],
        runtimeCaching: [
          // Google Fonts — stale while revalidate
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
          // ARASAAC symbol images — cache first, 90 day expiry
          {
            urlPattern: /^https:\/\/static\.arasaac\.org\/pictograms\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'arasaac-symbols',
              expiration: {
                maxEntries: 2000,
                maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // ARASAAC API search results — network first, 24hr cache
          {
            urlPattern: /^https:\/\/api\.arasaac\.org\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'arasaac-api',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
              cacheableResponse: { statuses: [0, 200] },
              networkTimeoutSeconds: 5, // Fall back to cache after 5s
            },
          },
        ],
        // Offline fallback page
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/admin\//],
        // Skip waiting — activate new SW immediately
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: false, // We're using our own manifest.json
      devOptions: {
        enabled: true, // Enable SW in dev for testing
        type: 'module',
      },
    }),
  ],
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    exclude: ['kokoro-js'],
  },
  build: {
    rollupOptions: {
      output: {
        // Code split for faster initial load
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'state': ['zustand'],
          'db': ['dexie'],
        },
      },
    },
    // Generate source maps for error tracking (not uploaded anywhere)
    sourcemap: false,
    // Target modern browsers — iPad Safari 15+, Chrome 110+
    target: ['es2020', 'safari15', 'chrome110'],
  },
});
```

Install the PWA plugin:
```bash
npm install -D vite-plugin-pwa workbox-window
```

### 2.3 iOS Install Prompt Component

Create `src/components/IOSInstallPrompt/IOSInstallPrompt.tsx`:

```tsx
import { useState, useEffect } from 'react';

// Detect iOS Safari not in standalone mode
function isIOSSafariNotInstalled(): boolean {
  const ua = navigator.userAgent;
  const isIOS = /ipad|iphone|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua);
  const isStandalone = (navigator as any).standalone === true;
  return isIOS && isSafari && !isStandalone;
}

// Track how many sessions the user has had
function getSessionCount(): number {
  const count = parseInt(localStorage.getItem('fv_session_count') || '0', 10);
  return count;
}

function incrementSessionCount(): void {
  const count = getSessionCount();
  localStorage.setItem('fv_session_count', String(count + 1));
}

function isDismissed(): boolean {
  return localStorage.getItem('fv_install_dismissed') === 'true';
}

function dismiss(): void {
  localStorage.setItem('fv_install_dismissed', 'true');
}

export function IOSInstallPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    incrementSessionCount();

    // Show after 2nd session, only on iOS Safari, only if not dismissed
    if (
      isIOSSafariNotInstalled() &&
      getSessionCount() >= 2 &&
      !isDismissed()
    ) {
      // Small delay so it doesn't compete with app loading
      const timer = setTimeout(() => setVisible(true), 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(72px + env(safe-area-inset-bottom))',
        left: '12px',
        right: '12px',
        zIndex: 200,
        background: '#1B2845',
        border: '1px solid rgba(245,158,11,0.3)',
        borderRadius: '20px',
        padding: '18px 20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        animation: 'slideUp 300ms ease-out both',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <button
        onClick={() => { dismiss(); setVisible(false); }}
        style={{
          position: 'absolute', top: '12px', right: '14px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'rgba(255,255,255,0.3)', fontSize: '20px', lineHeight: 1,
          padding: '4px',
        }}
        aria-label="Dismiss"
      >
        ×
      </button>

      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '32px', flexShrink: 0 }}>📲</span>
        <div>
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 900,
            fontSize: '15px',
            color: 'rgba(255,255,255,0.92)',
            marginBottom: '6px',
          }}>
            Add FreeVoice to your Home Screen
          </p>
          <p style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
            fontSize: '13px',
            color: 'rgba(255,255,255,0.55)',
            lineHeight: 1.5,
          }}>
            Tap <strong style={{ color: '#F59E0B' }}>Share</strong> (
            <span style={{ fontSize: '15px' }}>⎙</span>
            ) then <strong style={{ color: '#F59E0B' }}>Add to Home Screen</strong>.
            Works offline once installed.
          </p>
        </div>
      </div>
    </div>
  );
}
```

Add to `App.tsx` or `Board.tsx`:
```tsx
import { IOSInstallPrompt } from './components/IOSInstallPrompt/IOSInstallPrompt';
// In JSX, before closing tag:
<IOSInstallPrompt />
```

### 2.4 Service Worker Update Notification

Create `src/components/UpdatePrompt/UpdatePrompt.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[FreeVoice] Service Worker registered:', r);
    },
    onRegisterError(error) {
      console.error('[FreeVoice] Service Worker registration error:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(72px + env(safe-area-inset-bottom) + 12px)',
      left: '12px', right: '12px',
      zIndex: 199,
      background: '#1B2845',
      border: '1px solid rgba(79,195,247,0.3)',
      borderRadius: '16px',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      <span style={{ fontSize: '24px' }}>✨</span>
      <div style={{ flex: 1 }}>
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 900, fontSize: '14px',
          color: 'rgba(255,255,255,0.92)', marginBottom: '2px',
        }}>
          Update available
        </p>
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 700, fontSize: '12px',
          color: 'rgba(255,255,255,0.5)',
        }}>
          New symbols and improvements ready
        </p>
      </div>
      <button
        onClick={() => updateServiceWorker(true)}
        style={{
          background: '#4FC3F7', color: '#0C1428',
          border: 'none', borderRadius: '10px',
          padding: '8px 14px',
          fontFamily: "'Nunito', sans-serif",
          fontWeight: 900, fontSize: '13px',
          cursor: 'pointer', flexShrink: 0,
        }}
      >
        Update
      </button>
    </div>
  );
}
```

---

## Section 3 — App Icons (Generated from SVG)

Create `scripts/generate-icons.mjs`:

```javascript
// Generates all required PWA icon sizes from a single SVG source.
// Run: node scripts/generate-icons.mjs
// Requires: npm install -D sharp

import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dir, '..', 'public', 'icons');

// The source SVG for the app icon.
// A simple, bold icon that reads clearly at 72×72px.
// Navy background, amber speech bubble with a white soundwave.
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0C1428"/>
  <circle cx="256" cy="256" r="180" fill="#F59E0B" opacity="0.15"/>
  <!-- Speech bubble -->
  <rect x="130" y="160" width="252" height="170" rx="30" fill="#F59E0B"/>
  <polygon points="160,330 140,380 210,330" fill="#F59E0B"/>
  <!-- Sound wave bars -->
  <rect x="186" y="210" width="28" height="70" rx="14" fill="#0C1428"/>
  <rect x="242" y="190" width="28" height="110" rx="14" fill="#0C1428"/>
  <rect x="298" y="215" width="28" height="60" rx="14" fill="#0C1428"/>
</svg>`;

await mkdir(publicDir, { recursive: true });

// Write the SVG source
await writeFile(join(publicDir, 'icon.svg'), SVG);

const sizes = [72, 96, 128, 144, 192, 512];

for (const size of sizes) {
  await sharp(Buffer.from(SVG))
    .resize(size, size)
    .png()
    .toFile(join(publicDir, `icon-${size}.png`));
  console.log(`✓ icon-${size}.png`);
}

// Maskable icons — add safe zone padding (10% on each side)
for (const size of [192, 512]) {
  const padding = Math.round(size * 0.1);
  const inner = size - padding * 2;
  await sharp(Buffer.from(SVG))
    .resize(inner, inner)
    .extend({
      top: padding, bottom: padding, left: padding, right: padding,
      background: { r: 12, g: 20, b: 40, alpha: 1 }, // #0C1428
    })
    .png()
    .toFile(join(publicDir, `icon-maskable-${size}.png`));
  console.log(`✓ icon-maskable-${size}.png`);
}

// Also generate a 32×32 favicon
await sharp(Buffer.from(SVG))
  .resize(32, 32)
  .png()
  .toFile(join(__dir, '..', 'public', 'favicon-32.png'));
console.log('✓ favicon-32.png');

console.log('\n✅ All icons generated in public/icons/');
console.log('🧑 MANUAL: Replace the SVG above with your final icon design');
console.log('   Then run: node scripts/generate-icons.mjs');
```

Add to `package.json` scripts:
```json
{
  "scripts": {
    "generate-icons": "node scripts/generate-icons.mjs",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx --max-warnings 0"
  }
}
```

Install sharp:
```bash
npm install -D sharp
```

---

## Section 4 — Open Graph / SEO Meta Tags

Update `index.html` with full meta tags for sharing on social media,
messaging apps, and search engines. When a parent shares `freevoice.app`
in a Facebook group, this is what appears:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />

  <!-- PWA -->
  <meta name="theme-color" content="#0C1428" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="FreeVoice" />
  <link rel="manifest" href="/manifest.json" />

  <!-- Favicon -->
  <link rel="icon" type="image/png" href="/icons/icon-32.png" />
  <link rel="apple-touch-icon" href="/icons/icon-192.png" />
  <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-144.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192.png" />

  <!-- Primary meta -->
  <title>FreeVoice AAC — Free Communication App for Nonverbal Children</title>
  <meta name="description"
    content="FreeVoice is a completely free AAC communication app for nonverbal and minimally verbal children. 500+ symbols, AI voices, works offline. No subscription. No account. Forever free." />
  <meta name="keywords"
    content="AAC app free, augmentative alternative communication, nonverbal children, autism AAC, free AAC software, speech generating device alternative, Tobii Dynavox alternative, TD Snap alternative, symbol communication" />
  <meta name="author" content="Shellcraft Labs LLC" />
  <meta name="robots" content="index, follow" />
  <link rel="canonical" href="https://freevoice.app/" />

  <!-- Open Graph (Facebook, LinkedIn, WhatsApp) -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://freevoice.app/" />
  <meta property="og:title" content="FreeVoice AAC — Free Communication App for Nonverbal Children" />
  <meta property="og:description"
    content="500+ symbols, AI voices, works offline. No subscription. No account. Every child deserves a voice." />
  <meta property="og:image" content="https://freevoice.app/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="FreeVoice AAC — Free symbol communication app" />
  <meta property="og:site_name" content="FreeVoice AAC" />
  <meta property="og:locale" content="en_US" />

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://freevoice.app/" />
  <meta name="twitter:title" content="FreeVoice AAC — Free for Every Child, Forever" />
  <meta name="twitter:description"
    content="Free AAC app for nonverbal children. 500+ symbols, AI voices, offline. No subscription ever." />
  <meta name="twitter:image" content="https://freevoice.app/og-image.png" />
  <meta name="twitter:creator" content="@shellcraftlabs" />

  <!-- Structured data for search engines -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "FreeVoice AAC",
    "description": "Free, open-source AAC communication app for nonverbal and minimally verbal children.",
    "url": "https://freevoice.app",
    "applicationCategory": "HealthApplication",
    "operatingSystem": "Web, iOS, Android, Windows, macOS, ChromeOS",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "author": {
      "@type": "Organization",
      "name": "Shellcraft Labs LLC",
      "url": "https://shellcraftlabs.com"
    },
    "accessibilityFeature": [
      "alternativeText",
      "audioDescription",
      "largePrint",
      "highContrast",
      "keyboardControl"
    ],
    "accessibilityHazard": "none",
    "license": "https://opensource.org/licenses/MIT"
  }
  </script>

  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Nunito:wght@400;700;800;900&display=swap"
    rel="stylesheet"
  />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

### 4.1 OG Image Generator Script

Create `scripts/generate-og-image.mjs`:

```javascript
// Generates the 1200×630 Open Graph image for social media sharing.
// Run: node scripts/generate-og-image.mjs
// Requires: npm install -D sharp

import sharp from 'sharp';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

// SVG template for the OG image
const OG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0C1428"/>
      <stop offset="100%" style="stop-color:#1B2845"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Decorative circles -->
  <circle cx="900" cy="100" r="300" fill="#F59E0B" opacity="0.06"/>
  <circle cx="100" cy="500" r="200" fill="#4FC3F7" opacity="0.04"/>

  <!-- App name -->
  <text x="80" y="200"
    font-family="Georgia, serif"
    font-size="96"
    font-weight="900"
    fill="#FFFFFF">Free</text>
  <text x="310" y="200"
    font-family="Georgia, serif"
    font-size="96"
    font-weight="900"
    font-style="italic"
    fill="#F59E0B">Voice</text>
  <text x="80" y="260"
    font-family="Georgia, serif"
    font-size="40"
    font-weight="400"
    fill="rgba(255,255,255,0.5)">AAC</text>

  <!-- Tagline -->
  <text x="80" y="360"
    font-family="Georgia, serif"
    font-size="32"
    fill="rgba(255,255,255,0.85)"
    font-style="italic">Every child deserves a voice.</text>

  <!-- Feature pills -->
  <rect x="80" y="410" width="160" height="44" rx="22" fill="rgba(39,174,96,0.2)" stroke="rgba(39,174,96,0.4)" stroke-width="1"/>
  <text x="160" y="438" font-family="Arial" font-size="16" font-weight="700" fill="#86EFAC" text-anchor="middle">500+ Symbols</text>

  <rect x="260" y="410" width="140" height="44" rx="22" fill="rgba(245,158,11,0.15)" stroke="rgba(245,158,11,0.35)" stroke-width="1"/>
  <text x="330" y="438" font-family="Arial" font-size="16" font-weight="700" fill="#FCD34D" text-anchor="middle">AI Voices</text>

  <rect x="420" y="410" width="150" height="44" rx="22" fill="rgba(79,195,247,0.15)" stroke="rgba(79,195,247,0.35)" stroke-width="1"/>
  <text x="495" y="438" font-family="Arial" font-size="16" font-weight="700" fill="#7DD3FC" text-anchor="middle">Works Offline</text>

  <rect x="590" y="410" width="180" height="44" rx="22" fill="rgba(165,180,252,0.15)" stroke="rgba(165,180,252,0.35)" stroke-width="1"/>
  <text x="680" y="438" font-family="Arial" font-size="16" font-weight="700" fill="#C7D2FE" text-anchor="middle">No Subscription</text>

  <!-- Bottom bar -->
  <rect x="0" y="580" width="1200" height="50" fill="rgba(245,158,11,0.08)"/>
  <text x="80" y="613" font-family="Arial" font-size="18" font-weight="700" fill="rgba(255,255,255,0.4)">freevoice.app</text>
  <text x="1120" y="613" font-family="Arial" font-size="18" font-weight="700" fill="rgba(255,255,255,0.4)" text-anchor="end">Free. Open Source. Forever.</text>
</svg>`;

await sharp(Buffer.from(OG_SVG))
  .resize(1200, 630)
  .png()
  .toFile(join(__dir, '..', 'public', 'og-image.png'));

console.log('✅ og-image.png generated in public/');
console.log('🧑 MANUAL: Preview at https://opengraph.xyz after deploying');
```

Add to package.json scripts:
```json
"generate-og": "node scripts/generate-og-image.mjs"
```

---

## Section 5 — GitHub Issue Templates

Create `.github/ISSUE_TEMPLATE/bug_report.yml`:

```yaml
name: Bug Report
description: Something isn't working
labels: ["bug"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for helping make FreeVoice better.
        Please fill out this form completely — it helps us fix things faster.

  - type: dropdown
    id: device
    attributes:
      label: Device
      options:
        - iPad (Safari)
        - iPad (Chrome)
        - iPhone (Safari)
        - Android tablet (Chrome)
        - Android phone (Chrome)
        - Windows PC (Chrome)
        - Windows PC (Edge)
        - Mac (Safari)
        - Mac (Chrome)
        - Chromebook
        - Other
    validations:
      required: true

  - type: input
    id: os-version
    attributes:
      label: OS Version
      placeholder: "e.g. iPadOS 17.4, Android 14, Windows 11"
    validations:
      required: true

  - type: textarea
    id: description
    attributes:
      label: What happened?
      description: Describe the bug clearly.
    validations:
      required: true

  - type: textarea
    id: steps
    attributes:
      label: Steps to reproduce
      placeholder: |
        1. Open FreeVoice
        2. Tap the Feelings tab
        3. Tap "Happy"
        4. Nothing happens
    validations:
      required: true

  - type: textarea
    id: expected
    attributes:
      label: What should have happened?
    validations:
      required: true

  - type: dropdown
    id: severity
    attributes:
      label: How bad is this?
      options:
        - App is unusable — child cannot communicate
        - Major feature broken
        - Minor annoyance
        - Visual/cosmetic only
    validations:
      required: true
```

Create `.github/ISSUE_TEMPLATE/symbol_request.yml`:

```yaml
name: Symbol Request
description: Request a new symbol or category
labels: ["symbol-request"]
body:
  - type: input
    id: symbol
    attributes:
      label: What symbol or word do you need?
      placeholder: "e.g. 'Occupational Therapist', 'Sensory Break Room'"
    validations:
      required: true

  - type: dropdown
    id: category
    attributes:
      label: Which category does it belong in?
      options:
        - Home / General
        - Feelings / Emotions
        - Food & Drinks
        - School
        - Body / Health / Medical
        - Social / People
        - Play / Activities
        - Bedtime / Routine
        - New category needed
    validations:
      required: true

  - type: textarea
    id: context
    attributes:
      label: When would this symbol be used?
      description: Help us understand the communication context.
      placeholder: "e.g. In therapy sessions when the child needs to ask for a sensory break"
    validations:
      required: true

  - type: input
    id: arasaac-link
    attributes:
      label: ARASAAC symbol link (if you found one)
      description: Search at arasaac.org/pictograms/search and paste the URL if found
      placeholder: "https://arasaac.org/pictograms/search?searchText=..."
```

Create `.github/ISSUE_TEMPLATE/board_submission.yml`:

```yaml
name: Community Board Submission
description: Share a custom board for others to use
labels: ["community-board"]
body:
  - type: input
    id: board-name
    attributes:
      label: Board name
      placeholder: "e.g. Doctor Visit, Restaurant, Birthday Party"
    validations:
      required: true

  - type: dropdown
    id: age-range
    attributes:
      label: Best for what age range?
      options:
        - All ages
        - Toddlers (2–4)
        - Young children (4–7)
        - Older children (7–12)
        - Teens
        - Adults
    validations:
      required: true

  - type: textarea
    id: description
    attributes:
      label: Describe the board
      placeholder: "What context is it for? What communication needs does it address?"
    validations:
      required: true

  - type: textarea
    id: json
    attributes:
      label: Board JSON
      description: Paste your exported board JSON here
      render: json
    validations:
      required: true
```

Create `.github/ISSUE_TEMPLATE/config.yml`:

```yaml
blank_issues_enabled: false
contact_links:
  - name: FreeVoice App
    url: https://freevoice.app
    about: Open the live app
  - name: ARASAAC Symbol Search
    url: https://arasaac.org/pictograms/search
    about: Search for symbols to request
```

---

## Section 6 — About / Legal Screen in App

Create `src/pages/About.tsx`:

```tsx
export function About() {
  return (
    <div style={{
      flex: 1,
      overflow-y: 'auto',
      background: '#111827',
      padding: '24px 20px 40px',
    }}>

      {/* App identity */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <p style={{
          fontFamily: "'Baloo 2', cursive",
          fontSize: '32px', fontWeight: 800,
          color: '#F59E0B', margin: 0,
        }}>
          FreeVoice AAC
        </p>
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '13px', fontWeight: 700,
          color: 'rgba(255,255,255,0.35)',
          marginTop: '4px',
        }}>
          Version {__APP_VERSION__} · Free Forever
        </p>
      </div>

      {/* Mission */}
      <Section title="Why FreeVoice Exists">
        <p>
          FreeVoice was built by a parent of a nonverbal child who was
          tired of watching companies charge hundreds of dollars a year
          to let their daughter speak.
        </p>
        <p style={{ marginTop: '10px' }}>
          Communication is a human right. Not a subscription service.
        </p>
      </Section>

      {/* Cost */}
      <Section title="Cost">
        <Pill color="green" label="$0.00 — Free forever" />
        <p style={{ marginTop: '10px' }}>
          No subscription. No account. No ads. No data collection.
          No features locked behind payment. This will never change.
        </p>
      </Section>

      {/* Attribution */}
      <Section title="Symbols">
        <p>
          Pictographic symbols are provided by{' '}
          <Link href="https://arasaac.org">ARASAAC</Link>{' '}
          (Aragonese Portal of Augmentative and Alternative Communication),
          created by Sergio Palao for the Government of Aragon, Spain.
          Used under Creative Commons CC BY-NC-SA 4.0.
        </p>
      </Section>

      {/* Voice */}
      <Section title="AI Voice">
        <p>
          AI voices are powered by{' '}
          <Link href="https://github.com/hexgrad/kokoro">Kokoro TTS</Link>
          {' '}(Apache 2.0), running entirely on your device.
          Your speech is never sent to any server.
        </p>
      </Section>

      {/* Privacy */}
      <Section title="Privacy">
        <Pill color="green" label="Zero data collection" />
        <p style={{ marginTop: '10px' }}>
          FreeVoice stores everything locally on your device.
          No accounts, no tracking, no analytics, no advertising.
          If you delete the app, all data is gone. We have no copy of anything.
        </p>
      </Section>

      {/* Open source */}
      <Section title="Open Source">
        <p>
          FreeVoice is open source (MIT license). View the source code,
          report bugs, request symbols, or contribute at:
        </p>
        <Link href="https://github.com/shellcraftlabs/freevoice" block>
          github.com/shellcraftlabs/freevoice
        </Link>
      </Section>

      {/* Support */}
      <Section title="Support Development">
        <p>
          FreeVoice is free and always will be. If it helps your family,
          you can support ongoing development through GitHub Sponsors.
          No pressure — the app never changes based on donations.
        </p>
        <Link href="https://github.com/sponsors/shellcraftlabs" block>
          github.com/sponsors/shellcraftlabs
        </Link>
      </Section>

      {/* Legal */}
      <Section title="Legal">
        <Link href="https://freevoice.app/terms">Terms of Use & Disclaimers</Link>
        <p style={{ marginTop: '10px', fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
          FreeVoice is not affiliated with Tobii Dynavox, Mayer-Johnson,
          AssistiveWare, or any other AAC vendor.
        </p>
      </Section>

      {/* Made with love */}
      <div style={{ textAlign: 'center', marginTop: '32px', paddingTop: '24px',
        borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <p style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '13px', fontWeight: 700,
          color: 'rgba(255,255,255,0.25)',
          fontStyle: 'italic',
        }}>
          Built with love by Shellcraft Labs LLC<br />
          Roswell, Georgia · 2026
        </p>
        <p style={{
          fontSize: '24px', marginTop: '12px',
          animation: 'pulse 2s ease-in-out infinite',
        }}>❤️</p>
      </div>

    </div>
  );
}

// Helper components
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#1B2845',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '16px',
      padding: '18px 20px',
      marginBottom: '12px',
    }}>
      <p style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: '10px', fontWeight: 900,
        letterSpacing: '2px', textTransform: 'uppercase',
        color: '#F59E0B', marginBottom: '10px',
      }}>
        {title}
      </p>
      <div style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: '14px', fontWeight: 700,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 1.65,
      }}>
        {children}
      </div>
    </div>
  );
}

function Pill({ color, label }: { color: 'green' | 'amber'; label: string }) {
  const colors = {
    green: { bg: 'rgba(39,174,96,0.12)', border: 'rgba(39,174,96,0.3)', text: '#86EFAC' },
    amber: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#FCD34D' },
  };
  const c = colors[color];
  return (
    <span style={{
      display: 'inline-block',
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.text, borderRadius: '100px',
      padding: '4px 14px', fontSize: '13px', fontWeight: 900,
    }}>
      {label}
    </span>
  );
}

function Link({ href, children, block }: {
  href: string; children: React.ReactNode; block?: boolean
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{
      color: '#4FC3F7', fontWeight: 800, textDecoration: 'none',
      display: block ? 'block' : 'inline',
      marginTop: block ? '8px' : 0,
      fontSize: block ? '13px' : 'inherit',
    }}>
      {children}
    </a>
  );
}
```

Add `__APP_VERSION__` to `vite.config.ts`:
```typescript
import { readFileSync } from 'fs';
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  // ... rest of config
});
```

Add to `vite-env.d.ts`:
```typescript
declare const __APP_VERSION__: string;
```

---

## Section 7 — package.json Final State

Ensure these scripts exist in `package.json`:

```json
{
  "name": "freevoice-aac",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .ts,.tsx --max-warnings 0",
    "generate-icons": "node scripts/generate-icons.mjs",
    "generate-og": "node scripts/generate-og-image.mjs",
    "generate-assets": "npm run generate-icons && npm run generate-og",
    "license-audit": "npx license-checker --onlyAllow 'MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;CC-BY-4.0;CC0-1.0;Unlicense'"
  }
}
```

---

## Tasks Requiring Manual Action 🧑

The following cannot be automated and require manual steps:

1. **GitHub repo creation** — go to github.com/new, create `freevoice`
   as a public repo under shellcraftlabs org

2. **GitHub Pages setup** — in repo Settings → Pages → Source:
   select `gh-pages` branch after first deploy runs

3. **Domain registration** — register `freevoice.app` at Namecheap,
   Cloudflare, or Google Domains (~$12/year)

4. **DNS configuration** — point domain to GitHub Pages:
   Add CNAME record: `freevoice.app → shellcraftlabs.github.io`

5. **GitHub Sponsors** — enable at github.com/sponsors/shellcraftlabs

6. **Icon design** — replace the placeholder SVG in
   `scripts/generate-icons.mjs` with the final icon design,
   then run `npm run generate-icons`

7. **Screenshots** — take actual device screenshots and place at:
   `public/screenshots/board-portrait.png` (1170×2532)
   `public/screenshots/board-landscape.png` (2532×1170)

8. **CNAME in workflow** — update `cname: freevoice.app` in
   `.github/workflows/deploy.yml` to your actual domain

---

## Verification Checklist

After implementing all sections:

- [ ] `npm run build` completes with no errors
- [ ] `npm run type-check` passes with no errors
- [ ] `npm run lint` passes with no warnings
- [ ] `npm run generate-assets` creates all icon files in `public/icons/`
- [ ] `manifest.json` is valid — test at web.dev/measure
- [ ] Service worker registers in browser DevTools → Application tab
- [ ] App appears installable (browser shows install prompt) in Chrome
- [ ] iOS install prompt appears on second session in Safari
- [ ] OG image previews correctly at opengraph.xyz
- [ ] GitHub Actions workflow file is valid YAML (no syntax errors)
- [ ] Issue templates appear when creating a new GitHub Issue
- [ ] About page renders correctly with all sections
- [ ] `__APP_VERSION__` displays correctly in About page
- [ ] `npm run license-audit` passes (no GPL or incompatible licenses)

---

*FreeVoice AAC · Deployment & Launch Automation · Shellcraft Labs LLC*
