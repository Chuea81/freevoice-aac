import { useCallback, useState, useRef } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { useTTS } from '../../hooks/useTTS';
import { useSettingsStore } from '../../store/settingsStore';
import { SymbolCard } from '../SymbolCard/SymbolCard';
import { CustomWordModal } from '../modals/CustomWordModal';
import { SymbolContextMenu } from '../modals/SymbolContextMenu';
import type { Symbol as DbSymbol } from '../../db';

interface Props {
  isParentMode?: boolean;
}

export function SymbolGrid({ isParentMode }: Props) {
  const symbols = useBoardStore((s) => s.symbols);
  const currentBoardId = useBoardStore((s) => s.currentBoardId);
  const navigateToBoard = useBoardStore((s) => s.navigateToBoard);
  const addToken = useBoardStore((s) => s.addToken);
  const deleteCustomSymbol = useBoardStore((s) => s.deleteCustomSymbol);
  const autoSpeak = useSettingsStore((s) => s.autoSpeak);
  const gridColumns = useSettingsStore((s) => s.gridColumns);
  const symbolSize = useSettingsStore((s) => s.symbolSize);
  const { speak } = useTTS();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSymbol, setEditingSymbol] = useState<DbSymbol | null>(null);
  const [contextSymbol, setContextSymbol] = useState<DbSymbol | null>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const [addToBoardId, setAddToBoardId] = useState<string | null>(null);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const isCustomBoard = currentBoardId === 'custom';
  const allowEdit = isCustomBoard || isParentMode;

  const handleTap = useCallback(
    (symbol: DbSymbol) => {
      if (longPressTriggered.current) {
        longPressTriggered.current = false;
        return;
      }
      if (symbol.isCategory && symbol.targetBoardId) {
        navigateToBoard(symbol.targetBoardId, symbol.label, symbol.emoji);
      } else {
        addToken(symbol.emoji, symbol.phrase);
        if (autoSpeak) {
          speak(symbol.phrase);
        }
      }
    },
    [navigateToBoard, addToken, speak, autoSpeak],
  );

  const handleLongPressStart = useCallback((symbol: DbSymbol) => {
    if (!allowEdit) return;
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      setContextSymbol(symbol);
      setContextOpen(true);
    }, 500);
  }, [allowEdit]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleEdit = useCallback(() => {
    setContextOpen(false);
    if (contextSymbol) {
      setEditingSymbol(contextSymbol);
      setModalOpen(true);
    }
  }, [contextSymbol]);

  const handleDelete = useCallback(async () => {
    if (contextSymbol && confirm(`Remove "${contextSymbol.label}"?`)) {
      await deleteCustomSymbol(contextSymbol.id);
    }
    setContextOpen(false);
    setContextSymbol(null);
  }, [contextSymbol, deleteCustomSymbol]);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingSymbol(null);
    setAddToBoardId(null);
  }, []);

  const showAddButton = isCustomBoard || isParentMode;

  if (symbols.length === 0 && !showAddButton) {
    return (
      <div id="grid-area" className="scroll-thin">
        <div className="empty-state">
          <div className="empty-state-icon">😕</div>
          <p>Nothing here yet!</p>
        </div>
      </div>
    );
  }

  const sizeClass = symbolSize !== 'medium' ? ` symbol-size-${symbolSize}` : '';

  return (
    <>
      <div id="grid-area" className={`scroll-thin${sizeClass}`}>
        <div id="symbol-grid" className={gridColumns > 0 ? `cols-${gridColumns}` : undefined}>
          {showAddButton && (
            <button
              className="symbol-card add-word-card"
              onClick={() => {
                setEditingSymbol(null);
                setAddToBoardId(currentBoardId);
                setModalOpen(true);
              }}
            >
              <div className="symbol-card-highlight" />
              <span className="symbol-emoji">➕</span>
              <span className="symbol-label">Add Word</span>
            </button>
          )}

          {symbols.map((symbol) => (
            <div
              key={symbol.id}
              onMouseDown={() => handleLongPressStart(symbol)}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              onTouchStart={() => handleLongPressStart(symbol)}
              onTouchEnd={handleLongPressEnd}
              onTouchMove={handleLongPressEnd}
            >
              <SymbolCard symbol={symbol} onTap={handleTap} isParentMode={isParentMode} />
            </div>
          ))}

          {showAddButton && symbols.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <p>Tap ➕ to add words to this board!</p>
            </div>
          )}
        </div>
      </div>

      <CustomWordModal
        open={modalOpen}
        onClose={handleCloseModal}
        editSymbol={editingSymbol}
        boardId={addToBoardId || 'custom'}
      />

      <SymbolContextMenu
        open={contextOpen}
        label={contextSymbol?.label || ''}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onClose={() => { setContextOpen(false); setContextSymbol(null); }}
      />
    </>
  );
}
