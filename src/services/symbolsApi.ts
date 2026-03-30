import type { Board, Symbol } from '../db';

export interface SymbolsPayload {
  boards: Board[];
  symbols: Symbol[];
}

let cache: SymbolsPayload | null = null;

export async function fetchDefaultSymbols(): Promise<SymbolsPayload> {
  if (cache) return cache;
  const res = await fetch('/app/api/symbols.json');
  if (!res.ok) throw new Error(`symbols.json fetch failed: ${res.status}`);
  cache = await res.json() as SymbolsPayload;
  return cache;
}

export function getCachedDefaultSymbols(): SymbolsPayload | null {
  return cache;
}
