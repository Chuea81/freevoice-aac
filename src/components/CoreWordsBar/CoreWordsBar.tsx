import { useBoardStore } from '../../store/boardStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTTS } from '../../hooks/useTTS';

// Map wordType to Fitzgerald Key CSS class
function getFitzClass(wordType?: string): string {
  switch (wordType) {
    case 'pronoun': return 'cw-pronoun';
    case 'verb':    return 'cw-verb';
    case 'descriptor': return 'cw-descriptor';
    case 'noun':    return 'cw-noun';
    case 'social':  return 'cw-social';
    default:        return '';
  }
}

export function CoreWordsBar() {
  const coreWordSymbols = useBoardStore((s) => s.coreWordSymbols);
  const addToken = useBoardStore((s) => s.addToken);
  const autoSpeak = useSettingsStore((s) => s.autoSpeak);
  const showCoreWords = useSettingsStore((s) => s.showCoreWords);
  const { speak } = useTTS();

  if (!showCoreWords || coreWordSymbols.length === 0) return null;

  return (
    <div className="corewords-bar" role="toolbar" aria-label="Core words">
      {coreWordSymbols.map((s) => (
        <button
          key={s.id}
          className={`coreword-btn ${getFitzClass(s.wordType)}`}
          onClick={() => {
            addToken(s.emoji, s.phrase);
            if (autoSpeak) speak(s.phrase);
          }}
          aria-label={`Speak ${s.phrase}`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
