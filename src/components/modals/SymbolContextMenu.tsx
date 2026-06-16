import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useModalA11y } from '../../hooks/useModalA11y';

interface Props {
  open: boolean;
  label: string;
  isCategory?: boolean;
  onEdit: () => void;
  onMove: () => void;
  onDelete: () => void;
  onAddInside?: () => void;
  onClose: () => void;
}

export function SymbolContextMenu({ open, label, isCategory, onEdit, onMove, onDelete, onAddInside, onClose }: Props) {
  const { t } = useTranslation();
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const dialogRef = useModalA11y(open, onClose);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="context-menu" ref={dialogRef} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>
        <h3 className="context-menu-title">{label}</h3>
        {isCategory && onAddInside && (
          <button className="context-menu-btn edit" onClick={onAddInside}>
            {t('contextMenu.addInside', '➕ Add symbol inside')}
          </button>
        )}
        <button className="context-menu-btn edit" onClick={onEdit}>
          {t('contextMenu.edit', '✏️ Edit')}
        </button>
        <button className="context-menu-btn edit" onClick={onMove}>
          {t('contextMenu.move', '📂 Move to Board...')}
        </button>
        <button className="context-menu-btn delete" onClick={onDelete}>
          {t('contextMenu.delete', '🗑️ Delete')}
        </button>
        <button className="context-menu-btn cancel-btn" onClick={onClose}>
          {t('contextMenu.cancel', 'Cancel')}
        </button>
      </div>
    </div>
  );
}
