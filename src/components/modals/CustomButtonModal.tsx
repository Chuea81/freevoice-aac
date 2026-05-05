import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { useSymbolOverridesStore } from '../../store/symbolOverridesStore';
import { type Board, type Symbol as DbSymbol } from '../../db';
import { ImageSourcePicker, type PickerSelection } from './ImageSourcePicker';
import { VoiceRecorder, type RecordedAudio } from './VoiceRecorder';

type VoiceOption = 'tts' | 'recording';

interface Props {
  open: boolean;
  onClose: () => void;
  // When provided, the modal switches to "edit" mode: prefills every field
  // from the symbol and routes Save through updateCustomButton instead of
  // addSymbolToBoard. The board placement dropdown is still shown so the
  // caregiver can move the button to a different board.
  editTarget?: DbSymbol | null;
}

const DEFAULT_PICKER: PickerSelection = { mode: 'emoji', emoji: '⭐' };

// Pick the right initial picker tab when prefilling from an existing symbol.
// Symbols/web/upload all leave an `imageUrl` behind, so we can't tell the
// original source from the data alone — default to 'symbols' (which renders
// the picked tile correctly) and let the caregiver swap to a different
// source tab if they want.
function pickerSelectionFromSymbol(s: DbSymbol): PickerSelection {
  if (s.imageUrl) return { mode: 'symbols', emoji: s.emoji, imageUrl: s.imageUrl };
  if (s.emoji)    return { mode: 'emoji',   emoji: s.emoji };
  return { mode: 'none', emoji: '' };
}

