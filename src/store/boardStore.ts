import { create } from 'zustand';
import { db, seedIfNeeded, type Symbol as DbSymbol, type Board as DbBoard } from '../db';
import { cardColor } from '../data/defaultBoards';
import { getBritishVoiceOverride } from '../data/britishVoiceOverrides';
import { applyOverrides } from './symbolOverridesStore';

interface NavStep {
  boardId: string;
  label: string;
  emoji: string;
}

export interface SpeechToken {
  emoji: string;
  text: string;
}

interface BoardState {
  currentBoardId: string;
  navStack: NavStep[];
  activeTab: string;
  outputTokens: SpeechToken[];
  symbols: DbSymbol[];
  isSeeded: boolean;

  // Persistent strips
  quickFireSymbols: DbSymbol[];
  coreWordSymbols: DbSymbol[];

  // Search
  searchResults: DbSymbol[];
  searchQuery: string;

  // Pronunciation dictionary
  pronunciations: Map<string, string>;

  // Actions
  setActiveTab: (tabId: string) => void;
  navigateToBoard: (boardId: string, label: string, emoji: string) => void;
  navigateToCrumb: (index: number) => void;
  loadSymbols: (boardId: string) => Promise<void>;
  addToken: (emoji: string, text: string) => void;
  removeLastToken: () => void;
  clearTokens: () => void;
  seedDatabase: () => Promise<void>;

  // Custom symbol CRUD — works on ANY board
  addSymbolToBoard: (
    boardId: string,
    emoji: string,
    label: string,
    phrase: string,
    imageUrl?: string,
    wordType?: string,
    audioBlob?: ArrayBuffer,
    audioMime?: string,
  ) => Promise<void>;
  updateCustomSymbol: (id: string, emoji: string, label: string, phrase: string, imageUrl?: string) => Promise<void>;
  deleteCustomSymbol: (id: string) => Promise<void>;
  // Legacy alias
  addCustomSymbol: (emoji: string, label: string, phrase: string, imageUrl?: string) => Promise<void>;

  // Board management
  createBoard: (name: string, emoji: string, parentId: string | null) => Promise<string>;
  // Atomically creates a board AND its category-tile symbol on the parent so
  // the new board both exists and is reachable from the parent's grid in one
  // write. Returns the new board's id.
  createCustomBoard: (
    name: string,
    emoji: string,
    color: string,
    imageUrl: string | undefined,
    parentId?: string,
  ) => Promise<string>;
  deleteBoard: (boardId: string) => Promise<void>;

  // Move symbol between boards
  moveSymbolToBoard: (symbolId: string, targetBoardId: string) => Promise<void>;

  // Get all boards for picker
  getAllBoards: () => Promise<DbBoard[]>;

  // ── Phase 3: management actions ──
  // Update a custom button. If `updates.boardId` differs from the current
  // board, the symbol is moved (and its order is set to the end of the new
  // board so it doesn't collide with existing positions).
  updateCustomButton: (
    id: string,
    updates: Partial<{
      emoji: string;
      label: string;
      phrase: string;
      imageUrl?: string;
      boardId: string;
      audioBlob?: ArrayBuffer;
      audioMime?: string;
    }>,
  ) => Promise<void>;
  // Update a custom board's metadata. Writes to both the Board record and
  // its category-tile Symbol on the parent so they stay in sync.
  updateCustomBoardMeta: (
    boardId: string,
    updates: { name?: string; emoji?: string; color?: string; imageUrl?: string },
  ) => Promise<void>;
  // Delete a custom board AND every symbol inside it AND its category tile.
  deleteCustomBoardCascade: (boardId: string) => Promise<void>;
  // Move every symbol inside a custom board to the target board, then delete
  // the now-empty board and its category tile.
  deleteCustomBoardMoveContents: (boardId: string, moveToBoardId: string) => Promise<void>;
  // Copy a custom button into the same board with " (copy)" suffix.
  duplicateCustomButton: (id: string) => Promise<void>;
  // Re-write `order` for the given custom symbol ids in the order received.
  // Built-in symbols on the same board keep their existing positions; custom
  // ones are renumbered to sit AFTER the highest built-in order.
  reorderSymbolsInBoard: (boardId: string, customIdsInOrder: string[]) => Promise<void>;
  // Reorder custom category-tile symbols on the home grid, plus the matching
  // Board.order so the data stays consistent.
  reorderCustomBoardsOnHome: (customCategorySymbolIdsInOrder: string[]) => Promise<void>;

  // Vocab filter
  toggleSymbolHidden: (id: string) => Promise<void>;

  // Favorite highlight
  setSymbolHighlight: (id: string, color: string | null) => Promise<void>;

  // Sort
  sortBoardAlphabetically: (boardId: string) => Promise<void>;

  // Search
  searchSymbols: (query: string) => Promise<void>;
  clearSearch: () => void;

