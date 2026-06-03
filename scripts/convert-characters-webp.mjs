// One-time: convert character art (emotion + preview PNGs, ~161MB of 500x500
// RGBA) to WebP. Writes .webp next to each .png, then removes the .png.
// slice-sprites.mjs emits .webp going forward.
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
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (extname(e.name).toLowerCase() === '.png') out.push(p);
  }
  return out;
}

const pngs = [
  ...walk(join(PUBLIC, 'characters', 'symbols')),
  ...walk(join(PUBLIC, 'characters', 'preview')),
  ...walk(join(PUBLIC, 'symbols', 'custom')),
  ...walk(join(PUBLIC, 'symbols', 'drinks')),
];
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
    console.error(`  x ${png}: ${err.message}`);
    failed++;
  }
}
const mb = (b) => (b / 1024 / 1024).toFixed(1);
console.log(`\nConverted ${done} files (${failed} failed). ${mb(before)}MB -> ${mb(after)}MB (saved ${mb(before - after)}MB)`);
