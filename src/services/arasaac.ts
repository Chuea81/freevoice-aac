// ARASAAC API service — fetch pictogram images by keyword
// API docs: https://arasaac.org/developers/api
// Symbols are CC BY-NC-SA 4.0 — credit required, non-commercial use

import { db } from '../db';

const API_BASE = 'https://api.arasaac.org/v1';
const IMAGE_BASE = 'https://static.arasaac.org/pictograms';
const CACHE_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days (PRD 6.2)

interface ArasaacSearchResult {
  _id: number;
  keywords: { keyword: string; type: number }[];
}

/**
 * Search ARASAAC for a pictogram matching the keyword.
 * Returns the pictogram image URL or null if not found / offline.
 */
export async function searchArasaacImage(
  keyword: string,
  locale: string = 'en',
): Promise<{ imageUrl: string; arasaacId: number } | null> {
  // 1. Check cache first
  const cached = await db.symbolCache.get(keyword.toLowerCase());
  if (cached && Date.now() - cached.cachedAt < CACHE_MAX_AGE_MS) {
    // Extract arasaacId from cached URL
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

    // Pick the best match — prefer exact keyword match, fallback to first result
    const exact = results.find((r) =>
      r.keywords.some((k) => k.keyword.toLowerCase() === keyword.toLowerCase()),
    );
    const best = exact || results[0];
    const pictId = best._id;

    // Build image URL (500px PNG, no color overrides)
    const imageUrl = `${IMAGE_BASE}/${pictId}/${pictId}_500.png`;

    // 3. Cache the result
    await db.symbolCache.put({
      keyword: keyword.toLowerCase(),
      imageUrl,
      cachedAt: Date.now(),
    });

    return { imageUrl, arasaacId: pictId };
  } catch {
    // Network error, timeout, or offline — return null (emoji fallback)
    return null;
  }
}

/**
 * Get the ARASAAC image URL for a pictogram by its ID.
 * Used when we already know the arasaacId.
 */
export function getArasaacImageUrl(arasaacId: number): string {
  return `${IMAGE_BASE}/${arasaacId}/${arasaacId}_500.png`;
}

/**
 * Batch-fetch ARASAAC images for symbols that don't have imageUrl yet.
 * Updates the symbols in IndexedDB. Non-blocking, best-effort.
 */
export async function fetchArasaacForSymbols(
  symbolIds: { id: string; label: string }[],
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  // Process in small batches to avoid hammering the API
  const BATCH_SIZE = 5;
  for (let i = 0; i < symbolIds.length; i += BATCH_SIZE) {
    const batch = symbolIds.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async ({ id, label }) => {
      const result = await searchArasaacImage(label);
      if (result) {
        results.set(id, result.imageUrl);
        // Persist the imageUrl and arasaacId to the symbol in DB
        await db.symbols.update(id, {
          imageUrl: result.imageUrl,
          arasaacId: result.arasaacId,
        });
      }
    });
    await Promise.all(promises);
  }

  return results;
}
