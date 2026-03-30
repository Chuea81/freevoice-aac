import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..');
const SYMBOLS_DIR = join(ROOT, 'public', 'symbols', 'custom');
const ARASAAC_IDS_FILE = join(ROOT, 'src', 'data', 'arasaacIds.ts');
const BOARDS_FILE = join(ROOT, 'src', 'data', 'defaultBoards.ts');

function labelToFileName(label) {
  return label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

export async function getCategories() {
  return [
    { id: 'feelings',  label: 'Feelings',      subcategories: [] },
    { id: 'food',      label: 'Food',           subcategories: ['American', 'Mexican & Latin', 'African American', 'East Asian', 'South Asian', 'Middle Eastern', 'African', 'Caribbean', 'European', 'Snacks', 'Desserts'] },
    { id: 'drinks',    label: 'Drinks',         subcategories: [] },
    { id: 'activities',label: 'Play',           subcategories: ['Sports', 'Creative', 'Outdoor', 'Games'] },
    { id: 'school',    label: 'School',         subcategories: ['Supplies', 'Academic', 'Routines'] },
    { id: 'social',    label: 'Social',         subcategories: ['Greetings', 'Phrases', 'Manners'] },
    { id: 'body',      label: 'Body',           subcategories: ['Parts', 'Health', 'Hygiene'] },
    { id: 'family',    label: 'People',         subcategories: ['Family', 'School', 'Community'] },
    { id: 'places',    label: 'Places',         subcategories: ['Home', 'School', 'Community'] },
    { id: 'bedtime',   label: 'Bedtime',        subcategories: [] },
    { id: 'clothing',  label: 'Clothing',       subcategories: [] },
    { id: 'animals',   label: 'Animals',        subcategories: [] },
    { id: 'custom',    label: 'My Words',       subcategories: [] },
  ];
}

export async function getExistingSymbols() {
  if (!existsSync(SYMBOLS_DIR)) return [];
  try {
    const files = await readdir(SYMBOLS_DIR);
    const symbols = [];
    for (const f of files) {
      if (!f.endsWith('.png') && !f.endsWith('.webp')) continue;
      const base = f.replace(/\.(png|webp)$/, '');
      const metaFile = join(SYMBOLS_DIR, base + '.json');
      let boardName = 'Unknown Board';

      // Try to read metadata
      if (existsSync(metaFile)) {
        try {
          const meta = JSON.parse(await readFile(metaFile, 'utf8'));
          boardName = meta.boardName || boardName;
        } catch {}
      }

      symbols.push({
        fileName: f,
        label: base.replace(/_/g, ' '),
        url: `/symbols/custom/${f}`,
        boardName,
      });
    }
    return symbols;
  } catch {
    return [];
  }
}

// Get all boards with their symbols by importing defaultBoards at runtime
export async function getBoardsWithSymbols() {
  // Dynamically read and parse the boards from the TS source
  const content = await readFile(BOARDS_FILE, 'utf8');

  // Extract board definitions using regex
  const boards = [];
  const boardRegex = /id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*emoji:\s*'([^']*)',/g;
  let match;
  while ((match = boardRegex.exec(content)) !== null) {
    boards.push({ id: match[1], name: match[2], emoji: match[3], symbols: [] });
  }

  // Extract symbols per board — find items arrays
  for (const board of boards) {
    const boardPattern = new RegExp(
      `id:\\s*'${board.id}'[^]*?items:\\s*\\[([^\\]]*(?:\\{[^}]*\\}[^\\]]*)*)]`,
      's'
    );
    const bm = boardPattern.exec(content);
    if (bm) {
      const itemsStr = bm[1];
      const itemRegex = /\{\s*emoji:\s*'([^']*)',\s*label:\s*'([^']*)'/g;
      let im;
      while ((im = itemRegex.exec(itemsStr)) !== null) {
        board.symbols.push({ emoji: im[1], label: im[2] });
      }
    }
  }

  return boards;
}

