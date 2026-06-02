// Post-build: copy root-level static files from public/ to dist/
// Vite outputs the React app to dist/app/. This script adds the
// landing page, terms, CNAME, icons, and OG image at the dist root.

import { copyFileSync, cpSync, mkdirSync, existsSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const dist = join(root, 'dist');
const pub = join(root, 'public');

// PAY-03: the character sprite SHEETS (~31MB of JPGs) are build inputs for
// slice-sprites.mjs only — never referenced at runtime (the app uses the sliced
// per-emotion WebP files). Vite copies them into dist via public/, so prune
// them from the shipped output here.
const spritesDir = join(dist, 'app', 'characters', 'sprites');
if (existsSync(spritesDir)) {
  rmSync(spritesDir, { recursive: true, force: true });
  console.log('✓ pruned dist/app/characters/sprites (build-only source sheets)');
}

// Ensure dist/ root exists (Vite creates dist/app/)
mkdirSync(dist, { recursive: true });

// Copy landing page as the root index
copyFileSync(join(pub, 'index.html'), join(dist, 'index.html'));
console.log('✓ dist/index.html (landing page)');

// Copy 404.html for GitHub Pages SPA routing
if (existsSync(join(pub, '404.html'))) {
  copyFileSync(join(pub, '404.html'), join(dist, '404.html'));
  console.log('✓ dist/404.html (SPA router)');
}

// Copy terms page
if (existsSync(join(pub, 'terms.html'))) {
  copyFileSync(join(pub, 'terms.html'), join(dist, 'terms.html'));
  console.log('✓ dist/terms.html');
}

// Copy guide page
if (existsSync(join(pub, 'guide.html'))) {
  copyFileSync(join(pub, 'guide.html'), join(dist, 'guide.html'));
  console.log('✓ dist/guide.html');
}

// Copy CNAME
if (existsSync(join(pub, 'CNAME'))) {
  copyFileSync(join(pub, 'CNAME'), join(dist, 'CNAME'));
  console.log('✓ dist/CNAME');
}

// Copy OG image
if (existsSync(join(pub, 'og-image.png'))) {
  copyFileSync(join(pub, 'og-image.png'), join(dist, 'og-image.png'));
  console.log('✓ dist/og-image.png');
}

// Copy icons directory
if (existsSync(join(pub, 'icons'))) {
  cpSync(join(pub, 'icons'), join(dist, 'icons'), { recursive: true });
  console.log('✓ dist/icons/');
}

// Copy favicon
if (existsSync(join(pub, 'favicon.svg'))) {
  copyFileSync(join(pub, 'favicon.svg'), join(dist, 'favicon.svg'));
  console.log('✓ dist/favicon.svg');
}
if (existsSync(join(pub, 'favicon-32.png'))) {
  copyFileSync(join(pub, 'favicon-32.png'), join(dist, 'favicon-32.png'));
  console.log('✓ dist/favicon-32.png');
}

// Copy screenshots if they exist
if (existsSync(join(pub, 'screenshots'))) {
  cpSync(join(pub, 'screenshots'), join(dist, 'screenshots'), { recursive: true });
  console.log('✓ dist/screenshots/');
}

// Copy symbols directory (custom and drink images)
if (existsSync(join(pub, 'symbols'))) {
  cpSync(join(pub, 'symbols'), join(dist, 'symbols'), { recursive: true });
  console.log('✓ dist/symbols/');
}

// PAY-03: prune build-only source sprite SHEETS that Vite/assemble copied into
// the shipped output (drink images are sliced from this at build time; the app
// references the per-drink WebP files, never the sheet).
for (const p of [
  join(dist, 'app', 'symbols', 'drinks_sheet.jpg'),
  join(dist, 'symbols', 'drinks_sheet.jpg'),
]) {
  if (existsSync(p)) {
    rmSync(p, { force: true });
    console.log(`✓ pruned ${p.replace(dist, 'dist')} (build-only source sheet)`);
  }
}

console.log('\n✅ dist/ assembled: landing at /, React app at /app/');
