import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { db, type Board, type Symbol as DbSymbol } from '../../db';
import { EMOJI_CATEGORIES, EMOJI_DATA, type EmojiCategory, type EmojiEntry } from '../../data/emojiPickerData';

type ImageMode = 'emoji' | 'search' | 'none';


interface Props {
  open: boolean;
  onClose: () => void;
  // When provided, the modal switches to "edit" mode: prefills every field
  // from the symbol and routes Save through updateCustomButton instead of
  // addSymbolToBoard. The board placement dropdown is still shown so the
  // caregiver can move the button to a different board.
  editTarget?: DbSymbol | null;
}

export function CustomButtonModal({ open, onClose, editTarget }: Props) {
  const addSymbolToBoard = useBoardStore((s) => s.addSymbolToBoard);
  const updateCustomButton = useBoardStore((s) => s.updateCustomButton);
  const getAllBoards = useBoardStore((s) => s.getAllBoards);
  const currentBoardId = useBoardStore((s) => s.currentBoardId);
  const isEditing = !!editTarget;

  const [name, setName] = useState('');
  const [phrase, setPhrase] = useState('');
  const [imageMode, setImageMode] = useState<ImageMode>('emoji');
  const [emoji, setEmoji] = useState('⭐');
  const [emojiCategory, setEmojiCategory] = useState<EmojiCategory>('people');
  const [emojiQuery, setEmojiQuery] = useState('');
  const [imageQuery, setImageQuery] = useState('');
  const [imageCandidates, setImageCandidates] = useState<DbSymbol[]>([]);
  const [pickedImageEmoji, setPickedImageEmoji] = useState<string | null>(null);
  const [pickedImageUrl, setPickedImageUrl] = useState<string | undefined>(undefined);
  const [boards, setBoards] = useState<Board[]>([]);
  const [targetBoard, setTargetBoard] = useState<string>(currentBoardId || 'home');
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset / prefill on open. When editing, fill every field from the
  // existing symbol; otherwise start from defaults.
  useEffect(() => {
    if (!open) return;
    if (editTarget) {
      setName(editTarget.label);
      setPhrase(editTarget.phrase !== editTarget.label ? editTarget.phrase : '');
      if (editTarget.imageUrl) {
        setImageMode('search');
        setPickedImageEmoji(editTarget.emoji);
        setPickedImageUrl(editTarget.imageUrl);
      } else if (editTarget.emoji) {
        setImageMode('emoji');
        setEmoji(editTarget.emoji);
        setPickedImageEmoji(null);
        setPickedImageUrl(undefined);
      } else {
        setImageMode('none');
        setPickedImageEmoji(null);
        setPickedImageUrl(undefined);
      }
      setEmojiCategory('people');
      setEmojiQuery('');
      setImageQuery('');
      setTargetBoard(editTarget.boardId);
    } else {
      setName('');
      setPhrase('');
      setImageMode('emoji');
      setEmoji('⭐');
      setEmojiCategory('people');
      setEmojiQuery('');
      setImageQuery('');
      setPickedImageEmoji(null);
      setPickedImageUrl(undefined);
      setTargetBoard(currentBoardId || 'home');
    }
    setTimeout(() => nameInputRef.current?.focus(), 80);
  }, [open, currentBoardId, editTarget]);

  // Load boards when modal opens
  useEffect(() => {
    if (!open) return;
    getAllBoards().then(setBoards);
  }, [open, getAllBoards]);

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
  const previewLabel = name.trim() || 'Button name';

  // Filter system bar boards out of the placement dropdown — they don't render
  // a regular grid so an Add card can't surface there. Sub-boards (parented
  // off something) are kept so caregivers can place a button into a custom
  // sub-folder they already created.
  const placementOptions = useMemo(() => {
    const skip = new Set(['quickfires', 'corewords', 'repairs']);
    const items = boards.filter((b) => !skip.has(b.id));
    const home = items.find((b) => b.id === 'home');
    const rest = items.filter((b) => b.id !== 'home');
    return home ? [home, ...rest] : items;
  }, [boards]);

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
      const finalPhrase = phrase.trim() || trimmedName;
      if (editTarget) {
        await updateCustomButton(editTarget.id, {
          emoji: finalEmoji,
          label: trimmedName,
          phrase: finalPhrase,
          imageUrl: finalImageUrl,
          boardId: targetBoard,
        });
      } else {
        await addSymbolToBoard(targetBoard, finalEmoji, trimmedName, finalPhrase, finalImageUrl);
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }, [canSave, name, phrase, emoji, imageMode, pickedImageEmoji, pickedImageUrl, targetBoard, addSymbolToBoard, updateCustomButton, editTarget, onClose]);

  const handleEnter = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
  }, [handleSave]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal custom-button-modal">
        <h2 className="modal-title">{isEditing ? '✏️ Edit Custom Button' : '✨ Create Custom Button'}</h2>

        {/* ── Live preview ── */}
        <div className="cbm-preview-row">
          <div className="cbm-preview-card" aria-hidden="true">
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
            <span className="cbm-preview-badge" title="Custom button">★</span>
          </div>
          <p className="cbm-preview-hint">Live preview · this is how the button will look on the board</p>
        </div>

        {/* ── Name & Phrase ── */}
        <div className="modal-field">
          <label htmlFor="cbm-name">Button Name</label>
          <input
            id="cbm-name"
            ref={nameInputRef}
            type="text"
            placeholder="What appears under the button"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleEnter}
            maxLength={28}
          />
        </div>

        <div className="modal-field">
          <label htmlFor="cbm-phrase">Spoken Phrase</label>
          <input
            id="cbm-phrase"
            type="text"
            placeholder={name ? `e.g. "${name}, please"` : 'What the app says when tapped'}
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            onKeyDown={handleEnter}
            maxLength={120}
          />
          <span className="cbm-field-hint">Defaults to the button name if you leave it blank.</span>
        </div>

        {/* ── Image mode tabs ── */}
        <div className="modal-field">
          <label>Button Image</label>
          <div className="cbm-mode-tabs" role="tablist" aria-label="Image source">
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

        {/* ── Image mode panel ── */}
        {imageMode === 'emoji' && (
          <div className="cbm-image-panel">
            <input
              type="search"
              placeholder="Search emojis (e.g. happy, dog, food)"
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
            <p>Text-only — the button will show its name with no image or emoji.</p>
          </div>
        )}

        {/* ── Board placement ── */}
        <div className="modal-field">
          <label htmlFor="cbm-board">Add to Board</label>
          <select
            id="cbm-board"
            value={targetBoard}
            onChange={(e) => setTargetBoard(e.target.value)}
            className="cbm-board-select"
          >
            {placementOptions.map((b) => (
              <option key={b.id} value={b.id}>
                {b.id === 'home' ? '🏠 Home / Quick Access' : `${b.emoji} ${b.name}`}
              </option>
            ))}
          </select>
        </div>

        {/* ── Actions ── */}
        <div className="modal-actions">
          <button className="modal-btn cancel" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="modal-btn primary" onClick={handleSave} disabled={!canSave}>
            {saving ? 'Saving…' : isEditing ? 'Update Button' : 'Save Button'}
          </button>
        </div>
      </div>
    </div>
  );
}
