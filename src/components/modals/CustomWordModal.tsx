import { useState, useRef, useCallback, useEffect } from 'react';
import { useBoardStore } from '../../store/boardStore';
import type { Board } from '../../db';

const EMOJI_OPTIONS = [
  '⭐','🌈','🎈','🌸','🦋','🐶','🐱','🐻','🦁','🐸',
  '🐢','🦊','🐼','🦄','🐠','🦀','🌺','🍉','🍦','🎉',
  '🎸','⚽','🎨','🚀','🌙','☀️','❤️','💜','💙','💚',
  '🧡','🤍','🏆','🎯','🎪','🎠','🎡','🌊','🏄','🎋',
  '🍄','🌻','🦩','🦚','🦜','🐬','🐳','🌟','💎','🔮',
];

interface Props {
  open: boolean;
  onClose: () => void;
  editSymbol?: { id: string; emoji: string; label: string; phrase: string; imageUrl?: string } | null;
  boardId?: string;
}

export function CustomWordModal({ open, onClose, editSymbol, boardId = 'custom' }: Props) {
  const addSymbolToBoard = useBoardStore((s) => s.addSymbolToBoard);
  const updateCustomSymbol = useBoardStore((s) => s.updateCustomSymbol);
  const getAllBoards = useBoardStore((s) => s.getAllBoards);

  const [selectedEmoji, setSelectedEmoji] = useState('⭐');
  const [label, setLabel] = useState('');
  const [phrase, setPhrase] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [targetBoard, setTargetBoard] = useState(boardId);
  const [boards, setBoards] = useState<Board[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editSymbol) {
      setSelectedEmoji(editSymbol.emoji);
      setLabel(editSymbol.label);
      setPhrase(editSymbol.phrase !== editSymbol.label ? editSymbol.phrase : '');
      setPhotoPreview(editSymbol.imageUrl || null);
    } else {
      setSelectedEmoji('⭐');
      setLabel('');
      setPhrase('');
      setPhotoPreview(null);
    }
    setTargetBoard(boardId);
  }, [editSymbol, open, boardId]);

  useEffect(() => {
    if (open) {
      getAllBoards().then(setBoards);
      setTimeout(() => labelInputRef.current?.focus(), 100);
    }
  }, [open, getAllBoards]);

  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleSave = useCallback(async () => {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      labelInputRef.current?.focus();
      return;
    }
    const imageUrl = photoPreview || undefined;

    if (editSymbol) {
      await updateCustomSymbol(editSymbol.id, selectedEmoji, trimmedLabel, phrase.trim() || trimmedLabel, imageUrl);
    } else {
      await addSymbolToBoard(targetBoard, selectedEmoji, trimmedLabel, phrase.trim() || trimmedLabel, imageUrl);
    }
    onClose();
  }, [label, phrase, selectedEmoji, photoPreview, editSymbol, addSymbolToBoard, updateCustomSymbol, onClose, targetBoard]);

  if (!open) return null;

  // Filter boards for the dropdown — exclude system boards
  const selectableBoards = boards.filter((b) =>
    b.id !== 'quickfires' && b.id !== 'corewords' && b.id !== 'repairs'
  );

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h2 className="modal-title">
          {editSymbol ? '✏️ Edit Symbol' : '✨ Add Symbol'}
        </h2>

        {/* Board picker — only for new symbols */}
        {!editSymbol && selectableBoards.length > 0 && (
          <div className="modal-field">
            <label>Add to Board</label>
            <select
              value={targetBoard}
              onChange={(e) => setTargetBoard(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px',
                borderRadius: '12px', border: '1px solid var(--border-raised)',
                fontSize: '16px', fontWeight: 700,
                fontFamily: 'var(--font-body)',
                background: 'var(--bg-surface)', color: 'var(--text-primary)',
                outline: 'none',
              }}
            >
              {selectableBoards.map((b) => (
                <option key={b.id} value={b.id}>{b.emoji} {b.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="modal-field">
          <label>Choose an Emoji</label>
          <div className="emoji-picker">
            {EMOJI_OPTIONS.map((e) => (
              <div
                key={e}
                className={`emoji-opt${e === selectedEmoji ? ' selected' : ''}`}
                onClick={() => setSelectedEmoji(e)}
              >
                {e}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-field">
          <label>Or Upload a Photo</label>
          <div className="photo-upload-area">
            {photoPreview ? (
              <div className="photo-preview-container">
                <img src={photoPreview} alt="Preview" className="photo-preview" />
                <button
                  className="photo-remove-btn"
                  onClick={() => { setPhotoPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <button className="photo-upload-btn" onClick={() => fileInputRef.current?.click()}>
                📷 Choose Photo
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
          </div>
        </div>

        <div className="modal-field">
          <label>Word or Label (short)</label>
          <input ref={labelInputRef} type="text" placeholder="e.g. Grandma" maxLength={20} value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>

        <div className="modal-field">
          <label>Full Phrase to Speak</label>
          <input type="text" placeholder="e.g. I want to call Grandma" value={phrase} onChange={(e) => setPhrase(e.target.value)} />
        </div>

        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={onClose}>Cancel</button>
          <button className="modal-btn primary" onClick={handleSave}>
            {editSymbol ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
