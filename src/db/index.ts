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
  imageUrl?: string;         // ARASAAC URL or user-uploaded blob URL
  arasaacId?: number;        // ARASAAC pictogram ID for future fetching
  color: string;
  order: number;
  isCategory: boolean;
  targetBoardId?: string;    // for category cards that navigate to another board
  hidden?: boolean;          // vocab filter: hidden from Use Mode, visible in Edit Mode
  audioBlob?: ArrayBuffer;   // recorded voice per button (TDSnap analysis)
  wordType?: string;         // for Fitzgerald Key coloring: noun, verb, adjective, pronoun, social, descriptor
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

class FreeVoiceDB extends Dexie {
  boards!: Table<Board, string>;
  symbols!: Table<Symbol, string>;
  settings!: Table<Setting, string>;
  symbolCache!: Table<SymbolCache, string>;

  constructor() {
    super('FreeVoiceDB');

    this.version(1).stores({
      boards: 'id, parentId, order',
      symbols: 'id, boardId, order, [boardId+order]',
      settings: 'key',
      symbolCache: 'keyword, cachedAt',
    });

    // v2: Clear stale symbolCache (may contain B&W or wrong ARASAAC URLs)
    // and clear old symbol imageUrls so hardcoded arasaacId symbols get fresh images
    this.version(2).stores({
      boards: 'id, parentId, order',
      symbols: 'id, boardId, order, [boardId+order]',
      settings: 'key',
      symbolCache: 'keyword, cachedAt',
    }).upgrade(async (tx) => {
      // Clear the entire symbol cache — forces fresh fetches
      await tx.table('symbolCache').clear();
      // Clear imageUrl on all default symbols so they re-fetch with correct IDs
      await tx.table('symbols')
        .where('id').startsWith('default-')
        .modify({ imageUrl: undefined });
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
