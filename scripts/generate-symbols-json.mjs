import { writeFileSync, mkdirSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');

const { getDefaultBoards, getDefaultSymbols } = await import('../src/data/defaultBoards.ts');
const boards = getDefaultBoards();
let symbols = getDefaultSymbols();

// Scan for custom PNG files and add imageUrl to matching symbols
const customDir = join(ROOT, 'public/symbols/custom');
if (existsSync(customDir)) {
  const files = readdirSync(customDir);
  const customPngs = new Set(
    files.filter(f => f.endsWith('.png')).map(f => f.replace(/\.png$/, ''))
  );

  // Map label to PNG filename (both use underscore-separated lowercase)
  symbols = symbols.map(sym => {
    const fileName = sym.label
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    if (customPngs.has(fileName)) {
      return { ...sym, imageUrl: `/app/symbols/custom/${fileName}.png` };
    }
    return sym;
  });
}

mkdirSync(join(ROOT, 'public/api'), { recursive: true });
writeFileSync(
  join(ROOT, 'public/api/symbols.json'),
  JSON.stringify({ boards, symbols }, null, 2)
);

console.log(`Generated symbols.json: ${boards.length} boards, ${symbols.length} symbols`);
