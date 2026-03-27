import { useEffect, useRef } from 'react';
import { useBoardStore } from '../store/boardStore';
import { fetchArasaacForSymbols } from '../services/arasaac';

/**
 * Background ARASAAC image fetcher.
 * When the current board's symbols change, identifies symbols without imageUrl
 * (excluding categories and user-uploaded photos) and fetches ARASAAC images.
 * Updates are written to IndexedDB and the board is reloaded to pick them up.
 *
 * PRD 3.1: ARASAAC API fetch by keyword, cache to IndexedDB, emoji fallback if offline.
 * PRD Offline Requirement: Never show broken images.
 */
export function useArasaac() {
  const symbols = useBoardStore((s) => s.symbols);
  const currentBoardId = useBoardStore((s) => s.currentBoardId);
  const loadSymbols = useBoardStore((s) => s.loadSymbols);
  const fetchingRef = useRef(false);
  const lastBoardRef = useRef('');

  useEffect(() => {
    // Skip if no symbols or same board already being fetched
    if (symbols.length === 0) return;
    if (fetchingRef.current && lastBoardRef.current === currentBoardId) return;

    // Find symbols that need ARASAAC images:
    // - Not a category card
    // - No imageUrl set (no user photo, no prior ARASAAC fetch)
    // - Has a label to search for
    const needsFetch = symbols.filter(
      (s) => !s.isCategory && !s.imageUrl && s.label,
    );

    if (needsFetch.length === 0) return;

    fetchingRef.current = true;
    lastBoardRef.current = currentBoardId;

    const fetchImages = async () => {
      try {
        const toFetch = needsFetch.map((s) => ({ id: s.id, label: s.label }));
        const results = await fetchArasaacForSymbols(toFetch);

        // If we got any images, reload the board to show them
        if (results.size > 0) {
          loadSymbols(currentBoardId);
        }
      } finally {
        fetchingRef.current = false;
      }
    };

    // Delay slightly to not block initial render
    const timer = setTimeout(fetchImages, 500);
    return () => clearTimeout(timer);
  }, [symbols, currentBoardId, loadSymbols]);
}
