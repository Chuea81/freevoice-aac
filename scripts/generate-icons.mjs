// Generates all required PWA icon sizes from a single SVG source.
// Run: node scripts/generate-icons.mjs
// Requires: npm install -D sharp

import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dir, '..', 'public', 'icons');

// 🧑 MANUAL: Replace this SVG with your final icon design, then re-run this script.
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

// 32x32 favicon
await sharp(Buffer.from(SVG))
  .resize(32, 32)
  .png()
  .toFile(join(__dir, '..', 'public', 'favicon-32.png'));
console.log('✓ favicon-32.png');

console.log('\n✅ All icons generated in public/icons/');
console.log('🧑 MANUAL: Replace the SVG above with your final icon design');
console.log('   Then run: node scripts/generate-icons.mjs');
