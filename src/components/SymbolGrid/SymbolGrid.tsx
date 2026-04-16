import { useCallback, useState, useRef } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { useTTS } from '../../hooks/useTTS';
import { useSettingsStore } from '../../store/settingsStore';
import { SymbolCard } from '../SymbolCard/SymbolCard';
import { CustomWordModal } from '../modals/CustomWordModal';
import { SymbolContextMenu } from '../modals/SymbolContextMenu';
import { BoardPicker } from '../modals/BoardPicker';
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
  const moveSymbolToBoard = useBoardStore((s) => s.moveSymbolToBoard);
  const createBoard = useBoardStore((s) => s.createBoard);
  const autoSpeak = useSettingsStore((s) => s.autoSpeak);
  const gridColumns = useSettingsStore((s) => s.gridColumns);
  const symbolSize = useSettingsStore((s) => s.symbolSize);
  const { speak } = useTTS();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSymbol, setEditingSymbol] = useState<DbSymbol | null>(null);
  const [contextSymbol, setContextSymbol] = useState<DbSymbol | null>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const [addToBoardId, setAddToBoardId] = useState<string | null>(null);
  const [movePickerOpen, setMovePickerOpen] = useState(false);
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardEmoji, setNewBoardEmoji] = useState('📁');

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);
  const isScrolling = useRef(false);
  const touchStartY = useRef(0);

  const isCustomBoard = currentBoardId === 'custom';
  const allowEdit = isCustomBoard || isParentMode;
  const showAddButton = isCustomBoard || isParentMode;

  const handleTap = useCallback(
    (symbol: DbSymbol) => {
      if (longPressTriggered.current || isScrolling.current) {
        longPressTriggered.current = false;
        isScrolling.current = false;
        return;
      }
      if (symbol.isCategory && symbol.targetBoardId) {
        navigateToBoard(symbol.targetBoardId, symbol.label, symbol.emoji);
      } else {
        addToken(symbol.emoji, symbol.phrase);
        if (autoSpeak) speak(symbol.phrase);
      }
    },
    [navigateToBoard, addToken, speak, autoSpeak],
  );

  const handleLongPressStart = useCallback((symbol: DbSymbol, e?: React.TouchEvent | React.MouseEvent) => {
    if (!allowEdit) return;
    isScrolling.current = false;
    longPressTriggered.current = false;

    // Track initial touch position for scroll detection
    if (e && 'touches' in e) {
      touchStartY.current = e.touches[0]?.clientY || 0;
    }

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

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const currentY = e.touches[0]?.clientY || 0;
    const delta = Math.abs(currentY - touchStartY.current);
    // If touch moved more than 10px, consider it a scroll
    if (delta > 10) {
      isScrolling.current = true;
      handleLongPressEnd();
    }
  }, []);

  const handleEdit = useCallback(() => {
    setContextOpen(false);
    if (contextSymbol) {
      setEditingSymbol(contextSymbol);
      setAddToBoardId(currentBoardId);
      setModalOpen(true);
    }
  }, [contextSymbol, currentBoardId]);

  const handleMove = useCallback(() => {
    setContextOpen(false);
    setMovePickerOpen(true);
  }, []);

  const handleMoveSelect = useCallback(async (targetBoardId: string) => {
    if (contextSymbol) {
      await moveSymbolToBoard(contextSymbol.id, targetBoardId);
    }
    setMovePickerOpen(false);
    setContextSymbol(null);
  }, [contextSymbol, moveSymbolToBoard]);

  const handleAddInside = useCallback(() => {
    setContextOpen(false);
    if (contextSymbol?.isCategory && contextSymbol.targetBoardId) {
      setEditingSymbol(null);
      setAddToBoardId(contextSymbol.targetBoardId);
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

  const handleCreateSubBoard = useCallback(async () => {
    const trimmedName = newBoardName.trim();
    if (!trimmedName) return;
    try {
      const newBoardId = await createBoard(trimmedName, newBoardEmoji, currentBoardId);
      setShowCreateBoardModal(false);
      setNewBoardName('');
      setNewBoardEmoji('📁');
      // Toast: "Board created ✓"
      console.log(`Board "${trimmedName}" created with ID: ${newBoardId}`);
    } catch (err) {
      console.error('Error creating board:', err);
    }
  }, [newBoardName, newBoardEmoji, currentBoardId, createBoard]);

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
          {symbols.map((symbol) => (
            <div
              key={symbol.id}
              onMouseDown={(e) => handleLongPressStart(symbol, e)}
              onMouseUp={handleLongPressEnd}
              onMouseLeave={handleLongPressEnd}
              onTouchStart={(e) => handleLongPressStart(symbol, e)}
              onTouchEnd={handleLongPressEnd}
              onTouchMove={handleTouchMove}
            >
              <SymbolCard symbol={symbol} onTap={handleTap} isParentMode={isParentMode} />
            </div>
          ))}

          {/* Add Symbol card — always visible in edit mode, styled in Parent Mode */}
          {showAddButton && (
            <button
              className={`symbol-card add-word-card${isParentMode ? ' parent-mode-add' : ''}`}
              onClick={() => {
                setEditingSymbol(null);
                setAddToBoardId(currentBoardId);
                setModalOpen(true);
              }}
              style={isParentMode ? {
                borderStyle: 'dashed',
                borderColor: '#43A047',
                borderWidth: '2px',
              } : undefined}
            >
              <span className="symbol-emoji">➕</span>
              <span className="symbol-label">
                {isParentMode ? 'ADD SYMBOL' : 'Add Symbol'}
              </span>
            </button>
          )}

          {/* New Board Inside card — Parent Mode only, after Add Symbol */}
          {isParentMode && showAddButton && (
            <button
              className="symbol-card add-word-card"
              onClick={() => setShowCreateBoardModal(true)}
              style={{
                borderStyle: 'dashed',
                borderColor: '#43A047',
                borderWidth: '2px',
              }}
            >
              <span className="symbol-emoji">📁</span>
              <span className="symbol-label">NEW BOARD INSIDE</span>
            </button>
          )}

          {showAddButton && symbols.length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <p>Tap ➕ to add symbols to this board!</p>
            </div>
          )}
        </div>
      </div>

      <CustomWordModal
        open={modalOpen}
        onClose={handleCloseModal}
        editSymbol={editingSymbol}
        boardId={addToBoardId || currentBoardId}
      />

      <SymbolContextMenu
        open={contextOpen}
        label={contextSymbol?.label || ''}
        isCategory={contextSymbol?.isCategory}
        onEdit={handleEdit}
        onMove={handleMove}
        onAddInside={handleAddInside}
        onDelete={handleDelete}
        onClose={() => { setContextOpen(false); setContextSymbol(null); }}
      />

      <BoardPicker
        open={movePickerOpen}
        title={`Move "${contextSymbol?.label || ''}" to...`}
        currentBoardId={currentBoardId}
        onSelect={handleMoveSelect}
        onClose={() => { setMovePickerOpen(false); setContextSymbol(null); }}
      />

      {/* Create Sub-Board Modal */}
      {showCreateBoardModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateBoardModal(false); }}>
          <div className="modal">
            <h2 className="modal-title">Create a board inside</h2>
            <p style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              {symbols.length > 0 ? symbols[0].label : 'current board'}
            </p>

            <div className="modal-field">
              <label>Board name</label>
              <input
                type="text"
                placeholder="e.g. Breakfast"
                maxLength={30}
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateSubBoard(); }}
                autoFocus
              />
            </div>

            <div className="modal-field">
              <label>Emoji</label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--border-raised)',
                fontSize: '32px',
                background: 'var(--bg-surface)',
              }}>
                <input
                  type="text"
                  value={newBoardEmoji}
                  onChange={(e) => setNewBoardEmoji(e.target.value.slice(0, 2))}
                  maxLength={2}
                  style={{
                    width: '60px',
                    border: 'none',
                    background: 'transparent',
                    textAlign: 'center',
                    fontSize: '24px',
                    fontFamily: 'system-ui',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="modal-btn cancel"
                onClick={() => setShowCreateBoardModal(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn primary"
                onClick={handleCreateSubBoard}
                disabled={!newBoardName.trim()}
              >
                Create Board
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
