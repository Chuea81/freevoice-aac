// Creates placeholder PNG files so the app doesn't 404 during development.
// Run: node scripts/create-character-placeholders.mjs

import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dir, '..', 'public', 'characters');

const CHARACTERS = ['char_001', 'char_002'];
const EMOTIONS = [
  'happy','sad','angry','scared','tired','sick','bored','love',
  'frustrated','good','worried','excited','nervous','calm',
  'confused','surprised','proud','lonely','embarrassed',
  'hurt_feelings','shy','silly','grateful','disappointed',
];

// Minimal valid 1x1 transparent PNG
const EMPTY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

for (const charId of CHARACTERS) {
  await mkdir(join(PUBLIC, 'preview'), { recursive: true });
  await writeFile(join(PUBLIC, 'preview', `${charId}.png`), EMPTY_PNG);
  console.log(`✓ preview/${charId}.png`);

  await mkdir(join(PUBLIC, 'symbols', charId, 'emotions'), { recursive: true });
  for (const emotion of EMOTIONS) {
    await writeFile(
      join(PUBLIC, 'symbols', charId, 'emotions', `${emotion}.png`),
      EMPTY_PNG
    );
  }
  console.log(`✓ ${charId}/emotions/ (${EMOTIONS.length} files)`);
}

console.log('\n✅ Placeholder files created.');
console.log('🧑 MANUAL: Replace placeholder PNGs with actual character art.');
