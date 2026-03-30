import Dexie, { type Table } from 'dexie';
import { getDefaultBoards, getDefaultSymbols } from '../data/defaultBoards';

// ── Types matching PRD Section 4.1 ──

export interface Board {
  id: string;
  name: string;
  emoji: string;
  parentId: string | null;
  order: number;
}

export interface Symbol {
  id: string;
  boardId: string;
  emoji: string;
  label: string;
  phrase: string;
  imageUrl?: string;         // User-uploaded photos ONLY (data: or blob: URLs)
  arasaacId?: number;        // Hardcoded ARASAAC pictogram ID — resolved at render time
  color: string;
  order: number;
  isCategory: boolean;
  targetBoardId?: string;
  hidden?: boolean;
  audioBlob?: ArrayBuffer;
  wordType?: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface SymbolCache {
  keyword: string;
  imageUrl: string;
  cachedAt: number;
}

// ── Database ──

const SCHEMA = {
  boards: 'id, parentId, order',
  symbols: 'id, boardId, order, [boardId+order]',
  settings: 'key',
  symbolCache: 'keyword, cachedAt',
};

class FreeVoiceDB extends Dexie {
  boards!: Table<Board, string>;
  symbols!: Table<Symbol, string>;
  settings!: Table<Setting, string>;
  symbolCache!: Table<SymbolCache, string>;

