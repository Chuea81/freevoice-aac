import { useState, useEffect, useRef, useCallback } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { type Board as DbBoard, type Symbol as DbSymbol } from '../../db';
import { ImageSourcePicker, type PickerSelection } from './ImageSourcePicker';

interface ColorPreset { name: string; value: string; }

const COLOR_PRESETS: ColorPreset[] = [
  { name: 'Red',    value: '#E57373' },
  { name: 'Orange', value: '#FFB74D' },
  { name: 'Yellow', value: '#FFD54F' },
  { name: 'Green',  value: '#81C784' },
  { name: 'Blue',   value: '#64B5F6' },
  { name: 'Purple', value: '#BA68C8' },
  { name: 'Pink',   value: '#F06292' },
];

const DEFAULT_PICKER: PickerSelection = { mode: 'emoji', emoji: '📁' };

function pickerSelectionFromCategorySymbol(s: DbSymbol): PickerSelection {
  if (s.imageUrl) return { mode: 'symbols', emoji: s.emoji, imageUrl: s.imageUrl };
  if (s.emoji)    return { mode: 'emoji',   emoji: s.emoji };
  return { mode: 'none', emoji: '' };
}

interface Props {
  open: boolean;
  onClose: () => void;
  // When provided, switches the modal to "edit" mode and prefills name,
  // icon, color, and image from the existing board + its category symbol.
  editTarget?: { board: DbBoard; categorySymbol: DbSymbol } | null;
}

export function CustomBoardModal({ open, onClose, editTarget }: Props) {
  const createCustomBoard = useBoardStore((s) => s.createCustomBoard);
  const updateCustomBoardMeta = useBoardStore((s) => s.updateCustomBoardMeta);
  const isEditing = !!editTarget;

  const [name, setName] = useState('');
  const [picker, setPicker] = useState<PickerSelection>(DEFAULT_PICKER);
  const [color, setColor] = useState<string>(COLOR_PRESETS[3].value);
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editTarget) {
      const { board, categorySymbol } = editTarget;
      setName(board.name);
      setPicker(pickerSelectionFromCategorySymbol(categorySymbol));
      setColor(categorySymbol.color || COLOR_PRESETS[3].value);
    } else {
      setName('');
      setPicker(DEFAULT_PICKER);
      setColor(COLOR_PRESETS[3].value);
    }
    setTimeout(() => nameInputRef.current?.focus(), 80);
  }, [open, editTarget]);

  const previewEmoji = picker.mode === 'emoji'
    ? picker.emoji
    : (picker.mode === 'symbols' ? picker.emoji : '');
  const previewImageUrl = picker.imageUrl;
  const previewLabel = name.trim() || 'Board name';

  const canSave = name.trim().length > 0 && !saving;

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const trimmedName = name.trim();
      const finalEmoji = picker.mode === 'none' ? '' : picker.emoji;
      const finalImageUrl = picker.imageUrl;
      if (editTarget) {
        await updateCustomBoardMeta(editTarget.board.id, {
          name: trimmedName,
          emoji: finalEmoji,
          color,
          imageUrl: finalImageUrl,
        });
      } else {
        await createCustomBoard(trimmedName, finalEmoji, color, finalImageUrl, 'home');
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }, [canSave, name, picker, color, createCustomBoard, updateCustomBoardMeta, editTarget, onClose]);

  const handleEnter = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
  }, [handleSave]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal custom-button-modal">
        <h2 className="modal-title">{isEditing ? '✏️ Edit Board' : '📁 Create New Board'}</h2>

        {/* ── Live preview tile ── */}
        <div className="cbm-preview-row">
          <div
            className="cbm-preview-card cbm-preview-board"
            aria-hidden="true"
            style={{ '--card-color': color } as React.CSSProperties}
          >
            <div className="cbm-preview-art">
              {previewImageUrl ? (
                <img src={previewImageUrl} alt="" className="cbm-preview-img" />
              ) : previewEmoji ? (
                <span className="cbm-preview-emoji">{previewEmoji}</span>
              ) : (
                <span className="cbm-preview-text-only">Aa</span>
              )}
            </div>
            <div className="cbm-preview-label">{previewLabel}</div>
            <span className="cbm-preview-badge" title="Custom board">★</span>
          </div>
          <p className="cbm-preview-hint">Live preview · this is how the board tile will look on Home</p>
        </div>

        {/* ── Board Name ── */}
        <div className="modal-field">
          <label htmlFor="cbmod-name">Board Name</label>
          <input
            id="cbmod-name"
            ref={nameInputRef}
            type="text"
            placeholder="e.g. My Family · School · Bedtime"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleEnter}
            maxLength={28}
          />
        </div>

        {/* ── Image source picker (Emoji · Symbols · Web · Upload · None) ── */}
        <div className="modal-field">
          <label>Board Icon</label>
          <ImageSourcePicker value={picker} onChange={setPicker} defaultEmojiCategory="objects" />
        </div>

        {/* ── Color picker ── */}
        <div className="modal-field">
          <label>Board Color</label>
          <div className="cbm-color-row" role="radiogroup" aria-label="Board color">
            {COLOR_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                role="radio"
                aria-checked={color === p.value}
                aria-label={p.name}
                title={p.name}
                className={`cbm-color-swatch${color === p.value ? ' selected' : ''}`}
                style={{ background: p.value }}
                onClick={() => setColor(p.value)}
              />
            ))}
            <label className="cbm-color-custom" title="Pick any color">
              <span aria-hidden="true">🎨</span>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                aria-label="Custom color"
              />
            </label>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="modal-btn primary" onClick={handleSave} disabled={!canSave}>
            {saving ? 'Saving…' : isEditing ? 'Update Board' : 'Create Board'}
          </button>
        </div>
      </div>
    </div>
  );
}