export function CustomButtonModal({ open, onClose, editTarget }: Props) {
  const addSymbolToBoard = useBoardStore((s) => s.addSymbolToBoard);
  const updateCustomButton = useBoardStore((s) => s.updateCustomButton);
  const loadSymbols = useBoardStore((s) => s.loadSymbols);
  const getAllBoards = useBoardStore((s) => s.getAllBoards);
  const currentBoardId = useBoardStore((s) => s.currentBoardId);
  const setOverride = useSymbolOverridesStore((s) => s.setOverride);
  const deleteOverride = useSymbolOverridesStore((s) => s.deleteOverride);
  const isEditing = !!editTarget;
  // Built-in symbols are seeded with `default-` ids and edited via the
  // override layer, never in place. Custom symbols carry `user-` ids and
  // are edited directly in db.symbols.
  const isBuiltIn = !!editTarget && editTarget.id.startsWith('default-');

  const [name, setName] = useState('');
  const [phrase, setPhrase] = useState('');
  const [picker, setPicker] = useState<PickerSelection>(DEFAULT_PICKER);
  const [voiceOption, setVoiceOption] = useState<VoiceOption>('tts');
  const [audio, setAudio] = useState<RecordedAudio | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [targetBoard, setTargetBoard] = useState<string>(currentBoardId || 'home');
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editTarget) {
      setName(editTarget.label);
      setPhrase(editTarget.phrase !== editTarget.label ? editTarget.phrase : '');
      setPicker(pickerSelectionFromSymbol(editTarget));
      setTargetBoard(editTarget.boardId);
      // Hydrate the recording state from the existing symbol so the modal
      // shows Play/Re-record/Delete instead of a fresh "Record" button.
      if (editTarget.audioBlob) {
        setVoiceOption('recording');
        setAudio({ audioBlob: editTarget.audioBlob, audioMime: editTarget.audioMime || 'audio/webm' });
      } else {
        setVoiceOption('tts');
        setAudio(null);
      }
    } else {
      setName('');
      setPhrase('');
      setPicker(DEFAULT_PICKER);
      setTargetBoard(currentBoardId || 'home');
      setVoiceOption('tts');
      setAudio(null);
    }
    setTimeout(() => nameInputRef.current?.focus(), 80);
  }, [open, currentBoardId, editTarget]);

  useEffect(() => {
    if (!open) return;
    getAllBoards().then(setBoards);
  }, [open, getAllBoards]);

  const previewEmoji = picker.mode === 'emoji' ? picker.emoji : (picker.imageUrl ? (picker.emoji || '') : (picker.mode === 'symbols' ? picker.emoji : ''));
  const previewImageUrl = picker.imageUrl;
  const previewLabel = name.trim() || 'Button name';

  // Filter system bar boards out of the placement dropdown — they don't render
  // a regular grid so an Add card can't surface there.
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
      const finalEmoji = picker.mode === 'none' ? '' : picker.emoji;
      const finalImageUrl = picker.imageUrl;
      const finalPhrase = phrase.trim() || trimmedName;
      // Audio is only stored when the user explicitly chose "Use Custom
      // Recording" AND actually provided one. If they switched back to TTS,
      // pass undefined so any existing recording is cleared on update.
      const finalAudio = voiceOption === 'recording' ? audio : null;
      if (editTarget) {
        if (isBuiltIn) {
          // Built-in: write to the override layer instead of mutating the
          // seeded symbol. Setting fields to undefined here clears them on
          // the override row so the original seeded value shows through.
          await setOverride(editTarget.id, {
            emoji: finalEmoji,
            label: trimmedName,
            phrase: finalPhrase,
            imageUrl: finalImageUrl,
            audioBlob: finalAudio ? finalAudio.audioBlob : undefined,
            audioMime: finalAudio ? finalAudio.audioMime : undefined,
          });
          // Reload current board so the override is visible right away.
          await loadSymbols(currentBoardId);
        } else {
          await updateCustomButton(editTarget.id, {
            emoji: finalEmoji,
            label: trimmedName,
            phrase: finalPhrase,
            imageUrl: finalImageUrl,
            boardId: targetBoard,
            audioBlob: finalAudio ? finalAudio.audioBlob : undefined,
            audioMime: finalAudio ? finalAudio.audioMime : undefined,
          });
        }
      } else {
        await addSymbolToBoard(
          targetBoard,
          finalEmoji,
          trimmedName,
          finalPhrase,
          finalImageUrl,
          undefined,
          finalAudio ? finalAudio.audioBlob : undefined,
          finalAudio ? finalAudio.audioMime : undefined,
        );
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }, [canSave, name, phrase, picker, targetBoard, voiceOption, audio, addSymbolToBoard, updateCustomButton, isBuiltIn, setOverride, loadSymbols, currentBoardId, editTarget, onClose]);

  const handleResetToDefault = useCallback(async () => {
    if (!editTarget || !isBuiltIn) return;
    if (!confirm('Reset this button to its original built-in values? Any edits, image, and recording you made will be removed.')) return;
    setSaving(true);
    try {
      await deleteOverride(editTarget.id);
      await loadSymbols(currentBoardId);
      onClose();
    } finally {
      setSaving(false);
    }
  }, [editTarget, isBuiltIn, deleteOverride, loadSymbols, currentBoardId, onClose]);

  const handleEnter = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
  }, [handleSave]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal custom-button-modal">
        <h2 className="modal-title">
          {isEditing
            ? (isBuiltIn ? '✏️ Edit Built-in Button' : '✏️ Edit Custom Button')
            : '✨ Create Custom Button'}
        </h2>

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

        {/* ── Voice option ── */}
        <div className="modal-field">
          <label>Voice Option</label>
          <div className="cbm-voice-options" role="radiogroup" aria-label="Voice option">
            <button
              type="button"
              role="radio"
              aria-checked={voiceOption === 'tts'}
              className={`cbm-voice-option${voiceOption === 'tts' ? ' active' : ''}`}
              onClick={() => setVoiceOption('tts')}
            >
              <span className="cbm-voice-option-icon" aria-hidden="true">🔊</span>
              <span>
                <strong>Use TTS Voice</strong>
                <small>Speaks the typed phrase using the app's voice.</small>
              </span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={voiceOption === 'recording'}
              className={`cbm-voice-option${voiceOption === 'recording' ? ' active' : ''}`}
              onClick={() => setVoiceOption('recording')}
            >
              <span className="cbm-voice-option-icon" aria-hidden="true">🎤</span>
              <span>
                <strong>Use Custom Recording</strong>
                <small>Record your own voice or upload an audio clip.</small>
              </span>
            </button>
          </div>
          {voiceOption === 'recording' && (
            <VoiceRecorder value={audio} onChange={setAudio} />
          )}
        </div>

        {/* ── Image source picker (Emoji · Symbols · Web · Upload · None) ── */}
        <div className="modal-field">
          <label>Button Image</label>
          <ImageSourcePicker value={picker} onChange={setPicker} defaultEmojiCategory="people" />
        </div>

        {/* ── Board placement (custom only — built-in symbols stay on their
              original board so the structural data stays consistent) ── */}
        {!isBuiltIn && (
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
        )}

        {/* ── Reset to Default — built-in only ── */}
        {isBuiltIn && (
          <div className="cbm-reset-row">
            <button
              type="button"
              className="cbm-reset-btn"
              onClick={handleResetToDefault}
              disabled={saving}
            >
              ↺ Reset to Default
            </button>
            <span className="cbm-field-hint">Restores the original built-in image, name, phrase, and TTS voice.</span>
          </div>
        )}

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
