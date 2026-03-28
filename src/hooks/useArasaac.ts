import { useEffect, useRef } from 'react';
import { useBoardStore } from '../store/boardStore';
import { fetchArasaacForSymbols, getArasaacImageUrl } from '../services/arasaac';
import { db } from '../db';

/**
 * Background ARASAAC image fetcher.
 * When the current board's symbols change, identifies symbols without imageUrl
 * and fetches ARASAAC images. Symbols with hardcoded arasaacId get direct URLs
 * (no API search needed). Others fall back to keyword search.
 */
export function useArasaac() {
  const symbols = useBoardStore((s) => s.symbols);
  const currentBoardId = useBoardStore((s) => s.currentBoardId);
  const loadSymbols = useBoardStore((s) => s.loadSymbols);
  const fetchingRef = useRef(false);
  const lastBoardRef = useRef('');

  useEffect(() => {
    if (symbols.length === 0) return;
    if (fetchingRef.current && lastBoardRef.current === currentBoardId) return;

    // Find symbols that need images
    const needsFetch = symbols.filter(
      (s) => !s.isCategory && !s.imageUrl && s.label,
    );

    if (needsFetch.length === 0) return;

    fetchingRef.current = true;
    lastBoardRef.current = currentBoardId;

    const fetchImages = async () => {
      try {
        let updated = false;

        // Phase 1: Symbols with hardcoded arasaacId — direct URL, no API call
        const withId = needsFetch.filter((s) => s.arasaacId);
        for (const sym of withId) {
          const imageUrl = getArasaacImageUrl(sym.arasaacId!);
          await db.symbols.update(sym.id, { imageUrl });
          updated = true;
        }

        // Phase 2: Symbols without arasaacId — keyword search via API
        const withoutId = needsFetch.filter((s) => !s.arasaacId);
        if (withoutId.length > 0) {
          const toFetch = withoutId.map((s) => ({ id: s.id, label: s.label }));
          const results = await fetchArasaacForSymbols(toFetch);
          if (results.size > 0) updated = true;
        }

        if (updated) {
          loadSymbols(currentBoardId);
        }
      } finally {
        fetchingRef.current = false;
      }
    };

    const timer = setTimeout(fetchImages, 300);
    return () => clearTimeout(timer);
  }, [symbols, currentBoardId, loadSymbols]);
}
