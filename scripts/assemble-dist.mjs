// Post-build: copy root-level static files from public/ to dist/
// Vite outputs the React app to dist/app/. This script adds the
// landing page, terms, CNAME, icons, and OG image at the dist root.

import { copyFileSync, cpSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const dist = join(root, 'dist');
const pub = join(root, 'public');

// Ensure dist/ root exists (Vite creates dist/app/)
mkdirSync(dist, { recursive: true });

// Copy landing page as the root index
copyFileSync(join(pub, 'index.html'), join(dist, 'index.html'));
console.log('✓ dist/index.html (landing page)');

// Copy terms page
if (existsSync(join(pub, 'terms.html'))) {
  copyFileSync(join(pub, 'terms.html'), join(dist, 'terms.html'));
  console.log('✓ dist/terms.html');
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

console.log('\n✅ dist/ assembled: landing at /, React app at /app/');
