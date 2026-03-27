import { useCallback } from 'react';

interface Props {
  open: boolean;
  label: string;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function SymbolContextMenu({ open, label, onEdit, onDelete, onClose }: Props) {
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="context-menu">
        <h3 className="context-menu-title">{label}</h3>
        <button className="context-menu-btn edit" onClick={onEdit}>
          ✏️ Edit
        </button>
        <button className="context-menu-btn delete" onClick={onDelete}>
          🗑️ Delete
        </button>
        <button className="context-menu-btn cancel-btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
