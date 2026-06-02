/**
 * Profile backup/restore and board sharing utilities.
 * All offline, no server, no auth.
 */

import { db, type Board, type Symbol, type Setting } from '../db';
import pako from 'pako';

// ── TYPES ──

interface BackupData {
  version: string;
  exportedAt: string;
  appVersion: string;
  profile: {
    boards: Board[];
    symbols: Omit<Symbol, 'imageUrl'>[];
    settings: Setting[];
    // OFF-04: which built-in symbols the caregiver hid. Since v9 this is the
    // ONLY persistent record of that curation — omitting it means every hidden
    // default symbol reappears for the child on a new device.
    symbolHidden?: { id: string; hidden: boolean }[];
  };
  // OFF-04: chosen UI language (fv_language) + selected character
  // (freevoice-character), stored verbatim so restore is exact.
  meta?: { language?: string | null; character?: string | null };
}

interface BoardShareData {
  type: 'freevoice-board';
  version: string;
  board: Board;
  symbols: Omit<Symbol, 'imageUrl'>[];
}

// ── EXPORT ──

export async function exportProfile(): Promise<void> {
  const boards = await db.boards.toArray();
  const rawSymbols = await db.symbols.toArray();
  const settings = await db.settings.toArray();

  // Strip ARASAAC imageUrls — they're re-fetched automatically.
  // Keep only user-uploaded photo data (data: URLs).
  const symbols = rawSymbols.map((s) => {
    const cleaned = { ...s };
    if (cleaned.imageUrl && !cleaned.imageUrl.startsWith('data:')) {
      delete cleaned.imageUrl;
    }
    return cleaned;
  });

  const symbolHidden = await db.symbolHidden.toArray();

  const data: BackupData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    appVersion: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0',
    profile: { boards, symbols, settings, symbolHidden },
    meta: {
      language: typeof localStorage !== 'undefined' ? localStorage.getItem('fv_language') : null,
      character: typeof localStorage !== 'undefined' ? localStorage.getItem('freevoice-character') : null,
    },
  };

  downloadJson(data, `freevoice-backup-${new Date().toISOString().slice(0, 10)}.json`);
}

// ── IMPORT (Replace) ──

export async function importProfile(file: File): Promise<{ success: boolean; error?: string }> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.profile?.boards && !data.boards) {
      return { success: false, error: 'Invalid backup file — no boards found.' };
    }

    // Support both old format (boards at root) and new format (profile wrapper)
    let boards = data.profile?.boards || data.boards;
    let symbols = data.profile?.symbols || data.symbols;
    const settings = data.profile?.settings || data.settings;

    if (!boards || !symbols) {
      return { success: false, error: 'Invalid backup file.' };
    }

    // Filter out default-* boards/symbols to prevent duplicates
    boards = boards.filter((b: Board) => !b.id.startsWith('default-'));
    symbols = symbols.filter((s: Symbol) => !s.id.startsWith('default-'));

    // OFF-04: hidden-default curation (absent in legacy backups → skipped).
    const symbolHidden = data.profile?.symbolHidden;

    // Auto-backup before replacing
    await exportProfile();

    await db.transaction('rw', db.boards, db.symbols, db.settings, db.symbolHidden, async () => {
      await db.boards.clear();
      await db.symbols.clear();
      await db.settings.clear();
      await db.boards.bulkPut(boards);
      await db.symbols.bulkPut(symbols);
      if (settings) await db.settings.bulkPut(settings);
      if (Array.isArray(symbolHidden)) {
        await db.symbolHidden.clear();
        await db.symbolHidden.bulkPut(symbolHidden);
      }
    });

    // OFF-04: restore language + selected character (verbatim).
    if (data.meta && typeof localStorage !== 'undefined') {
      if (data.meta.language) localStorage.setItem('fv_language', data.meta.language);
      if (data.meta.character) localStorage.setItem('freevoice-character', data.meta.character);
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to parse backup file.' };
  }
}

// ── IMPORT (Merge) ──

export async function mergeImport(file: File): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    let boards: Board[] = data.profile?.boards || data.boards || [];
    let symbols: Symbol[] = data.profile?.symbols || data.symbols || [];

    // Filter out default-* to prevent duplicates
    boards = boards.filter((b) => !b.id.startsWith('default-'));
    symbols = symbols.filter((s) => !s.id.startsWith('default-'));

    if (boards.length === 0 && symbols.length === 0) {
      return { success: false, count: 0, error: 'No boards or symbols found.' };
    }

    const ts = Date.now();
    let count = 0;

    await db.transaction('rw', db.boards, db.symbols, async () => {
      for (const board of boards) {
        const newId = `import-${ts}-${board.id}`;
        const existing = await db.boards.get(board.id);
        const id = existing ? newId : board.id;
        await db.boards.put({ ...board, id });

        // Re-map symbols for this board
        const boardSymbols = symbols.filter((s) => s.boardId === board.id);
        for (const sym of boardSymbols) {
          const symId = `import-${ts}-${sym.id}`;
          await db.symbols.put({ ...sym, id: symId, boardId: id });
          count++;
        }
      }
    });

    return { success: true, count };
  } catch {
    return { success: false, count: 0, error: 'Failed to parse file.' };
  }
}

// ── BOARD SHARE (compress to URL) ──

export async function shareBoardAsUrl(boardId: string): Promise<string | null> {
  const board = await db.boards.get(boardId);
  if (!board) return null;

  const rawSymbols = await db.symbols.where('boardId').equals(boardId).toArray();
  const symbols = rawSymbols.map((s) => {
    const cleaned = { ...s };
    if (cleaned.imageUrl && !cleaned.imageUrl.startsWith('data:')) {
      delete cleaned.imageUrl;
    }
    return cleaned;
  });

  const shareData: BoardShareData = {
    type: 'freevoice-board',
    version: '1.0',
    board,
    symbols,
  };

  const json = JSON.stringify(shareData);
  const compressed = pako.deflate(new TextEncoder().encode(json));
  // OFF-10: chunk the byte→string conversion. `String.fromCharCode(...bytes)`
  // spreads every byte as an argument and overflows the call stack on large
  // boards. Build the binary string in 0x8000-byte windows instead.
  let binary = '';
  for (let i = 0; i < compressed.length; i += 0x8000) {
    binary += String.fromCharCode(...compressed.subarray(i, i + 0x8000));
  }
  const base64 = btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  // Build the share URL
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://freevoiceaac.app';
  return `${baseUrl}/app/?board=${base64}`;
}

// ── BOARD IMPORT (from URL) ──

export async function importBoardFromUrl(encoded: string): Promise<{ success: boolean; boardName?: string; error?: string }> {
  try {
    // Restore base64 padding
    const padded = encoded + '==='.slice(0, (4 - (encoded.length % 4)) % 4);
    const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const decompressed = pako.inflate(bytes);
    const json = new TextDecoder().decode(decompressed);
    const data: BoardShareData = JSON.parse(json);

    if (data.type !== 'freevoice-board' || !data.board || !data.symbols) {
      return { success: false, error: 'Invalid board share link.' };
    }

    const ts = Date.now();
    const newBoardId = `shared-${ts}-${data.board.id}`;

    await db.transaction('rw', db.boards, db.symbols, async () => {
      await db.boards.put({ ...data.board, id: newBoardId });
      for (const sym of data.symbols) {
        await db.symbols.put({
          ...sym,
          id: `shared-${ts}-${sym.id}`,
          boardId: newBoardId,
        });
      }
    });

    return { success: true, boardName: data.board.name };
  } catch {
    return { success: false, error: 'Failed to decode board share link.' };
  }
}

// ── HELPERS ──

function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
