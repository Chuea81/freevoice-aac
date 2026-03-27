import { useState, useCallback, useRef, useEffect } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTTS } from '../../hooks/useTTS';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SymbolSearch({ open, onClose }: Props) {
  const searchSymbols = useBoardStore((s) => s.searchSymbols);
  const searchResults = useBoardStore((s) => s.searchResults);
  const clearSearch = useBoardStore((s) => s.clearSearch);
  const addToken = useBoardStore((s) => s.addToken);
  const navigateToBoard = useBoardStore((s) => s.navigateToBoard);
  const autoSpeak = useSettingsStore((s) => s.autoSpeak);
  const { speak } = useTTS();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      clearSearch();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, clearSearch]);

  const handleInput = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchSymbols(value);
    }, 200);
  }, [searchSymbols]);

  const handleTap = useCallback((symbol: { emoji: string; phrase: string; label: string; isCategory: boolean; targetBoardId?: string }) => {
    if (symbol.isCategory && symbol.targetBoardId) {
      navigateToBoard(symbol.targetBoardId, symbol.label, symbol.emoji);
      onClose();
    } else {
      addToken(symbol.emoji, symbol.phrase);
      if (autoSpeak) speak(symbol.phrase);
    }
  }, [addToken, navigateToBoard, speak, autoSpeak, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="search-modal">
        <div className="search-header">
          <input
            ref={inputRef}
            className="search-input"
            type="text"
            placeholder="Search symbols..."
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            aria-label="Search symbols"
          />
          <button className="search-close" onClick={onClose}>✕</button>
        </div>
        <div className="search-results">
          {searchResults.length === 0 && query.length > 0 && (
            <p className="search-empty">No symbols found for "{query}"</p>
          )}
          {searchResults.map((s) => (
            <button
              key={s.id}
              className="search-result-item"
              onClick={() => handleTap(s)}
            >
              <span className="search-result-emoji">{s.emoji}</span>
              <div className="search-result-text">
                <strong>{s.label}</strong>
                <span>{s.phrase}</span>
              </div>
              <span className="search-result-board">{s.boardId}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
