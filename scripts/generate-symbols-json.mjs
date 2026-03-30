import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');

const { getDefaultBoards, getDefaultSymbols } = await import('../src/data/defaultBoards.ts');
const boards = getDefaultBoards();
const symbols = getDefaultSymbols();

mkdirSync(join(ROOT, 'public/api'), { recursive: true });
writeFileSync(
  join(ROOT, 'public/api/symbols.json'),
  JSON.stringify({ boards, symbols }, null, 2)
);

console.log(`Generated symbols.json: ${boards.length} boards, ${symbols.length} symbols`);
