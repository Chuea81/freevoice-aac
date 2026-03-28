// Slices drink icon sprite sheet into individual PNGs.
// Run: node scripts/slice-drinks.mjs

import sharp from 'sharp';
import { existsSync, statSync } from 'fs';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..');

const SHEET = join(ROOT, 'public', 'symbols', 'drinks_sheet.jpg');
const OUT_DIR = join(ROOT, 'public', 'symbols', 'drinks');

// Labels matching the sprite sheet layout (left→right, top→bottom)
// Row 1
const LABELS = [
  'water', 'milk', 'juice', 'orange_juice', 'tea', 'soda', 'chocolate_milk', 'smoothie', 'lemonade', 'coconut_water',
  // Row 2
  'iced_coffee', 'milkshake', 'boba_tea', 'hot_coffee', 'hot_chocolate', 'hot_coffee_2', 'milk_coffee', 'kombucha', 'energy_drink', 'cranberry_juice',
  // Row 3
  'apple_juice', 'frappuccino', 'sparkling_water', 'root_beer', 'iced_tea', 'hot_cider', 'hot_cider_2', 'mango_lassi', 'agua_fresca', 'sports_drink',
  // Row 4
  'mango_lassi_2', 'agua_fresca_2', 'grape_juice', 'pineapple_juice', 'peach_juice', 'fruit_punch', 'tomato_juice', 'vegetable_juice', 'milk_carton', 'water_bottle',
];

const COLS = 10;
const ROWS = 4;

// Same inset approach as emotions — trim card borders and text labels
const INSET = 50;
const INSET_BOTTOM = 100;

async function main() {
  if (!existsSync(SHEET)) {
    console.error('❌ Sprite sheet not found at', SHEET);
    console.log('   Copy your drinks sprite sheet to: public/symbols/drinks_sheet.jpg');
    process.exit(1);
  }

  await mkdir(OUT_DIR, { recursive: true });

  const metadata = await sharp(SHEET).metadata();
  const { width, height } = metadata;
  const cellW = Math.floor(width / COLS);
  const cellH = Math.floor(height / ROWS);
  const extractW = cellW - INSET * 2;
  const extractH = cellH - INSET - INSET_BOTTOM;

  console.log(`Sheet: ${width}×${height}`);
  console.log(`Cell: ${cellW}×${cellH} → extract: ${extractW}×${extractH}`);

  let count = 0;
  for (let i = 0; i < LABELS.length; i++) {
    const label = LABELS[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);

    const left = col * cellW + INSET;
    const top = row * cellH + INSET;

    const outPath = join(OUT_DIR, `${label}.png`);

    await sharp(SHEET)
      .extract({ left, top, width: extractW, height: extractH })
      .resize(500, 500, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outPath);

    const size = (statSync(outPath).size / 1024).toFixed(1);
    console.log(`  ✓ ${label}.png — ${size}KB`);
    count++;
  }

  console.log(`\n✅ Sliced ${count} drink icons.`);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
