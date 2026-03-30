import { create } from 'zustand';
import { db, type Symbol as DbSymbol, type Board as DbBoard } from '../db';
import { cardColor } from '../data/defaultBoards';
import { getBritishVoiceOverride } from '../data/britishVoiceOverrides';
import { fetchDefaultSymbols, getCachedDefaultSymbols } from '../services/symbolsApi';

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
  addSymbolToBoard: (boardId: string, emoji: string, label: string, phrase: string, imageUrl?: string, wordType?: string) => Promise<void>;
  updateCustomSymbol: (id: string, emoji: string, label: string, phrase: string, imageUrl?: string) => Promise<void>;
  deleteCustomSymbol: (id: string) => Promise<void>;
  // Legacy alias
  addCustomSymbol: (emoji: string, label: string, phrase: string, imageUrl?: string) => Promise<void>;

  // Board management
  createBoard: (name: string, emoji: string, parentId: string | null) => Promise<string>;
  deleteBoard: (boardId: string) => Promise<void>;

  // Move symbol between boards
  moveSymbolToBoard: (symbolId: string, targetBoardId: string) => Promise<void>;

  // Get all boards for picker
  getAllBoards: () => Promise<DbBoard[]>;

  // Vocab filter
  toggleSymbolHidden: (id: string) => Promise<void>;

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
    const { symbols: defaultSymbols } = await fetchDefaultSymbols();

    // Get defaults for this board
    const defaults = defaultSymbols.filter(s => s.boardId === boardId);

    // Get hidden overrides for default symbols
    const hiddenIds = new Set(
      (await db.symbolHidden.toArray()).filter(h => h.hidden).map(h => h.id)
    );

    // Apply hidden overrides to default symbols
    const defaultsWithHidden = defaults.map(s => ({
      ...s,
      hidden: hiddenIds.has(s.id) ? true : s.hidden,
    }));

    // Get user-created symbols for this board
    const userSymbols = await db.symbols.where('boardId').equals(boardId).sortBy('order');

    // Merge: defaults first (preserving order), then user symbols
    const merged = [...defaultsWithHidden, ...userSymbols];
    set({ symbols: merged });
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
    // No seeding needed — default symbols come from symbols.json
    set({ isSeeded: true });
    get().loadSymbols('home');
    get().loadQuickFires();
    get().loadCoreWords();
    get().loadPronunciations();
  },

  // Add symbol to ANY board (TDSnap: not just My Words)
  addSymbolToBoard: async (boardId, emoji, label, phrase, imageUrl, wordType) => {
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

  deleteBoard: async (boardId) => {
    await db.transaction('rw', db.boards, db.symbols, async () => {
      await db.boards.delete(boardId);
      await db.symbols.where('boardId').equals(boardId).delete();
    });
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
    const { boards: defaultBoards } = await fetchDefaultSymbols();
    const userBoards = await db.boards.orderBy('order').toArray();
    return [...defaultBoards, ...userBoards];
  },

  // Vocab filter
  toggleSymbolHidden: async (id) => {
    if (id.startsWith('default-')) {
      // Toggle hidden state in symbolHidden table
      const existing = await db.symbolHidden.get(id);
      if (existing) {
        await db.symbolHidden.put({ id, hidden: !existing.hidden });
      } else {
        // First time hiding — get current state from JSON
        const cached = getCachedDefaultSymbols();
        const sym = cached?.symbols.find(s => s.id === id);
        await db.symbolHidden.put({ id, hidden: !(sym?.hidden ?? false) });
      }
    } else {
      const sym = await db.symbols.get(id);
      if (sym) await db.symbols.update(id, { hidden: !sym.hidden });
    }
    get().loadSymbols(get().currentBoardId);
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

    // Search both defaults and user symbols
    const { symbols: defaultSymbols } = await fetchDefaultSymbols();
    const userSymbols = await db.symbols.toArray();
    const all = [...defaultSymbols, ...userSymbols];

    const results = all.filter((s) =>
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
    const { symbols: defaultSymbols } = await fetchDefaultSymbols();
    const defaults = defaultSymbols.filter(s => s.boardId === 'quickfires');

    const hiddenIds = new Set(
      (await db.symbolHidden.toArray()).filter(h => h.hidden).map(h => h.id)
    );

    const defaultsWithHidden = defaults.map(s => ({
      ...s,
      hidden: hiddenIds.has(s.id) ? true : s.hidden,
    }));

    const userSymbols = await db.symbols.where('boardId').equals('quickfires').sortBy('order');
    const merged = [...defaultsWithHidden, ...userSymbols];
    set({ quickFireSymbols: merged });
  },

  loadCoreWords: async () => {
    const { symbols: defaultSymbols } = await fetchDefaultSymbols();
    const defaults = defaultSymbols.filter(s => s.boardId === 'corewords');

    const hiddenIds = new Set(
      (await db.symbolHidden.toArray()).filter(h => h.hidden).map(h => h.id)
    );

    const defaultsWithHidden = defaults.map(s => ({
      ...s,
      hidden: hiddenIds.has(s.id) ? true : s.hidden,
    }));

    const userSymbols = await db.symbols.where('boardId').equals('corewords').sortBy('order');
    const merged = [...defaultsWithHidden, ...userSymbols];
    set({ coreWordSymbols: merged });
  },
}));
