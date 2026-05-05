import { useEffect, useState, useCallback, useMemo } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { useSymbolOverridesStore } from '../../store/symbolOverridesStore';
import { db, type Board as DbBoard, type Symbol as DbSymbol } from '../../db';
import { CustomButtonModal } from '../modals/CustomButtonModal';
import { CustomBoardModal } from '../modals/CustomBoardModal';

type Tab = 'buttons' | 'boards' | 'edits';

interface ButtonListItem {
  symbol: DbSymbol;
  boardName: string;
}

interface BoardListItem {
  board: DbBoard;
  categorySymbol: DbSymbol;
  buttonCount: number;
}

interface EditListItem {
  // The original built-in symbol (un-overridden) so the user can see what
  // the original was; the merged symbol drives the modal when they re-edit.
  original: DbSymbol;
  edited: DbSymbol;
  boardName: string;
}

export function CustomContentManager() {
  const [tab, setTab] = useState<Tab>('buttons');
  const [refreshKey, setRefreshKey] = useState(0);
  const [buttons, setButtons] = useState<ButtonListItem[]>([]);
  const [boards, setBoards] = useState<BoardListItem[]>([]);
  const [edits, setEdits] = useState<EditListItem[]>([]);
  const [allBoards, setAllBoards] = useState<DbBoard[]>([]);

  const [editButton, setEditButton] = useState<DbSymbol | null>(null);
  const [editBoard, setEditBoard] = useState<{ board: DbBoard; categorySymbol: DbSymbol } | null>(null);

  const [deleteButtonTarget, setDeleteButtonTarget] = useState<DbSymbol | null>(null);
  const [deleteBoardTarget, setDeleteBoardTarget] = useState<BoardListItem | null>(null);
  const [boardDeleteMode, setBoardDeleteMode] = useState<'cascade' | 'move'>('cascade');
  const [boardDeleteMoveTarget, setBoardDeleteMoveTarget] = useState<string>('home');

  const deleteCustomSymbol = useBoardStore((s) => s.deleteCustomSymbol);
  const duplicateCustomButton = useBoardStore((s) => s.duplicateCustomButton);
  const deleteCustomBoardCascade = useBoardStore((s) => s.deleteCustomBoardCascade);
  const deleteCustomBoardMoveContents = useBoardStore((s) => s.deleteCustomBoardMoveContents);
  const reorderSymbolsInBoard = useBoardStore((s) => s.reorderSymbolsInBoard);
  const reorderCustomBoardsOnHome = useBoardStore((s) => s.reorderCustomBoardsOnHome);
  const overridesMap = useSymbolOverridesStore((s) => s.overrides);
  const deleteOverride = useSymbolOverridesStore((s) => s.deleteOverride);
  const loadSymbols = useBoardStore((s) => s.loadSymbols);
  const currentBoardId = useBoardStore((s) => s.currentBoardId);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Load custom buttons + boards on mount and after every mutation.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const allSyms = await db.symbols.toArray();
      const allBrds = await db.boards.orderBy('order').toArray();
      if (cancelled) return;

      const boardById = new Map(allBrds.map((b) => [b.id, b]));

      // Custom buttons = user-* symbols that AREN'T category-tile symbols
      // pointing at a custom board (those represent boards, not buttons).
      const customSyms = allSyms.filter((s) => s.id.startsWith('user-'));
      const buttonSyms = customSyms.filter((s) => !(s.isCategory && s.targetBoardId && s.targetBoardId.startsWith('board-')));
      const buttonItems: ButtonListItem[] = buttonSyms
        .sort((a, b) => {
          const ab = boardById.get(a.boardId)?.name ?? '';
          const bb = boardById.get(b.boardId)?.name ?? '';
          if (ab !== bb) return ab.localeCompare(bb);
          return a.order - b.order;
        })
        .map((s) => ({ symbol: s, boardName: boardById.get(s.boardId)?.name ?? s.boardId }));

      // Custom boards = boards with id starting with 'board-'. Each one has a
      // category-tile symbol on its parent (typically home) that holds the
      // color and image. Look up that tile here so we can render the row.
      const customBoards = allBrds.filter((b) => b.id.startsWith('board-'));
      const boardItems: BoardListItem[] = customBoards.map((b) => {
        const cat = customSyms.find((s) => s.isCategory && s.targetBoardId === b.id);
        const buttonCount = allSyms.filter((s) => s.boardId === b.id).length;
        return cat ? { board: b, categorySymbol: cat, buttonCount } : null;
      }).filter((x): x is BoardListItem => !!x);
      // Display order matches the home grid order via the category symbol.
      boardItems.sort((a, b) => a.categorySymbol.order - b.categorySymbol.order);

      // Edited built-ins — for each override, find the original seeded
      // symbol in db.symbols and pair it with the merged (edited) version.
      const editedItems: EditListItem[] = [];
      for (const override of overridesMap.values()) {
        const original = allSyms.find((s) => s.id === override.id);
        if (!original) continue;
        const edited: DbSymbol = {
          ...original,
          ...(override.emoji !== undefined     ? { emoji: override.emoji } : {}),
          ...(override.label !== undefined     ? { label: override.label } : {}),
          ...(override.phrase !== undefined    ? { phrase: override.phrase } : {}),
          ...(override.imageUrl !== undefined  ? { imageUrl: override.imageUrl } : {}),
          ...(override.audioBlob !== undefined ? { audioBlob: override.audioBlob } : {}),
          ...(override.audioMime !== undefined ? { audioMime: override.audioMime } : {}),
        };
        editedItems.push({
          original,
          edited,
          boardName: boardById.get(original.boardId)?.name ?? original.boardId,
        });
      }
      editedItems.sort((a, b) => a.boardName.localeCompare(b.boardName) || a.edited.label.localeCompare(b.edited.label));

      setButtons(buttonItems);
      setBoards(boardItems);
      setEdits(editedItems);
      setAllBoards(allBrds);
    })();
    return () => { cancelled = true; };
  }, [refreshKey, overridesMap]);

  // Move a custom button up/down within its board (only swaps with other
  // custom items on the same board so built-in positions stay fixed).
  const moveButton = useCallback(async (sym: DbSymbol, direction: -1 | 1) => {
    const sameBoardCustoms = buttons
      .filter((b) => b.symbol.boardId === sym.boardId)
      .map((b) => b.symbol)
      .sort((a, b) => a.order - b.order);
    const idx = sameBoardCustoms.findIndex((s) => s.id === sym.id);
    if (idx < 0) return;
    const target = idx + direction;
    if (target < 0 || target >= sameBoardCustoms.length) return;
    const newOrder = [...sameBoardCustoms];
    [newOrder[idx], newOrder[target]] = [newOrder[target], newOrder[idx]];
    await reorderSymbolsInBoard(sym.boardId, newOrder.map((s) => s.id));
    refresh();
  }, [buttons, reorderSymbolsInBoard, refresh]);

  const moveBoard = useCallback(async (item: BoardListItem, direction: -1 | 1) => {
    const idx = boards.findIndex((b) => b.board.id === item.board.id);
    if (idx < 0) return;
    const target = idx + direction;
    if (target < 0 || target >= boards.length) return;
    const newOrder = [...boards];
    [newOrder[idx], newOrder[target]] = [newOrder[target], newOrder[idx]];
    await reorderCustomBoardsOnHome(newOrder.map((b) => b.categorySymbol.id));
    refresh();
  }, [boards, reorderCustomBoardsOnHome, refresh]);

  const handleDeleteButton = useCallback(async () => {
    if (!deleteButtonTarget) return;
    await deleteCustomSymbol(deleteButtonTarget.id);
    setDeleteButtonTarget(null);
    refresh();
  }, [deleteButtonTarget, deleteCustomSymbol, refresh]);

  const handleDuplicate = useCallback(async (sym: DbSymbol) => {
    await duplicateCustomButton(sym.id);
    refresh();
  }, [duplicateCustomButton, refresh]);

  const handleResetEdit = useCallback(async (item: EditListItem) => {
    if (!confirm(`Reset "${item.edited.label}" back to its built-in defaults? Any image, name, phrase, and recording you set will be removed.`)) return;
    await deleteOverride(item.original.id);
    await loadSymbols(currentBoardId);
    refresh();
  }, [deleteOverride, loadSymbols, currentBoardId, refresh]);

  const handleDeleteBoard = useCallback(async () => {
    if (!deleteBoardTarget) return;
    if (boardDeleteMode === 'cascade') {
      await deleteCustomBoardCascade(deleteBoardTarget.board.id);
    } else {
      await deleteCustomBoardMoveContents(deleteBoardTarget.board.id, boardDeleteMoveTarget);
    }
    setDeleteBoardTarget(null);
    refresh();
  }, [deleteBoardTarget, boardDeleteMode, boardDeleteMoveTarget, deleteCustomBoardCascade, deleteCustomBoardMoveContents, refresh]);

  // Boards a user can move contents INTO when deleting a custom board:
  // exclude system bar boards and the board being deleted itself.
  const moveTargetOptions = useMemo(() => {
    const skip = new Set(['quickfires', 'corewords', 'repairs']);
    if (deleteBoardTarget) skip.add(deleteBoardTarget.board.id);
    return allBoards.filter((b) => !skip.has(b.id));
  }, [allBoards, deleteBoardTarget]);

  return (
    <section className="settings-section custom-content-manager">
      <h2 className="settings-section-title">My Custom Content</h2>
      <p className="settings-hint">
        Manage every button and board you've created. Use ↑ and ↓ to reorder, ✏️ to edit, 📋 to duplicate, 🗑️ to delete.
      </p>

      <div className="ccm-tabs" role="tablist" aria-label="Custom content type">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'buttons'}
          className={`ccm-tab${tab === 'buttons' ? ' active' : ''}`}
          onClick={() => setTab('buttons')}
        >
          My Buttons
          <span className="ccm-tab-count">{buttons.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'boards'}
          className={`ccm-tab${tab === 'boards' ? ' active' : ''}`}
          onClick={() => setTab('boards')}
        >
          My Boards
          <span className="ccm-tab-count">{boards.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'edits'}
          className={`ccm-tab${tab === 'edits' ? ' active' : ''}`}
          onClick={() => setTab('edits')}
        >
          My Edits
          <span className="ccm-tab-count">{edits.length}</span>
        </button>
      </div>

      {tab === 'buttons' && (
        <div className="ccm-list" role="list">
          {buttons.length === 0 ? (
            <div className="ccm-empty">No custom buttons yet. Tap the green + on any board to make one.</div>
          ) : (
            buttons.map((b) => {
              const sameBoardCustoms = buttons.filter((x) => x.symbol.boardId === b.symbol.boardId);
              const localIdx = sameBoardCustoms.findIndex((x) => x.symbol.id === b.symbol.id);
              const canUp = localIdx > 0;
              const canDown = localIdx < sameBoardCustoms.length - 1;
              return (
                <div key={b.symbol.id} className="ccm-row" role="listitem">
                  <div className="ccm-row-thumb">
                    {b.symbol.imageUrl ? (
                      <img src={b.symbol.imageUrl} alt="" />
                    ) : b.symbol.emoji ? (
                      <span className="ccm-row-emoji">{b.symbol.emoji}</span>
                    ) : (
                      <span className="ccm-row-text-only">Aa</span>
                    )}
                  </div>
                  <div className="ccm-row-info">
                    <div className="ccm-row-name">{b.symbol.label}</div>
                    {b.symbol.phrase !== b.symbol.label && (
                      <div className="ccm-row-phrase">"{b.symbol.phrase}"</div>
                    )}
                    <div className="ccm-row-meta">in {b.boardName}</div>
                  </div>
                  <div className="ccm-row-actions">
                    <button type="button" className="ccm-action" disabled={!canUp} aria-label="Move up" onClick={() => moveButton(b.symbol, -1)}>↑</button>
                    <button type="button" className="ccm-action" disabled={!canDown} aria-label="Move down" onClick={() => moveButton(b.symbol, 1)}>↓</button>
                    <button type="button" className="ccm-action" aria-label="Edit" title="Edit" onClick={() => setEditButton(b.symbol)}>✏️</button>
                    <button type="button" className="ccm-action" aria-label="Duplicate" title="Duplicate" onClick={() => handleDuplicate(b.symbol)}>📋</button>
                    <button type="button" className="ccm-action ccm-action-delete" aria-label="Delete" title="Delete" onClick={() => setDeleteButtonTarget(b.symbol)}>🗑️</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'boards' && (
        <div className="ccm-list" role="list">
          {boards.length === 0 ? (
            <div className="ccm-empty">No custom boards yet. Open Home and tap the purple + Create Board tile.</div>
          ) : (
            boards.map((b, i) => {
              const canUp = i > 0;
              const canDown = i < boards.length - 1;
              return (
                <div key={b.board.id} className="ccm-row" role="listitem">
                  <div
                    className="ccm-row-thumb"
                    style={{ borderColor: b.categorySymbol.color }}
                  >
                    {b.categorySymbol.imageUrl ? (
                      <img src={b.categorySymbol.imageUrl} alt="" />
                    ) : b.categorySymbol.emoji ? (
                      <span className="ccm-row-emoji">{b.categorySymbol.emoji}</span>
                    ) : (
                      <span className="ccm-row-text-only">Aa</span>
                    )}
                  </div>
                  <div className="ccm-row-info">
                    <div className="ccm-row-name">{b.board.name}</div>
                    <div className="ccm-row-meta">
                      <span className="ccm-color-dot" style={{ background: b.categorySymbol.color }} aria-hidden="true" />
                      {b.buttonCount} {b.buttonCount === 1 ? 'button' : 'buttons'}
                    </div>
                  </div>
                  <div className="ccm-row-actions">
                    <button type="button" className="ccm-action" disabled={!canUp} aria-label="Move up" onClick={() => moveBoard(b, -1)}>↑</button>
                    <button type="button" className="ccm-action" disabled={!canDown} aria-label="Move down" onClick={() => moveBoard(b, 1)}>↓</button>
                    <button type="button" className="ccm-action" aria-label="Edit" title="Edit" onClick={() => setEditBoard({ board: b.board, categorySymbol: b.categorySymbol })}>✏️</button>
                    <button
                      type="button"
                      className="ccm-action ccm-action-delete"
                      aria-label="Delete"
                      title="Delete"
                      onClick={() => {
                        setDeleteBoardTarget(b);
                        setBoardDeleteMode('cascade');
                        setBoardDeleteMoveTarget('home');
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'edits' && (
        <div className="ccm-list" role="list">
          {edits.length === 0 ? (
            <div className="ccm-empty">
              No edited built-in buttons yet. Long-press any button (or turn on Edit Mode) to customize it.
            </div>
          ) : (
            edits.map((item) => {
              const nameChanged = item.original.label !== item.edited.label;
              return (
                <div key={item.original.id} className="ccm-row" role="listitem">
                  <div className="ccm-row-thumb">
                    {item.edited.imageUrl ? (
                      <img src={item.edited.imageUrl} alt="" />
                    ) : item.edited.emoji ? (
                      <span className="ccm-row-emoji">{item.edited.emoji}</span>
                    ) : (
                      <span className="ccm-row-text-only">Aa</span>
                    )}
                  </div>
                  <div className="ccm-row-info">
                    <div className="ccm-row-name">{item.edited.label}</div>
                    {nameChanged && (
                      <div className="ccm-row-phrase">was: "{item.original.label}"</div>
                    )}
                    <div className="ccm-row-meta">in {item.boardName}</div>
                  </div>
                  <div className="ccm-row-actions">
                    <button type="button" className="ccm-action" aria-label="Edit" title="Edit" onClick={() => setEditButton(item.edited)}>✏️</button>
                    <button
                      type="button"
                      className="ccm-action ccm-action-delete"
                      aria-label="Reset to default"
                      title="Reset to default"
                      onClick={() => handleResetEdit(item)}
                    >
                      ↺
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── Edit modals ── */}
      <CustomButtonModal
        open={!!editButton}
        editTarget={editButton}
        onClose={() => { setEditButton(null); refresh(); }}
      />
      <CustomBoardModal
        open={!!editBoard}
        editTarget={editBoard}
        onClose={() => { setEditBoard(null); refresh(); }}
      />

      {/* ── Confirm delete: button ── */}
      {deleteButtonTarget && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDeleteButtonTarget(null); }}>
          <div className="modal ccm-confirm">
            <h2 className="modal-title">Delete custom button?</h2>
            <p className="ccm-confirm-text">
              Are you sure you want to delete <strong>{deleteButtonTarget.label}</strong>?
              This can't be undone.
            </p>
            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setDeleteButtonTarget(null)}>Cancel</button>
              <button className="modal-btn primary ccm-confirm-danger" onClick={handleDeleteButton}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm delete: board (cascade or move) ── */}
      {deleteBoardTarget && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setDeleteBoardTarget(null); }}>
          <div className="modal ccm-confirm">
            <h2 className="modal-title">Delete this board?</h2>
            <p className="ccm-confirm-text">
              <strong>{deleteBoardTarget.board.name}</strong> contains{' '}
              <strong>{deleteBoardTarget.buttonCount}</strong> {deleteBoardTarget.buttonCount === 1 ? 'button' : 'buttons'}. What should happen to them?
            </p>

            <div className="ccm-confirm-options" role="radiogroup" aria-label="What to do with the buttons">
              <label className={`ccm-confirm-option${boardDeleteMode === 'cascade' ? ' active' : ''}`}>
                <input
                  type="radio"
                  name="board-delete-mode"
                  checked={boardDeleteMode === 'cascade'}
                  onChange={() => setBoardDeleteMode('cascade')}
                />
                <span>
                  <strong>Delete board and all its buttons</strong>
                  <small>Everything inside is removed too.</small>
                </span>
              </label>
              <label className={`ccm-confirm-option${boardDeleteMode === 'move' ? ' active' : ''}`}>
                <input
                  type="radio"
                  name="board-delete-mode"
                  checked={boardDeleteMode === 'move'}
                  onChange={() => setBoardDeleteMode('move')}
                />
                <span>
                  <strong>Move buttons to another board</strong>
                  <small>The board is deleted but its buttons are kept.</small>
                </span>
              </label>
              {boardDeleteMode === 'move' && (
                <select
                  className="cbm-board-select"
                  value={boardDeleteMoveTarget}
                  onChange={(e) => setBoardDeleteMoveTarget(e.target.value)}
                >
                  {moveTargetOptions.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id === 'home' ? '🏠 Home / Quick Access' : `${b.emoji} ${b.name}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="modal-actions">
              <button className="modal-btn cancel" onClick={() => setDeleteBoardTarget(null)}>Cancel</button>
              <button className="modal-btn primary ccm-confirm-danger" onClick={handleDeleteBoard}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
