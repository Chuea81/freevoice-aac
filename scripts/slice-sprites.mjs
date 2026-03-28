// Slices character sprite sheets into individual emotion PNGs.
// Run: node scripts/slice-sprites.mjs

import sharp from 'sharp';
import { readFileSync, existsSync, statSync } from 'fs';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dir, '..', 'public', 'characters');

const LABELS = [
  'happy', 'sad', 'angry', 'scared', 'tired', 'sick', 'bored', 'love', 'frustrated', 'good',
  'worried', 'excited', 'nervous', 'calm', 'confused', 'surprised', 'proud', 'lonely', 'embarrassed', 'hurt_feelings',
  'shy', 'silly', 'grateful', 'disappointed',
];

const TOTAL = LABELS.length;
const COLS = 10;
const ROWS = 3;

// Pixel insets to trim from each cell:
// - Each cell has a colored border frame (~8px each side)
// - Bottom has a text label (~48px)
// These are absolute pixel values based on 376x373 cells
// Extract a centered square from each cell that avoids ALL borders and labels.
// Cell is 376×373. The usable character art area is roughly centered,
// with colored card borders on all sides and a text label at the bottom.
// We take a 280×280 square from the center-top of each cell.
// The sprite cells have thick rounded-corner card borders (up to 45px)
// and text labels at the bottom (~55px). Extract only the inner content.
const INSET = 50;           // pixels to trim from left, right, top
const INSET_BOTTOM = 65;    // pixels to trim from bottom (text label)

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
    let sheetPath = join(PUBLIC, 'sprites', `${char.id}_sheet.png`);
    if (!existsSync(sheetPath)) {
      sheetPath = join(PUBLIC, 'sprites', `${char.id}_sheet.jpg`);
    }
    if (!existsSync(sheetPath)) {
      console.log(`⚠ No sprite sheet for ${char.id} — skipping\n`);
      continue;
    }

    console.log(`Processing ${char.name} (${char.id}) — ${(statSync(sheetPath).size / 1024).toFixed(0)}KB`);

    const metadata = await sharp(sheetPath).metadata();
    const { width, height } = metadata;
    const cellW = Math.floor(width / COLS);
    const cellH = Math.floor(height / ROWS);

    const extractW = cellW - INSET * 2;
    const extractH = cellH - INSET - INSET_BOTTOM;
    console.log(`  Cell: ${cellW}×${cellH} → extract: ${extractW}×${extractH} (inset ${INSET}/${INSET_BOTTOM})`);

    const outDir = join(PUBLIC, 'symbols', char.id, 'emotions');
    await mkdir(outDir, { recursive: true });

    for (let i = 0; i < TOTAL; i++) {
      const label = LABELS[i];
      const col = i % COLS;
      const row = Math.floor(i / COLS);

      const left = col * cellW + INSET;
      const top = row * cellH + INSET;

      const outPath = join(outDir, `${label}.png`);

      await sharp(sheetPath)
        .extract({ left, top, width: extractW, height: extractH })
        .resize(500, 500, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(outPath);

      const outSize = statSync(outPath).size;
      if (outSize < 1024) {
        console.log(`  ⚠ ${label}.png — ${(outSize/1024).toFixed(1)}KB (possibly blank!)`);
        warnings++;
      }
      totalSliced++;
    }
    console.log(`  ✓ ${TOTAL} emotions sliced`);

    // Preview from happy cell
    const previewDir = join(PUBLIC, 'preview');
    await mkdir(previewDir, { recursive: true });
    const previewPath = join(previewDir, `${char.id}.png`);

    await sharp(sheetPath)
      .extract({ left: INSET, top: INSET, width: extractW, height: extractH })
      .resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(previewPath);

    console.log(`  ✓ preview\n`);
  }

  // Cleanup Gemini source files
  const { readdirSync, unlinkSync } = await import('fs');
  for (const char of manifest.characters) {
    const emotionsDir = join(PUBLIC, 'symbols', char.id, 'emotions');
    if (!existsSync(emotionsDir)) continue;
    for (const file of readdirSync(emotionsDir)) {
      if (file.startsWith('Gemini_')) {
        unlinkSync(join(emotionsDir, file));
      }
    }
  }

  console.log(`✅ Sliced ${totalSliced} emotion images.`);
  if (warnings > 0) console.log(`⚠ ${warnings} warnings.`);
  console.log('✅ Done!');
}

main().catch(err => { console.error('❌', err); process.exit(1); });
