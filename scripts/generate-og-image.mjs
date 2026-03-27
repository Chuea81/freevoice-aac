// Generates the 1200x630 Open Graph image for social media sharing.
// Run: node scripts/generate-og-image.mjs
// Requires: npm install -D sharp

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

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
// 🧑 MANUAL: Preview at https://opengraph.xyz after deploying
