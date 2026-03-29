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
    return files
      .filter(f => f.endsWith('.png') || f.endsWith('.webp'))
      .map(f => ({
        fileName: f,
        label: f.replace(/\.(png|webp)$/, '').replace(/_/g, ' '),
        url: `/symbols/custom/${f}`,
      }));
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

  // Just resize — CSS handles the dark card background
  await sharp(imageBuffer)
    .resize(500, 500, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png({ compressionLevel: 8 })
    .toFile(filePath);

  const publicPath = `/symbols/custom/${fileName}`;
  const upperLabel = label.toUpperCase();

  // Add to CUSTOM_SYMBOL_IMAGES in arasaacIds.ts
  try {
    let content = await readFile(ARASAAC_IDS_FILE, 'utf8');

    // Add to ARASAAC_IDS (ID=-1 for custom)
    if (!content.includes(`'${upperLabel}'`)) {
      content = content.replace(
        /};\s*\n\s*\/\*\*\s*\n\s*\* Custom symbol/,
        `  '${upperLabel}': -1,\n};\n\n/**\n * Custom symbol`
      );
    }

    // Add to CUSTOM_SYMBOL_IMAGES
    if (!content.includes(`'${upperLabel}': customPath`)) {
      content = content.replace(
        /};\s*$/,
        `  '${upperLabel}': customPath('custom', '${labelToFileName(label)}'),\n};`
      );
    }

    await writeFile(ARASAAC_IDS_FILE, content, 'utf8');
    console.log(`✅ Updated arasaacIds.ts with ${upperLabel}`);
  } catch (e) {
    console.warn(`⚠️ Could not update arasaacIds.ts: ${e.message}`);
    console.warn(`   Add manually: '${upperLabel}': -1, and customPath entry`);
  }

  return {
    success: true,
    fileName,
    publicPath,
    message: `✅ ${label} saved to ${publicPath}`,
  };
}