  // Pronunciation
  loadPronunciations: () => Promise<void>;
  setPronunciation: (word: string, phonetic: string) => Promise<void>;
  deletePronunciation: (word: string) => Promise<void>;
  getPronunciation: (text: string, voice?: string) => string;

  // Persistent strips
  loadQuickFires: () => Promise<void>;
  loadCoreWords: () => Promise<void>;
}

export const useBoardStore = create<BoardState>((set, get) => ({
  currentBoardId: 'home',
  navStack: [],
  activeTab: 'home',
  outputTokens: [],
  symbols: [],
  isSeeded: false,
  quickFireSymbols: [],
  coreWordSymbols: [],
  searchResults: [],
  searchQuery: '',
  pronunciations: new Map(),

  setActiveTab: (tabId: string) => {
    set({ activeTab: tabId, navStack: [], currentBoardId: tabId });
    get().loadSymbols(tabId);
  },

  navigateToBoard: (boardId: string, label: string, emoji: string) => {
    const { navStack } = get();
    set({
      currentBoardId: boardId,
      navStack: [...navStack, { boardId, label, emoji }],
    });
    get().loadSymbols(boardId);
  },

  navigateToCrumb: (index: number) => {
    const { navStack, activeTab } = get();
    if (index < 0) {
      set({ navStack: [], currentBoardId: activeTab });
      get().loadSymbols(activeTab);
    } else {
      const step = navStack[index];
      set({
        navStack: navStack.slice(0, index + 1),
        currentBoardId: step.boardId,
      });
      get().loadSymbols(step.boardId);
    }
  },

  loadSymbols: async (boardId: string) => {
    const raw = await db.symbols
      .where('boardId')
      .equals(boardId)
      .sortBy('order');
    set({ symbols: applyOverrides(raw) });
  },

  addToken: (emoji: string, text: string) => {
    set((state) => ({
      outputTokens: [...state.outputTokens, { emoji, text }],
    }));
  },

  removeLastToken: () => {
    set((state) => ({
      outputTokens: state.outputTokens.slice(0, -1),
    }));
  },

  clearTokens: () => {
    set({ outputTokens: [] });
  },

  seedDatabase: async () => {
    await seedIfNeeded();
    set({ isSeeded: true });
    get().loadSymbols('home');
    get().loadQuickFires();
    get().loadCoreWords();
    get().loadPronunciations();
  },

  // Add symbol to ANY board (TDSnap: not just My Words)
  addSymbolToBoard: async (boardId, emoji, label, phrase, imageUrl, wordType, audioBlob, audioMime) => {
    const count = await db.symbols.where('boardId').equals(boardId).count();
    const symbol: DbSymbol = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      boardId,
      emoji,
      label,
      phrase: phrase || label,
      color: cardColor(count + 2),
      order: count,
      isCategory: false,
      imageUrl,
      audioBlob,
      audioMime,
      wordType,
    };
    await db.symbols.add(symbol);
    if (get().currentBoardId === boardId) {
      get().loadSymbols(boardId);
    }
  },

  addCustomSymbol: async (emoji, label, phrase, imageUrl) => {
    await get().addSymbolToBoard('custom', emoji, label, phrase, imageUrl);
  },

  updateCustomSymbol: async (id, emoji, label, phrase, imageUrl) => {
    await db.symbols.update(id, {
      emoji,
      label,
      phrase: phrase || label,
      imageUrl,
    });
    const { currentBoardId } = get();
    get().loadSymbols(currentBoardId);
  },

  deleteCustomSymbol: async (id) => {
    await db.symbols.delete(id);
    const { currentBoardId } = get();
    get().loadSymbols(currentBoardId);
  },

  // Board management
  createBoard: async (name, emoji, parentId) => {
    const id = `board-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const count = await db.boards.count();
    const board: DbBoard = { id, name, emoji, parentId, order: count };
    await db.boards.add(board);
    return id;
  },

  createCustomBoard: async (name, emoji, color, imageUrl, parentId = 'home') => {
    const newBoardId = await get().createBoard(name, emoji, parentId);
    const symbolCount = await db.symbols.where('boardId').equals(parentId).count();
    const categorySymbol: DbSymbol = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      boardId: parentId,
      emoji,
      label: name,
      phrase: name,
      color,
      imageUrl,
      order: symbolCount,
      isCategory: true,
      targetBoardId: newBoardId,
    };
    await db.symbols.add(categorySymbol);
    if (get().currentBoardId === parentId) {
      get().loadSymbols(parentId);
    }
    return newBoardId;
  },

  deleteBoard: async (boardId) => {
    await db.transaction('rw', db.boards, db.symbols, async () => {
      await db.boards.delete(boardId);
      await db.symbols.where('boardId').equals(boardId).delete();
    });
  },

  // ── Phase 3: management actions ──
  updateCustomButton: async (id, updates) => {
    const existing = await db.symbols.get(id);
    if (!existing) return;
    const moving = updates.boardId !== undefined && updates.boardId !== existing.boardId;
    const patch: Partial<DbSymbol> = { ...updates };
    if (patch.label !== undefined && patch.phrase === undefined) {
      patch.phrase = updates.phrase ?? patch.label;
    }
    if (moving) {
      const targetCount = await db.symbols.where('boardId').equals(updates.boardId!).count();
      patch.order = targetCount;
    }
    await db.symbols.update(id, patch);
    const cur = get().currentBoardId;
    if (cur === existing.boardId || (moving && cur === updates.boardId)) {
      get().loadSymbols(cur);
    }
  },

  updateCustomBoardMeta: async (boardId, updates) => {
    await db.transaction('rw', db.boards, db.symbols, async () => {
      const boardPatch: Partial<DbBoard> = {};
      if (updates.name !== undefined) boardPatch.name = updates.name;
      if (updates.emoji !== undefined) boardPatch.emoji = updates.emoji;
      if (Object.keys(boardPatch).length) await db.boards.update(boardId, boardPatch);

      const allSyms = await db.symbols.toArray();
      const categorySym = allSyms.find((s) => s.isCategory && s.targetBoardId === boardId && s.id.startsWith('user-'));
      if (categorySym) {
        const symPatch: Partial<DbSymbol> = {};
        if (updates.name !== undefined)     { symPatch.label = updates.name; symPatch.phrase = updates.name; }
        if (updates.emoji !== undefined)    symPatch.emoji = updates.emoji;
        if (updates.color !== undefined)    symPatch.color = updates.color;
        if (updates.imageUrl !== undefined) symPatch.imageUrl = updates.imageUrl;
        if (Object.keys(symPatch).length)   await db.symbols.update(categorySym.id, symPatch);
      }
    });
    const cur = get().currentBoardId;
    if (cur === 'home' || cur === boardId) get().loadSymbols(cur);
  },

  deleteCustomBoardCascade: async (boardId) => {
    await db.transaction('rw', db.boards, db.symbols, async () => {
      // Remove the category tile pointing to this board
      const allSyms = await db.symbols.toArray();
      const categorySym = allSyms.find((s) => s.isCategory && s.targetBoardId === boardId && s.id.startsWith('user-'));
      if (categorySym) await db.symbols.delete(categorySym.id);
      await db.symbols.where('boardId').equals(boardId).delete();
      await db.boards.delete(boardId);
    });
    const cur = get().currentBoardId;
    if (cur === boardId) {
      // The board the user was on no longer exists — bounce back to home.
      set({ currentBoardId: 'home', navStack: [] });
      get().loadSymbols('home');
    } else if (cur === 'home') {
      get().loadSymbols('home');
    }
  },

  deleteCustomBoardMoveContents: async (boardId, moveToBoardId) => {
    await db.transaction('rw', db.boards, db.symbols, async () => {
      const symsInBoard = await db.symbols.where('boardId').equals(boardId).toArray();
      const targetCount = await db.symbols.where('boardId').equals(moveToBoardId).count();
      // Move each symbol to the target board, appending after existing items.
      for (let i = 0; i < symsInBoard.length; i++) {
        await db.symbols.update(symsInBoard[i].id, { boardId: moveToBoardId, order: targetCount + i });
      }
      const allSyms = await db.symbols.toArray();
      const categorySym = allSyms.find((s) => s.isCategory && s.targetBoardId === boardId && s.id.startsWith('user-'));
      if (categorySym) await db.symbols.delete(categorySym.id);
      await db.boards.delete(boardId);
    });
    const cur = get().currentBoardId;
    if (cur === boardId) {
      set({ currentBoardId: 'home', navStack: [] });
      get().loadSymbols('home');
    } else if (cur === 'home' || cur === moveToBoardId) {
      get().loadSymbols(cur);
    }
  },

  duplicateCustomButton: async (id) => {
    const src = await db.symbols.get(id);
    if (!src) return;
    const count = await db.symbols.where('boardId').equals(src.boardId).count();
    const copy: DbSymbol = {
      ...src,
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: `${src.label} (copy)`,
      order: count,
    };
    await db.symbols.add(copy);
    if (get().currentBoardId === src.boardId) get().loadSymbols(src.boardId);
  },

  reorderSymbolsInBoard: async (boardId, customIdsInOrder) => {
    // Find the highest order among non-custom symbols on this board so custom
    // items get renumbered into a contiguous block above them. Built-in
    // positions are never touched.
    const all = await db.symbols.where('boardId').equals(boardId).toArray();
    const builtinMaxOrder = all
      .filter((s) => !s.id.startsWith('user-'))
      .reduce((max, s) => Math.max(max, s.order), -1);
    await db.transaction('rw', db.symbols, async () => {
      for (let i = 0; i < customIdsInOrder.length; i++) {
        await db.symbols.update(customIdsInOrder[i], { order: builtinMaxOrder + 1 + i });
      }
    });
    if (get().currentBoardId === boardId) get().loadSymbols(boardId);
  },

  reorderCustomBoardsOnHome: async (customCategorySymbolIdsInOrder) => {
    const allHome = await db.symbols.where('boardId').equals('home').toArray();
    const builtinMaxOrder = allHome
      .filter((s) => !s.id.startsWith('user-'))
      .reduce((max, s) => Math.max(max, s.order), -1);
    await db.transaction('rw', db.boards, db.symbols, async () => {
      for (let i = 0; i < customCategorySymbolIdsInOrder.length; i++) {
        const symId = customCategorySymbolIdsInOrder[i];
        const sym = await db.symbols.get(symId);
        if (!sym) continue;
        const newOrder = builtinMaxOrder + 1 + i;
        await db.symbols.update(symId, { order: newOrder });
        if (sym.targetBoardId) {
          await db.boards.update(sym.targetBoardId, { order: newOrder });
        }
      }
    });
    if (get().currentBoardId === 'home') get().loadSymbols('home');
  },

  // Move symbol between boards
  moveSymbolToBoard: async (symbolId, targetBoardId) => {
    const count = await db.symbols.where('boardId').equals(targetBoardId).count();
    await db.symbols.update(symbolId, { boardId: targetBoardId, order: count });
    // Reload current board to remove the moved symbol
    get().loadSymbols(get().currentBoardId);
  },

  // Get all boards for picker
  getAllBoards: async () => {
    return db.boards.orderBy('order').toArray();
  },

  // Vocab filter
  toggleSymbolHidden: async (id) => {
    const sym = await db.symbols.get(id);
    if (sym) {
      await db.symbols.update(id, { hidden: !sym.hidden });
      get().loadSymbols(get().currentBoardId);
    }
  },

  // Favorite highlight
  setSymbolHighlight: async (id, color) => {
    const sym = await db.symbols.get(id);
    if (sym) {
      await db.symbols.update(id, { highlightColor: color ?? undefined });
      get().loadSymbols(get().currentBoardId);
    }
  },

  // Sort
  sortBoardAlphabetically: async (boardId) => {
    const symbols = await db.symbols.where('boardId').equals(boardId).sortBy('label');
    await db.transaction('rw', db.symbols, async () => {
      for (let i = 0; i < symbols.length; i++) {
        await db.symbols.update(symbols[i].id, { order: i });
      }
    });
    if (get().currentBoardId === boardId) {
      get().loadSymbols(boardId);
    }
  },

  // Search
  searchSymbols: async (query) => {
    if (!query.trim()) {
      set({ searchResults: [], searchQuery: '' });
      return;
    }
    const q = query.toLowerCase();
    const raw = await db.symbols.toArray();
    const merged = applyOverrides(raw);
    const results = merged.filter((s) =>
      s.label.toLowerCase().includes(q) ||
      s.phrase.toLowerCase().includes(q)
    ).slice(0, 50);
    set({ searchResults: results, searchQuery: query });
  },

  clearSearch: () => {
    set({ searchResults: [], searchQuery: '' });
  },

  // Pronunciation dictionary
  loadPronunciations: async () => {
    const all = await db.settings.toArray();
    const map = new Map<string, string>();
    for (const s of all) {
      if (s.key.startsWith('pron:')) {
        map.set(s.key.slice(5), s.value);
      }
    }
    set({ pronunciations: map });
  },

  setPronunciation: async (word, phonetic) => {
    await db.settings.put({ key: `pron:${word.toLowerCase()}`, value: phonetic });
    get().loadPronunciations();
  },

  deletePronunciation: async (word) => {
    await db.settings.delete(`pron:${word.toLowerCase()}`);
    get().loadPronunciations();
  },

  getPronunciation: (text, voice = '') => {
    let result = text;

    // Apply British voice overrides first (if applicable)
    result = getBritishVoiceOverride(result, voice);

    // Then apply custom user pronunciations (which can override built-in rules)
    const { pronunciations } = get();
    for (const [word, phonetic] of pronunciations) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      result = result.replace(regex, phonetic);
    }
    return result;
  },

  // Persistent strips
  loadQuickFires: async () => {
    const raw = await db.symbols
      .where('boardId')
      .equals('quickfires')
      .sortBy('order');
    set({ quickFireSymbols: applyOverrides(raw) });
  },

  loadCoreWords: async () => {
    const raw = await db.symbols
      .where('boardId')
      .equals('corewords')
      .sortBy('order');
    set({ coreWordSymbols: applyOverrides(raw) });
  },
}));
