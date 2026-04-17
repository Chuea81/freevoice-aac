import { useBoardStore } from '../../store/boardStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTTS } from '../../hooks/useTTS';
import { useTouchDelay } from '../../hooks/useTouchDelay';

interface QuickFireButtonProps {
  emoji: string;
  label: string;
  phrase: string;
  onActivate: () => void;
}

function QuickFireButton({ emoji, label, phrase, onActivate }: QuickFireButtonProps) {
  const delayProps = useTouchDelay(onActivate);
  return (
    <button
      className="quickfire-btn"
      {...delayProps}
      aria-label={`Speak ${phrase}`}
    >
      <span className="quickfire-emoji" aria-hidden="true">{emoji}</span>
      <span className="quickfire-label">{label}</span>
    </button>
  );
}

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
        <QuickFireButton
          key={s.id}
          emoji={s.emoji}
          label={s.label}
          phrase={s.phrase}
          onActivate={() => {
            addToken(s.emoji, s.phrase);
            if (autoSpeak) speak(s.phrase);
          }}
        />
      ))}
    </div>
  );
}
