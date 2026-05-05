import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { db, type Board as DbBoard, type Symbol as DbSymbol } from '../../db';
import { EMOJI_CATEGORIES, EMOJI_DATA, type EmojiCategory, type EmojiEntry } from '../../data/emojiPickerData';

type ImageMode = 'emoji' | 'search' | 'none';

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
  const [imageMode, setImageMode] = useState<ImageMode>('emoji');
  const [emoji, setEmoji] = useState('📁');
  const [emojiCategory, setEmojiCategory] = useState<EmojiCategory>('objects');
  const [emojiQuery, setEmojiQuery] = useState('');
  const [imageQuery, setImageQuery] = useState('');
  const [imageCandidates, setImageCandidates] = useState<DbSymbol[]>([]);
  const [pickedImageEmoji, setPickedImageEmoji] = useState<string | null>(null);
  const [pickedImageUrl, setPickedImageUrl] = useState<string | undefined>(undefined);
  const [color, setColor] = useState<string>(COLOR_PRESETS[3].value);
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset / prefill on open. When editing, fill from the existing board
  // and its category-tile symbol.
  useEffect(() => {
    if (!open) return;
    if (editTarget) {
      const { board, categorySymbol } = editTarget;
      setName(board.name);
      if (categorySymbol.imageUrl) {
        setImageMode('search');
        setPickedImageEmoji(categorySymbol.emoji);
        setPickedImageUrl(categorySymbol.imageUrl);
      } else if (categorySymbol.emoji) {
        setImageMode('emoji');
        setEmoji(categorySymbol.emoji);
        setPickedImageEmoji(null);
        setPickedImageUrl(undefined);
      } else {
        setImageMode('none');
        setPickedImageEmoji(null);
        setPickedImageUrl(undefined);
      }
      setEmojiCategory('objects');
      setEmojiQuery('');
      setImageQuery('');
      setColor(categorySymbol.color || COLOR_PRESETS[3].value);
    } else {
      setName('');
      setImageMode('emoji');
      setEmoji('📁');
      setEmojiCategory('objects');
      setEmojiQuery('');
      setImageQuery('');
      setPickedImageEmoji(null);
      setPickedImageUrl(undefined);
      setColor(COLOR_PRESETS[3].value);
    }
    setTimeout(() => nameInputRef.current?.focus(), 80);
  }, [open, editTarget]);

  // Image-search tab: query existing default symbols by label substring
  useEffect(() => {
    if (!open || imageMode !== 'search') return;
    const q = imageQuery.trim().toLowerCase();
    let cancelled = false;
    (async () => {
      const all = await db.symbols.toArray();
      if (cancelled) return;
      const matches = all
        .filter((s) => !s.isCategory && s.id.startsWith('default-'))
        .filter((s) => (q ? s.label.toLowerCase().includes(q) : true))
        .slice(0, 80);
      setImageCandidates(matches);
    })();
    return () => { cancelled = true; };
  }, [open, imageMode, imageQuery]);

  const visibleEmojis = useMemo(() => {
    const q = emojiQuery.trim().toLowerCase();
    if (q) {
      const all = (Object.values(EMOJI_DATA) as EmojiEntry[][]).flat();
      return all.filter((e) => e.keywords.includes(q));
    }
    return EMOJI_DATA[emojiCategory];
  }, [emojiQuery, emojiCategory]);

  const previewEmoji = imageMode === 'emoji'
    ? emoji
    : imageMode === 'search'
      ? (pickedImageEmoji ?? '')
      : '';
  const previewImageUrl = imageMode === 'search' ? pickedImageUrl : undefined;
  const previewLabel = name.trim() || 'Board name';

  const canSave = name.trim().length > 0 && !saving;

  const handleSave = useCallback(async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const trimmedName = name.trim();
      const finalEmoji = imageMode === 'emoji'
        ? emoji
        : imageMode === 'search'
          ? (pickedImageEmoji ?? '')
          : '';
      const finalImageUrl = imageMode === 'search' ? pickedImageUrl : undefined;
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
  }, [canSave, name, emoji, imageMode, pickedImageEmoji, pickedImageUrl, color, createCustomBoard, updateCustomBoardMeta, editTarget, onClose]);

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

        {/* ── Icon mode tabs ── */}
        <div className="modal-field">
          <label>Board Icon</label>
          <div className="cbm-mode-tabs" role="tablist" aria-label="Icon source">
            <button
              type="button"
              role="tab"
              aria-selected={imageMode === 'emoji'}
              className={`cbm-mode-tab${imageMode === 'emoji' ? ' active' : ''}`}
              onClick={() => setImageMode('emoji')}
            >
              😀 Emoji
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={imageMode === 'search'}
              className={`cbm-mode-tab${imageMode === 'search' ? ' active' : ''}`}
              onClick={() => setImageMode('search')}
            >
              🔍 Image search
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={imageMode === 'none'}
              className={`cbm-mode-tab${imageMode === 'none' ? ' active' : ''}`}
              onClick={() => setImageMode('none')}
            >
              Aa No image
            </button>
          </div>
        </div>

        {/* ── Icon panel ── */}
        {imageMode === 'emoji' && (
          <div className="cbm-image-panel">
            <input
              type="search"
              placeholder="Search emojis (e.g. family, school, sleep)"
              className="cbm-search-input"
              value={emojiQuery}
              onChange={(e) => setEmojiQuery(e.target.value)}
            />
            {!emojiQuery.trim() && (
              <div className="cbm-emoji-cats" role="tablist" aria-label="Emoji category">
                {EMOJI_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="tab"
                    aria-selected={emojiCategory === c.id}
                    aria-label={c.label}
                    title={c.label}
                    className={`cbm-emoji-cat${emojiCategory === c.id ? ' active' : ''}`}
                    onClick={() => setEmojiCategory(c.id)}
                  >
                    {c.icon}
                  </button>
                ))}
              </div>
            )}
            <div className="cbm-emoji-grid">
              {visibleEmojis.length === 0 ? (
                <div className="cbm-empty">No emojis match "{emojiQuery}".</div>
              ) : (
                visibleEmojis.map((e, i) => (
                  <button
                    key={`${e.char}-${i}`}
                    type="button"
                    className={`cbm-emoji-cell${e.char === emoji ? ' selected' : ''}`}
                    onClick={() => setEmoji(e.char)}
                    aria-label={e.keywords.split(' ')[0]}
                    title={e.keywords}
                  >
                    {e.char}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {imageMode === 'search' && (
          <div className="cbm-image-panel">
            <input
              type="search"
              placeholder="Search existing buttons (e.g. happy, water, school)"
              className="cbm-search-input"
              value={imageQuery}
              onChange={(e) => setImageQuery(e.target.value)}
            />
            <div className="cbm-image-grid">
              {imageCandidates.length === 0 ? (
                <div className="cbm-empty">
                  {imageQuery ? `No matches for "${imageQuery}".` : 'Type to search the existing button library.'}
                </div>
              ) : (
                imageCandidates.map((s) => {
                  const selected = pickedImageEmoji === s.emoji && pickedImageUrl === s.imageUrl;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`cbm-image-cell${selected ? ' selected' : ''}`}
                      onClick={() => { setPickedImageEmoji(s.emoji); setPickedImageUrl(s.imageUrl); }}
                      title={s.label}
                    >
                      {s.imageUrl ? (
                        <img src={s.imageUrl} alt={s.label} />
                      ) : (
                        <span className="cbm-image-cell-emoji">{s.emoji}</span>
                      )}
                      <span className="cbm-image-cell-label">{s.label}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {imageMode === 'none' && (
          <div className="cbm-image-panel cbm-image-panel-none">
            <p>Text-only — the board tile will show its name with no image or emoji.</p>
          </div>
        )}

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
