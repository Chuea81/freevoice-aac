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

  // OFF-02: NO cache-buster query param. The `?t=${now}` previously appended
  // here bypassed the Workbox precache route, so an offline cold start fetched
  // over the network, failed, and rendered an empty board (no symbols = no
  // voice). The clean URL is served from the precache when offline.
  try {
    const res = await fetch('/app/api/symbols.json');
    if (!res.ok) throw new Error(`symbols.json fetch failed: ${res.status}`);
    cache = await res.json() as SymbolsPayload;
    cacheTime = now;
    return cache;
  } catch (err) {
    // Belt-and-suspenders for offline: try the Cache Storage directly, then
    // fall back to the last-good in-memory payload before giving up.
    try {
      const cached = await caches.match('/app/api/symbols.json', { ignoreSearch: true });
      if (cached) {
        cache = await cached.json() as SymbolsPayload;
        cacheTime = now;
        return cache;
      }
    } catch {
      // Cache Storage unavailable — fall through.
    }
    if (cache) return cache;
    throw err;
  }
}

export function getCachedDefaultSymbols(): SymbolsPayload | null {
  return cache;
}

export function clearCache(): void {
  cache = null;
  cacheTime = 0;
}
