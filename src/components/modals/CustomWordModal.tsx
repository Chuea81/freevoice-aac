import { useState, useRef, useCallback, useEffect } from 'react';
import { useBoardStore } from '../../store/boardStore';

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
  boardId?: string; // Target board — defaults to 'custom'
}

export function CustomWordModal({ open, onClose, editSymbol, boardId = 'custom' }: Props) {
  const addSymbolToBoard = useBoardStore((s) => s.addSymbolToBoard);
  const updateCustomSymbol = useBoardStore((s) => s.updateCustomSymbol);

  const [selectedEmoji, setSelectedEmoji] = useState('⭐');
  const [label, setLabel] = useState('');
  const [phrase, setPhrase] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
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
  }, [editSymbol, open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => labelInputRef.current?.focus(), 100);
    }
  }, [open]);

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
      await addSymbolToBoard(boardId, selectedEmoji, trimmedLabel, phrase.trim() || trimmedLabel, imageUrl);
    }
    onClose();
  }, [label, phrase, selectedEmoji, photoPreview, editSymbol, addSymbolToBoard, updateCustomSymbol, onClose, boardId]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <h2 className="modal-title">
          {editSymbol ? '✏️ Edit Word' : '✨ Add Word'}
        </h2>

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
