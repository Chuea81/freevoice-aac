import { useEffect, useState, useCallback } from 'react';
import { useBoardStore } from '../../store/boardStore';
import type { Board } from '../../db';

interface Props {
  open: boolean;
  title: string;
  currentBoardId: string;
  onSelect: (boardId: string) => void;
  onClose: () => void;
}

export function BoardPicker({ open, title, currentBoardId, onSelect, onClose }: Props) {
  const getAllBoards = useBoardStore((s) => s.getAllBoards);
  const [boards, setBoards] = useState<Board[]>([]);

  useEffect(() => {
    if (open) {
      getAllBoards().then(setBoards);
    }
  }, [open, getAllBoards]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal" style={{ maxWidth: 360 }}>
        <h2 className="modal-title">{title}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '60dvh', overflowY: 'auto' }}>
          {boards
            .filter((b) => b.id !== currentBoardId && b.id !== 'quickfires' && b.id !== 'corewords' && b.id !== 'repairs')
            .map((b) => (
              <button
                key={b.id}
                className="context-menu-btn edit"
                style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}
                onClick={() => onSelect(b.id)}
              >
                <span style={{ fontSize: 20 }}>{b.emoji}</span>
                <span>{b.name}</span>
              </button>
            ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <button className="context-menu-btn cancel-btn" onClick={onClose} style={{ width: '100%' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
