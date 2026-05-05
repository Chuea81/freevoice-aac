import { useCallback, useState, useRef, useMemo } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { useTTS } from '../../hooks/useTTS';
import { useSettingsStore } from '../../store/settingsStore';
import { useHighlightStore } from '../../store/highlightStore';
import { useFirstThenStore } from '../../store/firstThenStore';
import { useEditModeStore } from '../../store/editModeStore';
import { SymbolCard } from '../SymbolCard/SymbolCard';
import { CustomWordModal } from '../modals/CustomWordModal';
import { CustomButtonModal } from '../modals/CustomButtonModal';
import { CustomBoardModal } from '../modals/CustomBoardModal';
import { SymbolContextMenu } from '../modals/SymbolContextMenu';
import { BoardPicker } from '../modals/BoardPicker';
import { ARASAAC_IDS } from '../../data/arasaacIds';
import { getArasaacImageUrl } from '../../services/arasaac';
import type { Symbol as DbSymbol } from '../../db';

function resolveSymbolImageUrl(symbol: DbSymbol): string | null {
  if (symbol.imageUrl) return symbol.imageUrl;
  const staticId = ARASAAC_IDS[symbol.label?.toUpperCase() || ''];
  if (staticId && staticId > 0) return getArasaacImageUrl(staticId);
  if (symbol.arasaacId) return getArasaacImageUrl(symbol.arasaacId);
  return null;
}

interface Props {
  isParentMode?: boolean;
}

