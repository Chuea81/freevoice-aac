import { useCallback } from 'react';

interface Props {
  open: boolean;
  label: string;
  isCategory?: boolean;
  /** COR-01: built-in (default-) symbols can only be hidden, not edited/moved/
   * deleted — those operations silently fail on symbols that live in
   * symbols.json rather than the user's database. */
  isDefault?: boolean;
  onEdit: () => void;
  onMove: () => void;
  onDelete: () => void;
  onAddInside?: () => void;
  onClose: () => void;
}

export function SymbolContextMenu({ open, label, isCategory, isDefault, onEdit, onMove, onDelete, onAddInside, onClose }: Props) {
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="context-menu">
        <h3 className="context-menu-title">{label}</h3>
        {isDefault ? (
          // Built-in symbol: the only honest, working action is to hide it.
          <>
            <p className="context-menu-hint" style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
              This is a built-in symbol. You can hide it from this board.
            </p>
            <button className="context-menu-btn delete" onClick={onDelete}>
              🙈 Hide from board
            </button>
          </>
        ) : (
          <>
            {isCategory && onAddInside && (
              <button className="context-menu-btn edit" onClick={onAddInside}>
                ➕ Add symbol inside
              </button>
            )}
            <button className="context-menu-btn edit" onClick={onEdit}>
              ✏️ Edit
            </button>
            <button className="context-menu-btn edit" onClick={onMove}>
              📂 Move to Board...
            </button>
            <button className="context-menu-btn delete" onClick={onDelete}>
              🗑️ Delete
            </button>
          </>
        )}
        <button className="context-menu-btn cancel-btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
