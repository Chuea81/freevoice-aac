import { useBoardStore } from '../../store/boardStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTTS } from '../../hooks/useTTS';
import { useTouchDelay } from '../../hooks/useTouchDelay';

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

interface CoreWordButtonProps {
  label: string;
  phrase: string;
  emoji: string;
  wordType?: string;
  onActivate: () => void;
}

function CoreWordButton({ label, phrase, wordType, onActivate }: CoreWordButtonProps) {
  const delayProps = useTouchDelay(onActivate);
  return (
    <button
      className={`coreword-btn ${getFitzClass(wordType)}`}
      {...delayProps}
      aria-label={`Speak ${phrase}`}
    >
      {label}
    </button>
  );
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
        <CoreWordButton
          key={s.id}
          label={s.label}
          phrase={s.phrase}
          emoji={s.emoji}
          wordType={s.wordType}
          onActivate={() => {
            addToken(s.emoji, s.phrase);
            if (autoSpeak) speak(s.phrase);
          }}
        />
      ))}
    </div>
  );
}
