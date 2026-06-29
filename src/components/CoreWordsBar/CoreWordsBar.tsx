import { useBoardStore } from '../../store/boardStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTTS } from '../../hooks/useTTS';
import { useTouchDelay } from '../../hooks/useTouchDelay';
import { getPredictions } from '../../data/wordPredictions';

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

// Lightweight Fitzgerald-Key classifier so predicted words keep the colored
// look of the original Core Words bar. Covers the prediction vocabulary; any
// unmatched word (mostly function words like "to"/"the") renders neutral.
const PRONOUNS = new Set(['i', 'you', 'he', 'she', 'we', 'they', 'it', 'me', 'them', 'us', 'my', 'mine', 'yours']);
const SOCIAL = new Set(['help', 'please', 'thank', 'hi', 'yes', 'no', 'sorry']);
const DESCRIPTORS = new Set(['happy', 'sad', 'hungry', 'tired', 'done', 'okay', 'good', 'bad', 'mad', 'scared', 'ready', 'sick', 'fun', 'here', 'there', 'little', 'lot']);
const VERBS = new Set(['want', 'need', 'like', 'go', 'have', 'can', 'am', 'is', 'are', 'was', 'will', 'must', 'should', 'do', 'does', 'did', 'feel', 'see', 'play', 'eat', 'drink', "let's", 'make', 'try', 'read', 'watch', 'be', 'love', 'stop', 'give', 'wait', 'come', 'get', 'said', 'wants', 'has', 'needs', 'likes', 'went', 'looks', 'feels', 'works', 'tastes', 'smells', "don't", "can't"]);
const NOUNS = new Set(['food', 'water', 'juice', 'milk', 'home', 'school', 'bed', 'bathroom', 'door', 'park', 'car', 'house', 'dog', 'cat', 'ball', 'book', 'toy', 'toys', 'mom', 'dad', 'friend', 'snack', 'break', 'hug', 'turn', 'time', 'tummy', 'head', 'lunch', 'dinner', 'breakfast', 'game', 'something']);

function classifyWord(word: string): string {
  const w = word.toLowerCase().trim();
  if (PRONOUNS.has(w)) return 'pronoun';
  if (SOCIAL.has(w)) return 'social';
  if (DESCRIPTORS.has(w)) return 'descriptor';
  if (VERBS.has(w)) return 'verb';
  if (NOUNS.has(w)) return 'noun';
  return '';
}

interface CoreWordButtonProps {
  word: string;
  wordType?: string;
  onActivate: () => void;
}

function CoreWordButton({ word, wordType, onActivate }: CoreWordButtonProps) {
  const delayProps = useTouchDelay(onActivate);
  return (
    <button
      className={`coreword-btn ${getFitzClass(wordType)}`}
      {...delayProps}
      aria-label={`Add word ${word}`}
    >
      {word}
    </button>
  );
}

export function CoreWordsBar() {
  // Predictive: suggestions update based on the LAST word in the sentence,
  // exactly like a phone keyboard's predictive text bar. Empty sentence shows
  // sentence starters. This is an instant, static lookup — no network/AI.
  const outputTokens = useBoardStore((s) => s.outputTokens);
  const addToken = useBoardStore((s) => s.addToken);
  const autoSpeak = useSettingsStore((s) => s.autoSpeak);
  const showCoreWords = useSettingsStore((s) => s.showCoreWords);
  const { speak } = useTTS();

  if (!showCoreWords) return null;

  const lastWord = outputTokens.length > 0 ? outputTokens[outputTokens.length - 1].text : null;
  const suggestions = getPredictions(lastWord);

  return (
    <div className="corewords-bar" role="toolbar" aria-label="Word suggestions">
      {suggestions.map((word, i) => (
        <CoreWordButton
          key={`${word}-${i}`}
          word={word}
          wordType={classifyWord(word)}
          onActivate={() => {
            // Predicted words carry no emoji; the word itself is both the
            // sentence-bar token and the spoken text.
            addToken('', word);
            if (autoSpeak) speak(word);
          }}
        />
      ))}
    </div>
  );
}
