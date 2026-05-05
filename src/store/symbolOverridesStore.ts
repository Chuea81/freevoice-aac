import { create } from 'zustand';
import { db, type Symbol as DbSymbol, type SymbolOverride } from '../db';

// Built-in symbols (id starting with `default-`) are seeded once and never
// edited in place — instead, every per-button user edit lives here as a thin
// override row keyed by the same id. `applyOverride()` is called wherever
// symbols are read so the UI always sees the merged result. "Reset to
// Default" is a single delete that makes the original seeded values shine
// through again.
//
// Custom (`user-...`) symbols don't use this layer — they're edited in
// place via boardStore.updateCustomButton because they have no original to
// fall back to.

interface OverridesState {
  overrides: Map<string, SymbolOverride>;
  loaded: boolean;

  loadFromDb: () => Promise<void>;
  setOverride: (id: string, patch: Partial<Omit<SymbolOverride, 'id'>>) => Promise<void>;
  deleteOverride: (id: string) => Promise<void>;
}

export const useSymbolOverridesStore = create<OverridesState>((set, get) => ({
  overrides: new Map(),
  loaded: false,

  loadFromDb: async () => {
    const all = await db.symbolOverrides.toArray();
    const map = new Map<string, SymbolOverride>();
    for (const o of all) map.set(o.id, o);
    set({ overrides: map, loaded: true });
  },

  setOverride: async (id, patch) => {
    const existing = await db.symbolOverrides.get(id);
    const next: SymbolOverride = { ...(existing ?? { id }), ...patch, id };
    await db.symbolOverrides.put(next);
    const cur = get().overrides;
    const updated = new Map(cur);
    updated.set(id, next);
    set({ overrides: updated });
  },

  deleteOverride: async (id) => {
    await db.symbolOverrides.delete(id);
    const cur = get().overrides;
    if (!cur.has(id)) return;
    const updated = new Map(cur);
    updated.delete(id);
    set({ overrides: updated });
  },
}));

// Plain function so non-React code (boardStore, search, strips) can apply
// overrides without subscribing to React state. Reads from the same Map the
// store holds, which is mutated synchronously inside set/delete actions.
export function applyOverride(symbol: DbSymbol): DbSymbol {
  const over = useSymbolOverridesStore.getState().overrides.get(symbol.id);
  if (!over) return symbol;
  return {
    ...symbol,
    ...(over.emoji !== undefined     ? { emoji: over.emoji } : {}),
    ...(over.label !== undefined     ? { label: over.label } : {}),
    ...(over.phrase !== undefined    ? { phrase: over.phrase } : {}),
    ...(over.imageUrl !== undefined  ? { imageUrl: over.imageUrl } : {}),
    ...(over.audioBlob !== undefined ? { audioBlob: over.audioBlob } : {}),
    ...(over.audioMime !== undefined ? { audioMime: over.audioMime } : {}),
  };
}

export function applyOverrides(symbols: DbSymbol[]): DbSymbol[] {
  const map = useSymbolOverridesStore.getState().overrides;
  if (map.size === 0) return symbols;
  return symbols.map((s) => {
    const o = map.get(s.id);
    if (!o) return s;
    return {
      ...s,
      ...(o.emoji !== undefined     ? { emoji: o.emoji } : {}),
      ...(o.label !== undefined     ? { label: o.label } : {}),
      ...(o.phrase !== undefined    ? { phrase: o.phrase } : {}),
      ...(o.imageUrl !== undefined  ? { imageUrl: o.imageUrl } : {}),
      ...(o.audioBlob !== undefined ? { audioBlob: o.audioBlob } : {}),
      ...(o.audioMime !== undefined ? { audioMime: o.audioMime } : {}),
    };
  });
}

export function hasOverride(id: string): boolean {
  return useSymbolOverridesStore.getState().overrides.has(id);
}
