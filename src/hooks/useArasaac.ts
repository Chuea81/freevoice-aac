import { useEffect, useRef } from 'react';
import { useBoardStore } from '../store/boardStore';
import { fetchArasaacForSymbols } from '../services/arasaac';

/**
 * Background ARASAAC image fetcher.
 * Populates the symbolCache table for symbols that don't have a hardcoded arasaacId.
 * Does NOT write to the symbols table — SymbolCard resolves images at render time.
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

    // Only fetch for symbols WITHOUT arasaacId (those use direct URLs in SymbolCard)
    // and WITHOUT user-uploaded imageUrl (data: URLs from camera)
    const needsFetch = symbols.filter(
      (s) => !s.isCategory && !s.arasaacId && !isUserPhoto(s.imageUrl) && s.label,
    );

    if (needsFetch.length === 0) return;

    fetchingRef.current = true;
    lastBoardRef.current = currentBoardId;

    const doFetch = async () => {
      try {
        const toFetch = needsFetch.map((s) => ({ id: s.id, label: s.label }));
        const results = await fetchArasaacForSymbols(toFetch);
        // Reload board so SymbolCard picks up newly cached URLs
        if (results.size > 0) {
          loadSymbols(currentBoardId);
        }
      } finally {
        fetchingRef.current = false;
      }
    };

    const timer = setTimeout(doFetch, 300);
    return () => clearTimeout(timer);
  }, [symbols, currentBoardId, loadSymbols]);
}

/** User-uploaded photos are data: URLs or blob: URLs — not ARASAAC */
function isUserPhoto(url?: string): boolean {
  if (!url) return false;
  return url.startsWith('data:') || url.startsWith('blob:');
}