  constructor() {
    super('FreeVoiceDB');

    this.version(1).stores(SCHEMA);

    this.version(2).stores(SCHEMA).upgrade(async (tx) => {
      await tx.table('symbolCache').clear();
      await tx.table('symbols')
        .where('id').startsWith('default-')
        .modify({ imageUrl: undefined });
    });

    // v3: Full cleanup — ARASAAC URLs no longer stored in symbols.imageUrl.
    this.version(3).stores(SCHEMA).upgrade(async (tx) => {
      await tx.table('symbolCache').clear();
      await tx.table('symbols').toCollection().modify((sym: Symbol) => {
        if (sym.imageUrl && !sym.imageUrl.startsWith('data:') && !sym.imageUrl.startsWith('blob:')) {
          sym.imageUrl = undefined;
        }
      });
    });

    // v4: Sync arasaacId from defaultBoards into existing Dexie records.
    // Symbols were seeded before arasaacId was added to defaultBoards.ts,
    // so existing DB records are missing the field. This writes it in.
    this.version(4).stores(SCHEMA).upgrade(async (tx) => {
      await tx.table('symbolCache').clear();

      // Build a lookup: "boardId|lowercaseLabel" → arasaacId
      const defaults = getDefaultSymbols();
      const idMap = new Map<string, number>();
      for (const sym of defaults) {
        if (sym.arasaacId) {
          idMap.set(`${sym.boardId}|${sym.label.toLowerCase()}`, sym.arasaacId);
        }
      }

      // Walk every symbol in Dexie and patch arasaacId where it matches
      await tx.table('symbols').toCollection().modify((sym: Symbol) => {
        const key = `${sym.boardId}|${sym.label.toLowerCase()}`;
        const id = idMap.get(key);
        if (id && sym.arasaacId !== id) {
          sym.arasaacId = id;
          console.log('[Migration v4] Updated arasaacId for:', sym.label, id);
        }
        // Also clear any stale ARASAAC imageUrl (keep user photos)
        if (sym.imageUrl && !sym.imageUrl.startsWith('data:') && !sym.imageUrl.startsWith('blob:')) {
          sym.imageUrl = undefined;
        }
      });
    });
    // v5: Re-sync all default boards from source.
    // Removes stale symbols (like loose food items on the Food board)
    // and ensures board structure matches current defaultBoards.ts.
    this.version(5).stores(SCHEMA).upgrade(async (tx) => {
      await tx.table('symbolCache').clear();

      // Delete all default-seeded symbols and re-seed from current source
      const symbols = tx.table('symbols');
      const boards = tx.table('boards');

      // Remove all default symbols (keep user-created ones)
      await symbols.where('id').startsWith('default-').delete();

      // Re-insert from current defaultBoards.ts
      const freshSymbols = getDefaultSymbols();
      const freshBoards = getDefaultBoards();
      await boards.bulkPut(freshBoards);
      await symbols.bulkPut(freshSymbols);

      console.log('[Migration v5] Re-synced all default boards and symbols');
    });

    // v6: Symbol expansion sprint — 1145 symbols, 66 boards.
    // Re-sync all defaults to pick up cultural food boards, routines, etc.
    this.version(6).stores(SCHEMA).upgrade(async (tx) => {
      await tx.table('symbolCache').clear();
      await tx.table('symbols').where('id').startsWith('default-').delete();
      const freshSymbols = getDefaultSymbols();
      const freshBoards = getDefaultBoards();
      await tx.table('boards').bulkPut(freshBoards);
      await tx.table('symbols').bulkPut(freshSymbols);
      console.log('[Migration v6] Symbol expansion: 1145 symbols, 66 boards');
    });

    // v7: Fix unsupported emoji — replace Emoji 13-15 codepoints with
    // universally supported alternatives (Emoji 12.0 and below).
    this.version(7).stores(SCHEMA).upgrade(async (tx) => {
      await tx.table('symbolCache').clear();
      await tx.table('symbols').where('id').startsWith('default-').delete();
      const freshSymbols = getDefaultSymbols();
      const freshBoards = getDefaultBoards();
      await tx.table('boards').bulkPut(freshBoards);
      await tx.table('symbols').bulkPut(freshSymbols);
      console.log('[Migration v7] Fixed unsupported emoji — all symbols now use Emoji 12.0 or below');
    });

    // v8: Force re-sync of all default boards to pick up peach emoji fix.
    // Users with cached old data need fresh symbols.
    this.version(8).stores(SCHEMA).upgrade(async (tx) => {
      await tx.table('symbolCache').clear();
      await tx.table('symbols').where('id').startsWith('default-').delete();
      const freshSymbols = getDefaultSymbols();
      const freshBoards = getDefaultBoards();
      await tx.table('boards').bulkPut(freshBoards);
      await tx.table('symbols').bulkPut(freshSymbols);
      console.log('[Migration v8] Re-synced all symbols — fixed inappropriate emoji usage');
    });
  }
}

export const db = new FreeVoiceDB();

// ── Seed on first launch (PRD 4.2) ──

const CURRENT_DATA_VERSION = 8; // Update when defaultBoards.ts changes

export async function seedIfNeeded(): Promise<void> {
  const count = await db.boards.count();

  // Check if we have cached data AND if it's the current version
  if (count > 0) {
    const versionSetting = await db.settings.get('dataVersion');
    const cachedVersion = versionSetting ? parseInt(versionSetting.value, 10) : 0;

    // If cached version matches current version, use it
    if (cachedVersion === CURRENT_DATA_VERSION) {
      return;
    }

    // Version mismatch — clear old data and re-seed with fresh data
    console.log(`[seedIfNeeded] Data version mismatch: cached=${cachedVersion}, current=${CURRENT_DATA_VERSION}. Re-seeding...`);
    await db.transaction('rw', db.boards, db.symbols, db.settings, async () => {
      await db.boards.clear();
      await db.symbols.clear();
    });
  }

  // Seed fresh data from current source
  const boards = getDefaultBoards();
  const symbols = getDefaultSymbols();
  await db.transaction('rw', db.boards, db.symbols, db.settings, async () => {
    await db.boards.bulkPut(boards);
    await db.symbols.bulkPut(symbols);
    await db.settings.put({ key: 'dataVersion', value: String(CURRENT_DATA_VERSION) });
  });

  console.log(`[seedIfNeeded] Seeded fresh data v${CURRENT_DATA_VERSION}`);
}
