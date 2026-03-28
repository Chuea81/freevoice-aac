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
  }
}

export const db = new FreeVoiceDB();

// ── Seed on first launch (PRD 4.2) ──

export async function seedIfNeeded(): Promise<void> {
  const count = await db.boards.count();
  if (count > 0) return;

  const boards = getDefaultBoards();
  const symbols = getDefaultSymbols();
  await db.transaction('rw', db.boards, db.symbols, async () => {
    await db.boards.bulkPut(boards);
    await db.symbols.bulkPut(symbols);
  });
}
