import { useRef, useEffect, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBoardStore } from '../../store/boardStore';
import { useTTS } from '../../hooks/useTTS';

interface Props {
  onOpenSettings?: () => void;
}

export function SpeechBar({ onOpenSettings }: Props) {
  const outputTokens = useBoardStore((s) => s.outputTokens);
  const removeLastToken = useBoardStore((s) => s.removeLastToken);
  const addToken = useBoardStore((s) => s.addToken);
  const { speak, cancel } = useTTS();
  const { t } = useTranslation();
  const outputRef = useRef<HTMLDivElement>(null);
  const speakBtnRef = useRef<HTMLButtonElement>(null);
  const [keyboardInput, setKeyboardInput] = useState('');
  const [showKeyboard, setShowKeyboard] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollLeft = outputRef.current.scrollWidth;
    }
  }, [outputTokens]);

  const speakAll = useCallback(() => {
    if (outputTokens.length === 0 && !keyboardInput.trim()) return;
    const tokenText = outputTokens.map((t) => t.text).join(' ');
    const fullText = keyboardInput.trim()
      ? (tokenText ? `${tokenText} ${keyboardInput.trim()}` : keyboardInput.trim())
      : tokenText;
    speak(fullText);
    setKeyboardInput('');

    const btn = speakBtnRef.current;
    if (btn) {
      btn.classList.remove('speaking');
      void btn.offsetWidth;
      btn.classList.add('speaking');
    }
  }, [outputTokens, speak, keyboardInput]);

  const handleClear = useCallback(() => {
    cancel();
    removeLastToken();
  }, [removeLastToken, cancel]);

  const handleKeyboardSubmit = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && keyboardInput.trim()) {
      addToken('⌨️', keyboardInput.trim());
      setKeyboardInput('');
    }
  }, [keyboardInput, addToken]);

  return (
    <div id="speech-bar" role="toolbar" aria-label="Speech output bar">
      <div
        ref={outputRef}
        id="speech-output"
        onClick={speakAll}
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

      <button ref={speakBtnRef} className="bar-btn" id="btn-speak" onClick={speakAll} aria-label="Speak sentence">
        <span className="btn-icon" aria-hidden="true">🔊</span>{t('speech.speak')}
      </button>

      <button
        className={`bar-btn${showKeyboard ? ' keyboard-active' : ''}`}
        id="btn-keyboard"
        onClick={() => {
          setShowKeyboard(!showKeyboard);
          if (!showKeyboard) setTimeout(() => inputRef.current?.focus(), 50);
        }}
        aria-label={t('speech.type')}
      >
        <span className="btn-icon" aria-hidden="true">⌨️</span>{t('speech.type')}
      </button>

      <button className="bar-btn" id="btn-clear" onClick={handleClear} aria-label={t('speech.clear')}>
        <span className="btn-icon" aria-hidden="true">⌫</span>{t('speech.clear')}
      </button>

      {onOpenSettings && (
        <button className="bar-btn" id="btn-settings" onClick={onOpenSettings} aria-label="Settings">
          <span className="btn-icon" aria-hidden="true">⚙️</span>Settings
        </button>
      )}
    </div>
  );
}