export async function approveSymbol({ label, category, subcategory, phrase, imageBase64, arasaacFallbackId }) {
  await mkdir(SYMBOLS_DIR, { recursive: true });

  const fileName = labelToFileName(label) + '.png';
  const filePath = join(SYMBOLS_DIR, fileName);
  const imageBuffer = Buffer.from(imageBase64, 'base64');

  // Resize, then make Gemini's dark bg transparent so the card bg shows through
  const { data, info } = await sharp(imageBuffer)
    .resize(500, 500, { fit: 'cover', position: 'center' })
    .flatten({ background: { r: 12, g: 20, b: 40 } })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = Buffer.from(data);
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i+1], b = pixels[i+2];
    // Any dark blue Gemini generates as "background" — make transparent
    if (r < 55 && g < 75 && b < 110 && (r + g + b) < 180) {
      pixels[i+3] = 0;
    }
  }

  await sharp(pixels, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png({ compressionLevel: 8 })
    .toFile(filePath);

  // Save metadata (category/subcategory for tooltip)
  const metaPath = join(SYMBOLS_DIR, fileName.replace(/\.png$/, '.json'));
  await writeFile(metaPath, JSON.stringify({
    label,
    category,
    subcategory: subcategory || category,
    boardName: subcategory ? `${category} > ${subcategory}` : category,
    savedAt: new Date().toISOString(),
  }, null, 2), 'utf8');

  const publicPath = `/symbols/custom/${fileName}`;
  const upperLabel = label.toUpperCase();

  // Update defaultBoards.ts to set imageUrl for this symbol
  try {
    let boardsContent = await readFile(BOARDS_FILE, 'utf8');

    // Find the symbol by label (case-insensitive) and add imageUrl
    // Handles both regular symbols and category symbols
    // Pattern 1: { emoji: '...', label: 'Label', ... }
    // Pattern 2: { emoji: '...', label: 'Label', category: '...' }
    const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const symbolPattern = new RegExp(
      `(\\{\\s*emoji:\\s*'[^']*',\\s*label:\\s*'${escapedLabel}',)([^}]*?)(\\})`,
      'i'
    );

    if (symbolPattern.test(boardsContent)) {
      // Symbol exists, update its imageUrl
      boardsContent = boardsContent.replace(
        symbolPattern,
        `$1\n        imageUrl: '${publicPath}',\n        $2$3`
      );
      console.log(`✅ Updated ${label} in defaultBoards.ts with imageUrl`);
    } else {
      console.warn(`⚠️ Could not find symbol "${label}" in defaultBoards.ts`);
    }

    await writeFile(BOARDS_FILE, boardsContent, 'utf8');
  } catch (e) {
    console.warn(`⚠️ Could not update defaultBoards.ts: ${e.message}`);
  }

  // Update arasaacIds.ts for backward compat (if needed)
  try {
    let arasaacContent = await readFile(ARASAAC_IDS_FILE, 'utf8');

    // Add to ARASAAC_IDS (ID=-1 for custom)
    if (!arasaacContent.includes(`'${upperLabel}'`)) {
      arasaacContent = arasaacContent.replace(
        /};\s*\n\s*\/\*\*\s*\n\s*\* Custom symbol/,
        `  '${upperLabel}': -1,\n};\n\n/**\n * Custom symbol`
      );
    }

    // Add to CUSTOM_SYMBOL_IMAGES
    const entryValue = '`${B}symbols/custom/' + labelToFileName(label) + '.png`';
    if (!arasaacContent.includes(`'${upperLabel}':`)) {
      arasaacContent = arasaacContent.replace(
        /};\s*$/,
        `  '${upperLabel}': ${entryValue},\n};`
      );
    }

    await writeFile(ARASAAC_IDS_FILE, arasaacContent, 'utf8');
    console.log(`✅ Updated arasaacIds.ts with ${upperLabel}`);
  } catch (e) {
    console.warn(`⚠️ Could not update arasaacIds.ts: ${e.message}`);
  }

  return {
    success: true,
    fileName,
    publicPath,
    message: `✅ ${label} saved to ${publicPath}`,
    label,
    upperLabel,
  };
}
