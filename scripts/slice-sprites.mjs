// Slices character sprite sheets into individual emotion PNGs.
// Reads manifest.json for character list, auto-detects grid layout.
// Handles sprite sheets with text labels under each cell (crops them out).
// Run: node scripts/slice-sprites.mjs
// Requires: npm install -D sharp

import sharp from 'sharp';
import { readFileSync, existsSync, statSync } from 'fs';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dir, '..', 'public', 'characters');

// Emotion labels in exact sprite sheet order (left→right, top→bottom)
const LABELS = [
  // Row 1
  'happy', 'sad', 'angry', 'scared', 'tired', 'sick', 'bored', 'love', 'frustrated', 'good',
  // Row 2
  'worried', 'excited', 'nervous', 'calm', 'confused', 'surprised', 'proud', 'lonely', 'embarrassed', 'hurt_feelings',
  // Row 3 (only 4 — rest are empty)
  'shy', 'silly', 'grateful', 'disappointed',
];

const TOTAL = LABELS.length; // 24
const COLS = 10;
const ROWS = 3;

// Crop ratios for each cell:
// - Skip top 5% (label bleed from row above)
// - Skip bottom 15% (text label like "HAPPY")
// - Keep the middle 80% which is the character art
const TOP_SKIP = 0.05;
const BOTTOM_SKIP = 0.15;

async function main() {
  const manifestPath = join(PUBLIC, 'manifest.json');
  if (!existsSync(manifestPath)) {
    console.error('❌ manifest.json not found');
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  console.log(`Found ${manifest.characters.length} characters.\n`);

  let totalSliced = 0;
  let warnings = 0;

  for (const char of manifest.characters) {
    // Try .png then .jpg
    let sheetPath = join(PUBLIC, 'sprites', `${char.id}_sheet.png`);
    if (!existsSync(sheetPath)) {
      sheetPath = join(PUBLIC, 'sprites', `${char.id}_sheet.jpg`);
    }
    if (!existsSync(sheetPath)) {
      console.log(`⚠ No sprite sheet for ${char.id} — skipping ${char.name}\n`);
      continue;
    }

    const sheetSize = statSync(sheetPath).size;
    console.log(`Processing ${char.name} (${char.id}) — ${(sheetSize / 1024).toFixed(0)}KB`);

    const metadata = await sharp(sheetPath).metadata();
    const { width, height } = metadata;
    console.log(`  Sheet: ${width}×${height}`);

    const cellW = Math.floor(width / COLS);
    const cellH = Math.floor(height / ROWS);
    const topOffset = Math.floor(cellH * TOP_SKIP);
    const imgH = Math.floor(cellH * (1 - TOP_SKIP - BOTTOM_SKIP));
    console.log(`  Cell: ${cellW}×${cellH}, crop: skip ${topOffset}px top, keep ${imgH}px`);

    const outDir = join(PUBLIC, 'symbols', char.id, 'emotions');
    await mkdir(outDir, { recursive: true });

    for (let i = 0; i < TOTAL; i++) {
      const label = LABELS[i];
      const col = i % COLS;
      const row = Math.floor(i / COLS);

      const left = col * cellW;
      const top = row * cellH + topOffset;

      const outPath = join(outDir, `${label}.png`);

      await sharp(sheetPath)
        .extract({ left, top, width: cellW, height: imgH })
        .resize(500, 500, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(outPath);

      const outSize = statSync(outPath).size;
      const sizeKB = (outSize / 1024).toFixed(1);

      if (outSize < 1024) {
        console.log(`  ⚠ ${label}.png — ${sizeKB}KB (possibly blank!)`);
        warnings++;
      } else {
        console.log(`  ✓ ${label}.png — ${sizeKB}KB`);
      }
      totalSliced++;
    }

    // Preview from "happy" cell
    const previewDir = join(PUBLIC, 'preview');
    await mkdir(previewDir, { recursive: true });
    const previewPath = join(previewDir, `${char.id}.png`);

    await sharp(sheetPath)
      .extract({ left: 0, top: topOffset, width: cellW, height: imgH })
      .resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(previewPath);

    console.log(`  ✓ preview/${char.id}.png — ${(statSync(previewPath).size / 1024).toFixed(1)}KB`);
    console.log();
  }

  console.log(`\n✅ Sliced ${totalSliced} emotion images.`);
  if (warnings > 0) console.log(`⚠ ${warnings} warnings.`);

  // Clean up Gemini source files from emotions folder
  console.log('\nCleaning up source Gemini files...');
  const { readdirSync, unlinkSync } = await import('fs');
  for (const char of manifest.characters) {
    const emotionsDir = join(PUBLIC, 'symbols', char.id, 'emotions');
    if (!existsSync(emotionsDir)) continue;
    for (const file of readdirSync(emotionsDir)) {
      if (file.startsWith('Gemini_')) {
        unlinkSync(join(emotionsDir, file));
        console.log(`  🗑 Removed ${file}`);
      }
    }
  }

  console.log('\n✅ Done! Verify images visually.');
}

main().catch(err => { console.error('❌', err); process.exit(1); });
