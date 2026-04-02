import type { Board, Symbol } from '../db';

export interface SymbolsPayload {
  boards: Board[];
  symbols: Symbol[];
}

let cache: SymbolsPayload | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in development, cleared on reload

export async function fetchDefaultSymbols(): Promise<SymbolsPayload> {
  const now = Date.now();
  if (cache && (now - cacheTime) < CACHE_DURATION) {
    return cache;
  }

  const res = await fetch(`/app/api/symbols.json?t=${now}`);
  if (!res.ok) throw new Error(`symbols.json fetch failed: ${res.status}`);
  cache = await res.json() as SymbolsPayload;
  cacheTime = now;
  return cache;
}

export function getCachedDefaultSymbols(): SymbolsPayload | null {
  return cache;
}

export function clearCache(): void {
  cache = null;
  cacheTime = 0;
}
