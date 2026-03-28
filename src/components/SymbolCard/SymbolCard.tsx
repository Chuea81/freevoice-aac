import { useCallback, useState, useRef, useEffect, type MouseEvent, type CSSProperties } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { useTTS } from '../../hooks/useTTS';
import { getArasaacImageUrl, resolveArasaacUrl } from '../../services/arasaac';
import type { Symbol as DbSymbol } from '../../db';

// Fitzgerald Key color mapping
const FITZGERALD_COLORS: Record<string, string> = {
  verb: '#86EFAC',
  noun: '#FDBA74',
  pronoun: '#FCD34D',
  descriptor: '#93C5FD',
  social: '#A5B4FC',
  preposition: '#CE93D8',
};

// Deterministic card accent color
const CARD_COLORS = [
  '#F59E0B', '#4FC3F7', '#81C784', '#CE93D8', '#80CBC4',
  '#F48FB1', '#FFCC80', '#AED581', '#90CAF9', '#FF8A65',
] as const;

function getCardColor(id: string): string {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return CARD_COLORS[hash % CARD_COLORS.length];
}

/** Check if imageUrl is a user-uploaded photo (not ARASAAC) */
function isUserPhoto(url?: string): boolean {
  if (!url) return false;
  return url.startsWith('data:') || url.startsWith('blob:');
}

interface Props {
  symbol: DbSymbol;
  onTap: (symbol: DbSymbol) => void;
  isParentMode?: boolean;
}

export function SymbolCard({ symbol, onTap, isParentMode }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const auditoryTouch = useSettingsStore((s) => s.auditoryTouch);
  const dwellTime = useSettingsStore((s) => s.dwellTime);
  const labelPosition = useSettingsStore((s) => s.labelPosition);
  const colorScheme = useSettingsStore((s) => s.colorScheme);
  const { speakPreview } = useTTS();

  const [previewed, setPreviewed] = useState(false);
  const dwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve image URL at render time:
  // Priority: user photo > arasaacId (direct URL) > symbolCache (keyword) > emoji fallback
  useEffect(() => {
    setImgFailed(false);

    // User-uploaded photo — use directly
    if (isUserPhoto(symbol.imageUrl)) {
      setResolvedUrl(symbol.imageUrl!);
      return;
    }

    // arasaacId — direct URL, synchronous, no async needed
    if (symbol.arasaacId) {
      setResolvedUrl(getArasaacImageUrl(symbol.arasaacId));
      return;
    }

    // No arasaacId — check symbolCache asynchronously
    if (!symbol.isCategory) {
      let cancelled = false;
      resolveArasaacUrl(symbol).then((url) => {
        if (!cancelled) setResolvedUrl(url);
      });
      return () => { cancelled = true; };
    }

    setResolvedUrl(null);
  }, [symbol.id, symbol.arasaacId, symbol.imageUrl, symbol.isCategory, symbol.label]);

  const hasImage = !!resolvedUrl && !imgFailed;

  const accentColor = colorScheme === 'fitzgerald' && symbol.wordType && FITZGERALD_COLORS[symbol.wordType]
    ? FITZGERALD_COLORS[symbol.wordType]
    : getCardColor(symbol.id);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      const btn = e.currentTarget;
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      ripple.style.cssText = `width:${size}px;height:${size}px;left:${x - size / 2}px;top:${y - size / 2}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);

      if (auditoryTouch && !symbol.isCategory) {
        if (!previewed) {
          speakPreview(symbol.label);
          setPreviewed(true);
          setTimeout(() => setPreviewed(false), 3000);
          return;
        }
        setPreviewed(false);
      }

      if (!symbol.isCategory) {
        btn.classList.add('speaking');
        setTimeout(() => btn.classList.remove('speaking'), 300);
      }

      onTap(symbol);
    },
    [symbol, onTap, auditoryTouch, previewed, speakPreview],
  );

  const handlePointerDown = useCallback(() => {
    if (dwellTime <= 0) return;
    dwellTimerRef.current = setTimeout(() => {
      onTap(symbol);
    }, dwellTime);
  }, [dwellTime, onTap, symbol]);

  const handlePointerUp = useCallback(() => {
    if (dwellTimerRef.current) {
      clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
  }, []);

  if (symbol.hidden && !isParentMode) return null;

  const labelEl = labelPosition !== 'hidden' && (
    <span className="symbol-label">{symbol.label}</span>
  );

  const cardStyle: CSSProperties = {
    '--card-color': accentColor,
  } as CSSProperties;

  return (
    <button
      className={`symbol-card${symbol.hidden ? ' symbol-hidden' : ''}${previewed ? ' symbol-previewed' : ''}`}
      style={cardStyle}
      onClick={dwellTime > 0 ? undefined : handleClick}
      onPointerDown={dwellTime > 0 ? handlePointerDown : undefined}
      onPointerUp={dwellTime > 0 ? handlePointerUp : undefined}
      onPointerLeave={dwellTime > 0 ? handlePointerUp : undefined}
      aria-label={symbol.isCategory ? `${symbol.label} category` : `Speak ${symbol.phrase}`}
      role="button"
    >
      {symbol.isCategory && (
        <span className="symbol-card-nav-indicator" aria-hidden="true">▶</span>
      )}

      {labelPosition === 'above' && labelEl}

      {hasImage ? (
        <div className="symbol-image-container">
          <img
            src={resolvedUrl!}
            alt={symbol.label}
            loading="lazy"
            decoding="async"
            onError={() => setImgFailed(true)}
          />
        </div>
      ) : (
        <span className="symbol-emoji" aria-hidden="true">{symbol.emoji}</span>
      )}

      {labelPosition !== 'above' && labelEl}
    </button>
  );
}
