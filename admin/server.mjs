import express from 'express';
import cors from 'cors';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { generateSymbol } from './imagen.mjs';
import { approveSymbol, getExistingSymbols, getCategories } from './writer.mjs';
import { config } from 'dotenv';

const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT  = join(__dir, '..');
config({ path: join(__dir, '.env') });

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.static(__dir));

app.get('/', (req, res) => res.sendFile(join(__dir, 'index.html')));
app.get('/emoji', (req, res) => res.sendFile(join(__dir, 'emoji-audit.html')));
app.use('/symbols', express.static(join(ROOT, 'public', 'symbols')));
app.use('/characters', express.static(join(ROOT, 'public', 'characters')));

app.get('/api/categories', async (req, res) => {
  try { res.json(await getCategories()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/symbols', async (req, res) => {
  try { res.json(await getExistingSymbols()); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// GET /api/boards — returns all boards with their symbols from defaultBoards.ts
app.get('/api/boards', async (req, res) => {
  try {
    const { getBoardsWithSymbols } = await import('./writer.mjs');
    res.json(await getBoardsWithSymbols());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Emoji audit — export all symbols as JSON via tsx
app.get('/api/symbols-json', async (req, res) => {
  try {
    const { execSync } = await import('child_process');
    const { writeFileSync, unlinkSync } = await import('fs');
    const tmpFile = join(ROOT, '_dump_symbols.ts');
    writeFileSync(tmpFile, `
      import { getDefaultBoards, getDefaultSymbols } from './src/data/defaultBoards.ts';
      process.stdout.write(JSON.stringify({ boards: getDefaultBoards(), symbols: getDefaultSymbols() }));
    `);
    const json = execSync(`npx tsx "${tmpFile}"`, { cwd: ROOT, maxBuffer: 10 * 1024 * 1024 }).toString();
    try { unlinkSync(tmpFile); } catch {}
    res.json(JSON.parse(json));
  } catch (e) {
    console.error('symbols-json error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/generate', async (req, res) => {
  try {
    const { label, category, style, phrase, extraPrompt } = req.body;
    if (!label) return res.status(400).json({ error: 'Label required' });
    const result = await generateSymbol({ label, category, style, extraPrompt });
    res.json({ imageBase64: result.imageBase64, prompt: result.prompt });
  } catch (e) {
    console.error('Generate error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/approve', async (req, res) => {
  try {
    const { label, category, subcategory, phrase, imageBase64, arasaacFallbackId } = req.body;
    const result = await approveSymbol({ label, category, subcategory, phrase, imageBase64, arasaacFallbackId });
    res.json(result);
  } catch (e) {
    console.error('Approve error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/bulk', async (req, res) => {
  const { symbols } = req.body;
  res.setHeader('Content-Type', 'application/x-ndjson');
  res.setHeader('Transfer-Encoding', 'chunked');
  for (const sym of symbols) {
    try {
      const result = await generateSymbol({ label: sym.label, category: sym.category });
      res.write(JSON.stringify({ status: 'ok', label: sym.label, imageBase64: result.imageBase64 }) + '\n');
    } catch (e) {
      res.write(JSON.stringify({ status: 'error', label: sym.label, error: e.message }) + '\n');
    }
    await new Promise(r => setTimeout(r, 800));
  }
  res.end();
});

const PORT = 3333;
app.listen(PORT, () => {
  console.log(`\n🎨 FreeVoice Admin Tool`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`\n   Ctrl+C to stop\n`);
});
