import { useBoardStore } from '../../store/boardStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTTS } from '../../hooks/useTTS';

export function FastPhrasesStrip() {
  const quickFireSymbols = useBoardStore((s) => s.quickFireSymbols);
  const addToken = useBoardStore((s) => s.addToken);
  const autoSpeak = useSettingsStore((s) => s.autoSpeak);
  const showFastPhrases = useSettingsStore((s) => s.showFastPhrases);
  const { speak } = useTTS();

  if (!showFastPhrases || quickFireSymbols.length === 0) return null;

  return (
    <div className="quickfires-strip" role="toolbar" aria-label="Fast phrases">
      {quickFireSymbols.map((s) => (
        <button
          key={s.id}
          className="quickfire-btn"
          onClick={() => {
            addToken(s.emoji, s.phrase);
            if (autoSpeak) speak(s.phrase);
          }}
          aria-label={`Speak ${s.phrase}`}
        >
          <span className="quickfire-emoji" aria-hidden="true">{s.emoji}</span>
          <span className="quickfire-label">{s.label}</span>
        </button>
      ))}
    </div>
  );
}
