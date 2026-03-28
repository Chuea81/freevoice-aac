// Slices character sprite sheets into individual emotion PNGs.
// Reads manifest.json for character list, auto-detects grid layout.
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

// Auto-detect grid layout from image dimensions
function detectGrid(width, height) {
  const ratio = width / height;

  // Try common layouts and pick the one whose cells are closest to square
  const candidates = [
    { cols: 10, rows: 3 },  // 10×3 = 30 cells (24 used)
    { cols: 8, rows: 3 },   // 8×3 = 24 cells
    { cols: 6, rows: 4 },   // 6×4 = 24 cells
    { cols: 12, rows: 2 },  // 12×2 = 24 cells
  ];

  let best = candidates[0];
  let bestScore = Infinity;

  for (const c of candidates) {
    const cellW = width / c.cols;
    const cellH = height / c.rows;
    // Score: how close to square (1:1 ratio) the cells are
    const cellRatio = cellW / cellH;
    const score = Math.abs(cellRatio - 1);
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  }

  console.log(`  Grid detected: ${best.cols}×${best.rows} (ratio ${ratio.toFixed(2)}, cell squareness ${(1 - bestScore).toFixed(2)})`);
  return best;
}

async function main() {
  // Read manifest
  const manifestPath = join(PUBLIC, 'manifest.json');
  if (!existsSync(manifestPath)) {
    console.error('❌ manifest.json not found at', manifestPath);
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const characters = manifest.characters;
  console.log(`Found ${characters.length} characters in manifest.\n`);

  let totalSliced = 0;
  let warnings = 0;

  for (const char of characters) {
    const sheetPath = join(PUBLIC, 'sprites', `${char.id}_sheet.png`);

    if (!existsSync(sheetPath)) {
      console.log(`⚠ Sprite sheet not found for ${char.id}: ${sheetPath}`);
      console.log(`  Skipping ${char.name}.\n`);
      continue;
    }

    const sheetSize = statSync(sheetPath).size;
    console.log(`Processing ${char.name} (${char.id}) — sheet: ${(sheetSize / 1024).toFixed(0)}KB`);

    const image = sharp(sheetPath);
    const metadata = await image.metadata();
    const { width, height } = metadata;
    console.log(`  Sheet dimensions: ${width}×${height}`);

    const { cols, rows } = detectGrid(width, height);
    const cellW = Math.floor(width / cols);
    const cellH = Math.floor(height / rows);
    console.log(`  Cell size: ${cellW}×${cellH}`);

    // Create output directory
    const outDir = join(PUBLIC, 'symbols', char.id, 'emotions');
    await mkdir(outDir, { recursive: true });

    // Slice each emotion
    for (let i = 0; i < TOTAL; i++) {
      const label = LABELS[i];
      const col = i % cols;
      const row = Math.floor(i / cols);

      const left = col * cellW;
      const top = row * cellH;

      // Ensure we don't exceed image bounds
      const extractW = Math.min(cellW, width - left);
      const extractH = Math.min(cellH, height - top);

      if (left >= width || top >= height) {
        console.log(`  ⚠ ${label}: out of bounds (${left},${top}), skipping`);
        warnings++;
        continue;
      }

      const outPath = join(outDir, `${label}.png`);

      await sharp(sheetPath)
        .extract({ left, top, width: extractW, height: extractH })
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

    // Also create preview from the "happy" cell (first cell)
    const previewDir = join(PUBLIC, 'preview');
    await mkdir(previewDir, { recursive: true });
    const previewPath = join(previewDir, `${char.id}.png`);

    await sharp(sheetPath)
      .extract({ left: 0, top: 0, width: cellW, height: cellH })
      .resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(previewPath);

    console.log(`  ✓ preview/${char.id}.png — ${(statSync(previewPath).size / 1024).toFixed(1)}KB`);
    console.log();
  }

  console.log(`\n✅ Sliced ${totalSliced} emotion images.`);
  if (warnings > 0) {
    console.log(`⚠ ${warnings} warnings — check files marked above.`);
  }
  console.log('🧑 MANUAL: Verify each sliced image looks correct visually.');
}

main().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
