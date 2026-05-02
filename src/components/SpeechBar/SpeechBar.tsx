import { useRef, useEffect, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBoardStore } from '../../store/boardStore';
import { useTTS } from '../../hooks/useTTS';
import { HIGHLIGHT_COLORS, useHighlightStore } from '../../store/highlightStore';
import { useFirstThenStore } from '../../store/firstThenStore';
import { useCharacterStore } from '../../store/characterStore';
import { useUserProfileStore } from '../../store/userProfileStore';
import { useTouchDelay } from '../../hooks/useTouchDelay';
import { FirstThenPanel } from '../FirstThenPanel/FirstThenPanel';
import { Avatar } from '../Avatar/Avatar';

interface Props {
  onOpenSettings?: () => void;
  onOpenSearch?: () => void;
  onOpenProfile?: () => void;
}

export function SpeechBar({ onOpenSettings, onOpenSearch, onOpenProfile }: Props) {
  const outputTokens = useBoardStore((s) => s.outputTokens);
  const removeLastToken = useBoardStore((s) => s.removeLastToken);
  const clearTokens = useBoardStore((s) => s.clearTokens);
  const addToken = useBoardStore((s) => s.addToken);
  const { speak, cancel } = useTTS();
  const highlightMode = useHighlightStore((s) => s.mode);
  const highlightSelectedColor = useHighlightStore((s) => s.selectedColor);
  const toggleHighlightMode = useHighlightStore((s) => s.toggleMode);
  const setHighlightColor = useHighlightStore((s) => s.setSelectedColor);
  const firstThenMode = useFirstThenStore((s) => s.mode);
  const firstSlot = useFirstThenStore((s) => s.firstSlot);
  const thenSlot = useFirstThenStore((s) => s.thenSlot);
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);
  const selectedCharacter = useCharacterStore((s) =>
    s.characters.find((c) => c.id === s.selectedCharacterId) ?? null
  );
  const preferredName = useUserProfileStore((s) => s.profile.preferredName.trim());
  const toggleFirstThen = useFirstThenStore((s) => s.toggleMode);
  const clearFirstThenBoth = useFirstThenStore((s) => s.clearBoth);
  const clearFirstThenActive = useFirstThenStore((s) => s.clearActive);
  const { t } = useTranslation();
  const outputRef = useRef<HTMLDivElement>(null);
  const speakBtnRef = useRef<HTMLButtonElement>(null);
  const [keyboardInput, setKeyboardInput] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollLeft = outputRef.current.scrollWidth;
    }
  }, [outputTokens]);

  const speakAll = useCallback(async () => {
    // If already speaking, stop instead
    if (isSpeaking) {
      cancel();
      setIsSpeaking(false);
      return;
    }

    // First/Then mode — compose "First X, then Y"
    let fullText = '';
    if (firstThenMode) {
      const parts: string[] = [];
      if (firstSlot) parts.push(`First ${firstSlot.phrase}`);
      if (thenSlot) parts.push(`then ${thenSlot.phrase}`);
      if (parts.length === 0) return;
      fullText = parts.join(', ');
    } else {
      if (outputTokens.length === 0 && !keyboardInput.trim()) return;
      const tokenText = outputTokens.map((t) => t.text).join(' ');
      fullText = keyboardInput.trim()
        ? (tokenText ? `${tokenText} ${keyboardInput.trim()}` : keyboardInput.trim())
        : tokenText;
    }

    setIsSpeaking(true);
    const btn = speakBtnRef.current;
    if (btn) {
      btn.classList.add('speaking');
    }

    try {
      await speak(fullText);
    } finally {
      setIsSpeaking(false);
      if (btn) {
        btn.classList.remove('speaking');
      }
    }

    // Do NOT clear the bar after speaking — user can speak again or clear manually
  }, [outputTokens, speak, keyboardInput, cancel, isSpeaking, firstThenMode, firstSlot, thenSlot]);

  const handleBackspace = useCallback(() => {
    // First/Then mode — delete clears the currently active slot
    if (firstThenMode) {
      clearFirstThenActive();
      return;
    }
    // Remove one word at a time (one token)
    if (keyboardInput.trim()) {
      // If there's keyboard input, remove the last word from it
      const words = keyboardInput.trim().split(' ');
      words.pop();
      setKeyboardInput(words.join(' '));
    } else if (outputTokens.length > 0) {
      // Otherwise remove the last token
      removeLastToken();
    }
  }, [keyboardInput, outputTokens, removeLastToken, firstThenMode, clearFirstThenActive]);

  const handleKeyboardSubmit = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && keyboardInput.trim()) {
      addToken('⌨️', keyboardInput.trim());
      setKeyboardInput('');
    }
  }, [keyboardInput, addToken]);

  const handleClearAll = useCallback(() => {
    if (firstThenMode) {
      clearFirstThenBoth();
      return;
    }
    clearTokens();
    setKeyboardInput('');
  }, [clearTokens, firstThenMode, clearFirstThenBoth]);

  const handleToggleKeyboard = useCallback(() => {
    setShowKeyboard((prev) => {
      const next = !prev;
      if (next) setTimeout(() => inputRef.current?.focus(), 50);
      return next;
    });
  }, []);

  const speakProps = useTouchDelay(speakAll);
  const keyboardProps = useTouchDelay(handleToggleKeyboard);
  const deleteProps = useTouchDelay(handleBackspace);
  const clearProps = useTouchDelay(handleClearAll);
  const highlightProps = useTouchDelay(toggleHighlightMode);
  const settingsProps = useTouchDelay(onOpenSettings);
  const speechOutputProps = useTouchDelay(speakAll);
  const searchProps = useTouchDelay(onOpenSearch);

  return (
    <div id="speech-bar" role="toolbar" aria-label="Speech output bar">
      <div className="speech-bar-row">
        {selectedCharacterId && (
          <button
            type="button"
            className="speech-bar-identity"
            onClick={onOpenProfile}
            aria-label={preferredName ? `Open profile for ${preferredName}` : 'Open profile'}
            disabled={!onOpenProfile}
          >
            <span className="speech-bar-avatar" aria-hidden="true">
              <Avatar
                characterId={selectedCharacterId}
                size={40}
                aria-label={selectedCharacter?.name ?? 'Your avatar'}
              />
            </span>
            {preferredName && (
              <span className="speech-bar-name">{preferredName}</span>
            )}
          </button>
        )}
      <div className={`speech-output-wrap${firstThenMode ? ' firstthen-mode' : ''}`}>
        {firstThenMode && (
          <button
            type="button"
            className="firstthen-indicator"
            onClick={toggleFirstThen}
            aria-label="First, Then mode active — tap to exit"
            title="First, Then mode is on (tap to exit)"
          >
            <span className="firstthen-indicator-dot" aria-hidden="true"></span>
            First, Then Mode
            <span className="firstthen-indicator-close" aria-hidden="true">✕</span>
          </button>
        )}
        {firstThenMode ? (
          <FirstThenPanel />
        ) : (
          <div
            ref={outputRef}
            id="speech-output"
            {...speechOutputProps}
            role="status"
            aria-live="polite"
            aria-label={outputTokens.length > 0 ? `Message: ${outputTokens.map(t => t.text).join(' ')}` : 'Empty message. Tap symbols to speak.'}
          >
            {outputTokens.length === 0 && !showKeyboard ? (
              <span className="speech-placeholder">
                {t('speech.placeholder')}
              </span>
            ) : (
              outputTokens.map((token, i) => (
                <div key={i} className="speech-token">
                  <span className="token-emoji">{token.emoji}</span>
                  {token.text}
                </div>
              ))
            )}
            {showKeyboard && (
              <input
                ref={inputRef}
                className="speech-keyboard-input"
                type="text"
                value={keyboardInput}
                onChange={(e) => setKeyboardInput(e.target.value)}
                onKeyDown={handleKeyboardSubmit}
                placeholder="Type..."
                aria-label="Type words to add to message"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        )}
        {onOpenSearch && (
          <button
            className="search-trigger-btn"
            {...searchProps}
            aria-label="Search symbols"
          >
            🔍
          </button>
        )}
      </div>
      </div>

      <div className="speech-bar-buttons">
        <button
          ref={speakBtnRef}
          className="bar-btn"
          id="btn-speak"
          {...speakProps}
          aria-label={isSpeaking ? 'Stop speaking' : 'Speak sentence'}
          title={isSpeaking ? 'Stop (tap)' : 'Speak (tap)'}
        >
          <span className="btn-icon" aria-hidden="true">{isSpeaking ? '⏹️' : '🔊'}</span>
          {isSpeaking ? 'STOP' : t('speech.speak')}
        </button>

        <button
          className={`bar-btn${showKeyboard ? ' keyboard-active' : ''}`}
          id="btn-keyboard"
          {...keyboardProps}
          aria-label={t('speech.type')}
        >
          <span className="btn-icon" aria-hidden="true">⌨️</span>{t('speech.type')}
        </button>

        <button
          className="bar-btn"
          id="btn-delete"
          {...deleteProps}
          aria-label="Delete last word"
          title="Delete last word (one word at a time)"
        >
          <span className="btn-icon" aria-hidden="true">⌫</span>Delete
        </button>

        <button
          className="bar-btn"
          id="btn-clear"
          {...clearProps}
          aria-label="Clear entire message"
          title="Clear all words in the speech box"
        >
          <span className="btn-icon" aria-hidden="true">🧹</span>Clear
        </button>

        <div className="highlight-btn-wrap">
          <button
            className={`bar-btn${highlightMode ? ' highlight-active' : ''}`}
            id="btn-highlight"
            {...highlightProps}
            style={highlightMode ? { background: highlightSelectedColor } : undefined}
            aria-label={highlightMode ? 'Exit highlight mode' : 'Enter highlight mode'}
            aria-pressed={highlightMode}
            title="Highlight buttons with a color"
          >
            <span className="btn-icon" aria-hidden="true">🎨</span>Highlight
          </button>
          {highlightMode && (
            <div
              className="highlight-palette-popover"
              role="toolbar"
              aria-label="Highlight color picker"
            >
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`palette-swatch${highlightSelectedColor === c.value ? ' selected' : ''}`}
                  style={{ background: c.value }}
                  onClick={() => setHighlightColor(c.value)}
                  aria-label={`${c.name} highlight`}
                  aria-pressed={highlightSelectedColor === c.value}
                />
              ))}
            </div>
          )}
        </div>

        {onOpenSettings && (
          <button className="bar-btn" id="btn-settings" {...settingsProps} aria-label="Settings">
            <span className="btn-icon" aria-hidden="true">⚙️</span>Settings
          </button>
        )}
      </div>
    </div>
  );
}