export function SymbolGrid({ isParentMode }: Props) {
  const symbols = useBoardStore((s) => s.symbols);
  const currentBoardId = useBoardStore((s) => s.currentBoardId);
  const navigateToBoard = useBoardStore((s) => s.navigateToBoard);
  const addToken = useBoardStore((s) => s.addToken);
  const deleteCustomSymbol = useBoardStore((s) => s.deleteCustomSymbol);
  const setSymbolHighlight = useBoardStore((s) => s.setSymbolHighlight);
  const moveSymbolToBoard = useBoardStore((s) => s.moveSymbolToBoard);
  const createBoard = useBoardStore((s) => s.createBoard);
  const autoSpeak = useSettingsStore((s) => s.autoSpeak);
  const gridColumns = useSettingsStore((s) => s.gridColumns);
  const symbolSize = useSettingsStore((s) => s.symbolSize);
  const highlightMode = useHighlightStore((s) => s.mode);
  const highlightColor = useHighlightStore((s) => s.selectedColor);
  const firstThenMode = useFirstThenStore((s) => s.mode);
  const fillFirstThen = useFirstThenStore((s) => s.fillActive);
  const editMode = useEditModeStore((s) => s.active);
  const { speak, playRecording } = useTTS();

  const [modalOpen, setModalOpen] = useState(false);
  const [customButtonModalOpen, setCustomButtonModalOpen] = useState(false);
  const [customBoardModalOpen, setCustomBoardModalOpen] = useState(false);
  // Edit-mode entry point — set when user taps a button while Edit Mode is on
  // OR long-presses a button (2.5 s) OR right-clicks. Opens CustomButtonModal
  // with editTarget so both built-in and custom symbols share one form.
  const [customButtonEditTarget, setCustomButtonEditTarget] = useState<DbSymbol | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const reorderSymbolsInBoard = useBoardStore((s) => s.reorderSymbolsInBoard);
  const reorderCustomBoardsOnHome = useBoardStore((s) => s.reorderCustomBoardsOnHome);
  const [editingSymbol, setEditingSymbol] = useState<DbSymbol | null>(null);
  const [contextSymbol, setContextSymbol] = useState<DbSymbol | null>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const [addToBoardId, setAddToBoardId] = useState<string | null>(null);
  const [movePickerOpen, setMovePickerOpen] = useState(false);
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardEmoji, setNewBoardEmoji] = useState('📁');

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Separate 2.5 s timer that opens the unified edit modal on any button.
  // This is intentionally above the touch-delay max (2 s) so the two
  // features can't trigger simultaneously.
  const editLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);
  const isScrolling = useRef(false);
  const touchStartY = useRef(0);
  const [longPressingId, setLongPressingId] = useState<string | null>(null);

  // Open the unified edit modal for any symbol — built-in or custom. Built-in
  // symbols route their save through the override layer in CustomButtonModal.
  const openButtonEditor = useCallback((symbol: DbSymbol) => {
    if (symbol.isCategory) return; // Category navigation tiles aren't editable here
    setCustomButtonEditTarget(symbol);
  }, []);

  const isCustomBoard = currentBoardId === 'custom';
  const isHomeBoard = currentBoardId === 'home';
  const allowEdit = isCustomBoard || isParentMode;

  // List of custom-symbol ids on the current board, in display order. Built-in
  // symbols are excluded so reorder controls can only swap user items among
  // themselves (the spec keeps built-in positions fixed).
  const customSymbolIdsInOrder = useMemo(
    () => symbols.filter((s) => s.id.startsWith('user-')).map((s) => s.id),
    [symbols],
  );
  const hasCustomToReorder = customSymbolIdsInOrder.length >= 2;

  const moveCustomItem = useCallback(async (id: string, direction: -1 | 1) => {
    const idx = customSymbolIdsInOrder.indexOf(id);
    if (idx < 0) return;
    const target = idx + direction;
    if (target < 0 || target >= customSymbolIdsInOrder.length) return;
    const next = [...customSymbolIdsInOrder];
    [next[idx], next[target]] = [next[target], next[idx]];
    if (isHomeBoard) {
      await reorderCustomBoardsOnHome(next);
    } else {
      await reorderSymbolsInBoard(currentBoardId, next);
    }
  }, [customSymbolIdsInOrder, isHomeBoard, currentBoardId, reorderSymbolsInBoard, reorderCustomBoardsOnHome]);
  // The legacy + card (parent-mode UI, dashed border, "ADD SYMBOL" copy) still
  // gates by parent mode so the parent flow is untouched. The new always-on
  // user-facing "+ Add" tile shows on every regular board so caregivers and
  // end users can create custom buttons without entering parent mode.
  const showAddButton = isCustomBoard || isParentMode;
  const showQuickAddCard = !isParentMode;
  // Phase 2: "+ Create Board" tile only appears on the Home grid where all
  // category tiles live. Other boards keep the single Add Button card.
  const showCreateBoardCard = isHomeBoard && !isParentMode;

  const handleTap = useCallback(
    (symbol: DbSymbol) => {
      if (longPressTriggered.current || isScrolling.current) {
        longPressTriggered.current = false;
        isScrolling.current = false;
        return;
      }
      // Edit Mode wins before highlight, speech, and navigation. Tapping
      // any button (built-in or custom) opens its edit form. Categories
      // skip — they still navigate so users can enter sub-boards to edit.
      if (editMode && !symbol.isCategory) {
        openButtonEditor(symbol);
        return;
      }
      if (highlightMode) {
        const nextColor = symbol.highlightColor ? null : highlightColor;
        setSymbolHighlight(symbol.id, nextColor);
        return;
      }
      // First/Then mode — fill the active slot; navigation tiles still navigate
      if (firstThenMode && !symbol.isCategory) {
        const { bothFilled } = fillFirstThen({
          emoji: symbol.emoji,
          label: symbol.label,
          phrase: symbol.phrase,
          imageUrl: resolveSymbolImageUrl(symbol),
        });
        if (bothFilled && autoSpeak) {
          const store = useFirstThenStore.getState();
          const first = store.firstSlot;
          const then = store.thenSlot;
          if (first && then) speak(`First ${first.phrase}, then ${then.phrase}`);
        }
        return;
      }
      if (symbol.isCategory && symbol.targetBoardId) {
        navigateToBoard(symbol.targetBoardId, symbol.label, symbol.emoji);
      } else {
        // Fire speech FIRST so it kicks off before any state updates trigger
        // re-renders. `speak` is async but its synchronous prelude (voice
        // lookup, utterance creation, synth.speak) runs immediately.
        // Custom user recording wins over TTS when present.
        if (autoSpeak) {
          if (symbol.audioBlob) {
            playRecording(symbol.audioBlob, symbol.audioMime);
          } else {
            speak(symbol.phrase);
          }
        }
        addToken(symbol.emoji, symbol.phrase);
      }
    },
    [navigateToBoard, addToken, speak, playRecording, autoSpeak, highlightMode, highlightColor, setSymbolHighlight, firstThenMode, fillFirstThen, editMode, openButtonEditor],
  );

  const handleLongPressStart = useCallback((symbol: DbSymbol, e?: React.TouchEvent | React.MouseEvent) => {
    isScrolling.current = false;
    longPressTriggered.current = false;

    // Track initial touch position for scroll detection
    if (e && 'touches' in e) {
      touchStartY.current = e.touches[0]?.clientY || 0;
    }

    // Legacy parent-mode / custom-board: 500 ms opens the context menu.
    if (allowEdit) {
      longPressTimer.current = setTimeout(() => {
        longPressTriggered.current = true;
        setContextSymbol(symbol);
        setContextOpen(true);
      }, 500);
    }

    // Universal: 2.5 s on any non-category button opens the edit form. The
    // delay sits comfortably above the touch-delay max (2 s) so the two
    // never compete. Categories stay tap-to-navigate.
    if (!symbol.isCategory && !reorderMode && !editMode) {
      setLongPressingId(symbol.id);
      editLongPressTimer.current = setTimeout(() => {
        longPressTriggered.current = true;
        setLongPressingId(null);
        openButtonEditor(symbol);
      }, 2500);
    }
  }, [allowEdit, reorderMode, editMode, openButtonEditor]);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (editLongPressTimer.current) {
      clearTimeout(editLongPressTimer.current);
      editLongPressTimer.current = null;
    }
    setLongPressingId(null);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const currentY = e.touches[0]?.clientY || 0;
    const delta = Math.abs(currentY - touchStartY.current);
    // If touch moved more than 10px, consider it a scroll
    if (delta > 10) {
      isScrolling.current = true;
      handleLongPressEnd();
    }
  }, [handleLongPressEnd]);

  // Right-click on desktop is a quick alternative to long-press.
  const handleContextMenu = useCallback((symbol: DbSymbol, e: React.MouseEvent) => {
    if (symbol.isCategory || reorderMode) return;
    e.preventDefault();
    longPressTriggered.current = true; // suppress the synthetic click that follows
    openButtonEditor(symbol);
  }, [reorderMode, openButtonEditor]);

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

  if (symbols.length === 0 && !showAddButton && !showQuickAddCard) {
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
      <div id="grid-area" className={`scroll-thin${sizeClass}${reorderMode ? ' reorder-mode' : ''}`}>
        {/* Reorder toolbar — only available when there is something to reorder
            and the grid is not in parent mode (which has its own tools). */}
        {!isParentMode && hasCustomToReorder && (
          <div className="reorder-toolbar">
            {reorderMode ? (
              <>
                <span className="reorder-toolbar-hint">
                  {isHomeBoard
                    ? 'Tap ↑ ↓ on a custom board tile to move it'
                    : 'Tap ↑ ↓ on a custom button to move it'}
                </span>
                <button
                  type="button"
                  className="reorder-toolbar-btn done"
                  onClick={() => setReorderMode(false)}
                >
                  Done
                </button>
              </>
            ) : (
              <button
                type="button"
                className="reorder-toolbar-btn"
                onClick={() => setReorderMode(true)}
                aria-label="Reorder custom items"
              >
                <span aria-hidden="true">⇅</span> Reorder
              </button>
            )}
          </div>
        )}
        <div id="symbol-grid" className={gridColumns > 0 ? `cols-${gridColumns}` : undefined}>
          {symbols.map((symbol) => {
            const isCustom = symbol.id.startsWith('user-');
            const customIdx = isCustom ? customSymbolIdsInOrder.indexOf(symbol.id) : -1;
            const canMoveUp = reorderMode && isCustom && customIdx > 0;
            const canMoveDown = reorderMode && isCustom && customIdx >= 0 && customIdx < customSymbolIdsInOrder.length - 1;
            return (
              <div
                key={symbol.id}
                className={
                  'grid-cell'
                  + (reorderMode ? (isCustom ? ' reorder-target' : ' reorder-locked') : '')
                  + (editMode && !symbol.isCategory ? ' edit-target' : '')
                  + (longPressingId === symbol.id ? ' long-pressing' : '')
                }
                onMouseDown={(e) => !reorderMode && handleLongPressStart(symbol, e)}
                onMouseUp={!reorderMode ? handleLongPressEnd : undefined}
                onMouseLeave={!reorderMode ? handleLongPressEnd : undefined}
                onTouchStart={(e) => !reorderMode && handleLongPressStart(symbol, e)}
                onTouchEnd={!reorderMode ? handleLongPressEnd : undefined}
                onTouchMove={!reorderMode ? handleTouchMove : undefined}
                onContextMenu={(e) => !reorderMode && handleContextMenu(symbol, e)}
              >
                <SymbolCard
                  symbol={symbol}
                  onTap={reorderMode ? () => {} : handleTap}
                  isParentMode={isParentMode}
                  showEditOverlay={editMode && !symbol.isCategory}
                />
                {reorderMode && isCustom && (
                  <div className="reorder-controls" aria-label="Reorder controls">
                    <button
                      type="button"
                      className="reorder-arrow"
                      disabled={!canMoveUp}
                      aria-label="Move up"
                      onClick={(e) => { e.stopPropagation(); moveCustomItem(symbol.id, -1); }}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="reorder-arrow"
                      disabled={!canMoveDown}
                      aria-label="Move down"
                      onClick={(e) => { e.stopPropagation(); moveCustomItem(symbol.id, 1); }}
                    >
                      ↓
                    </button>
                  </div>
                )}
              </div>
            );
          })}

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

          {/* User-facing "+ Add" card — every regular board outside Parent Mode.
              Opens the dedicated CustomButtonModal with emoji search, image
              search, no-image mode, board placement, and live preview. */}
          {showQuickAddCard && (
            <button
              type="button"
              className="symbol-card add-button-card"
              onClick={() => setCustomButtonModalOpen(true)}
              aria-label="Add custom button"
            >
              <span className="add-button-card-plus" aria-hidden="true">+</span>
              <span className="symbol-label add-button-card-label">Add</span>
            </button>
          )}

          {/* "+ Create Board" tile — Home only. Opens CustomBoardModal which
              creates a new sub-board AND its category tile on Home in one
              transaction. */}
          {showCreateBoardCard && (
            <button
              type="button"
              className="symbol-card add-board-card"
              onClick={() => setCustomBoardModalOpen(true)}
              aria-label="Create new board"
            >
              <span className="add-button-card-plus" aria-hidden="true">+</span>
              <span className="symbol-label add-button-card-label">Create Board</span>
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

          {/* Phase 2 — friendly empty state on a freshly-created custom board */}
          {!showAddButton && showQuickAddCard && symbols.length === 0 && currentBoardId.startsWith('board-') && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <div className="empty-state-icon">✨</div>
              <p>No buttons yet! Tap + to add your first button.</p>
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

      <CustomButtonModal
        open={customButtonModalOpen || customButtonEditTarget !== null}
        editTarget={customButtonEditTarget}
        onClose={() => { setCustomButtonModalOpen(false); setCustomButtonEditTarget(null); }}
      />

      <CustomBoardModal
        open={customBoardModalOpen}
        onClose={() => setCustomBoardModalOpen(false)}
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
