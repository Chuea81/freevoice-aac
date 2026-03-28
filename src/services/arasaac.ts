// ARASAAC API service — fetch pictogram images by keyword
// API docs: https://arasaac.org/developers/api
// Symbols are CC BY-NC-SA 4.0 — credit required, non-commercial use

import { db } from '../db';

const API_BASE = 'https://api.arasaac.org/v1';
const IMAGE_BASE = 'https://static.arasaac.org/pictograms';
const CACHE_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

interface ArasaacSearchResult {
  _id: number;
  keywords: { keyword: string; type: number }[];
}

/**
 * Search ARASAAC for a pictogram matching the keyword.
 * Returns the pictogram image URL or null if not found / offline.
 * Results are cached in the symbolCache table (NOT the symbols table).
 */
export async function searchArasaacImage(
  keyword: string,
  locale: string = 'en',
): Promise<{ imageUrl: string; arasaacId: number } | null> {
  // 1. Check symbolCache first
  const cached = await db.symbolCache.get(keyword.toLowerCase());
  if (cached && Date.now() - cached.cachedAt < CACHE_MAX_AGE_MS) {
    const idMatch = cached.imageUrl.match(/\/(\d+)\//);
    return {
      imageUrl: cached.imageUrl,
      arasaacId: idMatch ? parseInt(idMatch[1], 10) : 0,
    };
  }

  // 2. Fetch from API
  try {
    const res = await fetch(
      `${API_BASE}/pictograms/${locale}/search/${encodeURIComponent(keyword)}`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return null;

    const results: ArasaacSearchResult[] = await res.json();
    if (!results || results.length === 0) return null;

    const exact = results.find((r) =>
      r.keywords.some((k) => k.keyword.toLowerCase() === keyword.toLowerCase()),
    );
    const best = exact || results[0];
    const pictId = best._id;
    const imageUrl = `${IMAGE_BASE}/${pictId}/${pictId}_500.png`;

    // 3. Cache in symbolCache table (NOT in symbols table)
    await db.symbolCache.put({
      keyword: keyword.toLowerCase(),
      imageUrl,
      cachedAt: Date.now(),
    });

    return { imageUrl, arasaacId: pictId };
  } catch {
    return null;
  }
}

/**
 * Get the ARASAAC image URL for a pictogram by its ID.
 * Used when we already know the arasaacId (hardcoded in defaultBoards).
 */
export function getArasaacImageUrl(arasaacId: number): string {
  return `${IMAGE_BASE}/${arasaacId}/${arasaacId}_500.png`;
}

/**
 * Resolve the ARASAAC image URL for a symbol.
 * Priority: arasaacId (direct URL) > symbolCache (keyword lookup) > null (emoji fallback)
 * This is called at render time by SymbolCard. Never writes to the symbols table.
 */
export async function resolveArasaacUrl(symbol: { label: string; arasaacId?: number }): Promise<string | null> {
  // 1. Hardcoded arasaacId — direct URL, no search needed
  if (symbol.arasaacId) {
    return getArasaacImageUrl(symbol.arasaacId);
  }

  // 2. Check symbolCache by keyword
  const cached = await db.symbolCache.get(symbol.label.toLowerCase());
  if (cached && Date.now() - cached.cachedAt < CACHE_MAX_AGE_MS) {
    return cached.imageUrl;
  }

  return null;
}

/**
 * Batch-fetch ARASAAC images for symbols without arasaacId.
 * Writes results to symbolCache table ONLY (never to symbols table).
 */
export async function fetchArasaacForSymbols(
  symbolIds: { id: string; label: string }[],
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  const BATCH_SIZE = 5;
  for (let i = 0; i < symbolIds.length; i += BATCH_SIZE) {
    const batch = symbolIds.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async ({ id, label }) => {
      const result = await searchArasaacImage(label);
      if (result) {
        results.set(id, result.imageUrl);
        // NOTE: We intentionally do NOT write to db.symbols here.
        // symbolCache is the only persistence layer for ARASAAC URLs.
        // SymbolCard resolves the URL at render time via resolveArasaacUrl().
      }
    });
    await Promise.all(promises);
  }

  return results;
}
