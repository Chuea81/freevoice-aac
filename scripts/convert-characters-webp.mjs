// PAY-02: one-time conversion of the character art (the 148MB of 500x500 RGBA
// emotion PNGs + preview PNGs) to WebP. Writes .webp next to each .png, then
// removes the .png. Going forward, slice-sprites.mjs emits .webp directly.
//
// Run: node scripts/convert-characters-webp.mjs

import sharp from 'sharp';
import { readdirSync, statSync, existsSync, unlinkSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dir, '..', 'public');
const QUALITY = 80;

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (extname(entry.name).toLowerCase() === '.png') out.push(p);
  }
  return out;
}

const TARGETS = [
  join(PUBLIC, 'characters', 'symbols'),
  join(PUBLIC, 'characters', 'preview'),
  join(PUBLIC, 'symbols', 'custom'),
  join(PUBLIC, 'symbols', 'drinks'),
];
const pngs = TARGETS.flatMap(walk);
console.log(`Converting ${pngs.length} PNGs to WebP (q${QUALITY})...`);

let before = 0, after = 0, done = 0, failed = 0;
for (const png of pngs) {
  const webp = png.replace(/\.png$/i, '.webp');
  try {
    before += statSync(png).size;
    await sharp(png).webp({ quality: QUALITY }).toFile(webp);
    after += statSync(webp).size;
    unlinkSync(png);
    done++;
  } catch (err) {
    console.error(`  ✗ ${png}: ${err.message}`);
    failed++;
  }
}

const mb = (b) => (b / 1024 / 1024).toFixed(1);
console.log(`\n✅ Converted ${done} files (${failed} failed).`);
console.log(`   ${mb(before)} MB PNG → ${mb(after)} MB WebP  (saved ${mb(before - after)} MB, ${(100 * (1 - after / before)).toFixed(0)}%)`);
