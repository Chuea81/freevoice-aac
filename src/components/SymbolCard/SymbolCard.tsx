import { useCallback, useState, useRef, useEffect, type CSSProperties } from 'react';
import { useSettingsStore } from '../../store/settingsStore';
import { useTTS } from '../../hooks/useTTS';
import { getArasaacImageUrl, resolveArasaacUrl } from '../../services/arasaac';
import { ARASAAC_IDS, CUSTOM_SYMBOL_IMAGES } from '../../data/arasaacIds';
import { useCharacterImage } from '../../hooks/useCharacterImage';
import type { SymbolCategory } from '../../types/character';
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

/** Map boardId to character system SymbolCategory */
function boardToCategory(boardId: string): SymbolCategory | null {
  if (boardId === 'feelings') return 'emotions';
  return null;
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
  const pointerStartRef = useRef<{x: number, y: number} | null>(null);

  // Check for custom character image (emotions only for now)
  const category = boardToCategory(symbol.boardId);
  const characterImageUrl = useCharacterImage(symbol.label, category || 'emotions');
  const hasCharacterImage = category !== null && !!characterImageUrl;
  const isCustomSymbol = ARASAAC_IDS[symbol.label?.toUpperCase() || ''] === -1;

  // DEBUG
  if (symbol.label === 'bottom') {
    console.log('[SymbolCard] bottom symbol', {
      label: symbol.label,
      upperLabel: symbol.label?.toUpperCase(),
      arasaacId: symbol.arasaacId,
      staticId: ARASAAC_IDS[symbol.label?.toUpperCase() || ''],
      isCustomSymbol,
      customImagePath: CUSTOM_SYMBOL_IMAGES[symbol.label?.toUpperCase() || ''],
    });
  }

  // Resolve image URL at render time.
  // Priority: character image > user photo > ARASAAC static ID > Dexie > cache > emoji
  useEffect(() => {
    setImgFailed(false);

    // 0. Custom character image — highest priority
    if (hasCharacterImage && characterImageUrl) {
      setResolvedUrl(characterImageUrl);
      return;
    }

    const upperLabel = symbol.label?.toUpperCase() || '';
    const staticId = ARASAAC_IDS[upperLabel];

    // 1. Static lookup says "force emoji" (ID=0) — skip all ARASAAC
    if (staticId === 0) {
      setResolvedUrl(null);
      return;
    }

    // 1b. Custom symbol image (ID=-1) — use custom path
    if (staticId === -1) {
      const customUrl = CUSTOM_SYMBOL_IMAGES[upperLabel];
      if (customUrl) {
        setResolvedUrl(customUrl);
        return;
      }
    }

    // 2. User-uploaded photo
    if (isUserPhoto(symbol.imageUrl)) {
      setResolvedUrl(symbol.imageUrl!);
      return;
    }

    // 3. Static ARASAAC ID
    if (staticId && staticId > 0) {
      setResolvedUrl(getArasaacImageUrl(staticId));
      return;
    }

    // 4. Dexie arasaacId
    if (symbol.arasaacId) {
      setResolvedUrl(getArasaacImageUrl(symbol.arasaacId));
      return;
    }

    // 5. symbolCache async lookup
    if (!symbol.isCategory) {
      let cancelled = false;
      resolveArasaacUrl(symbol).then((url) => {
        if (!cancelled) setResolvedUrl(url);
      });
      return () => { cancelled = true; };
    }

    setResolvedUrl(null);
  }, [symbol.id, symbol.arasaacId, symbol.imageUrl, symbol.isCategory, symbol.label, hasCharacterImage, characterImageUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const hasImage = !!resolvedUrl && !imgFailed;

  const accentColor = colorScheme === 'fitzgerald' && symbol.wordType && FITZGERALD_COLORS[symbol.wordType]
    ? FITZGERALD_COLORS[symbol.wordType]
    : getCardColor(symbol.id);

  // Track pointer start position for scroll detection
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      pointerStartRef.current = { x: e.clientX, y: e.clientY };

      // If dwell time is enabled, just start the timer
      if (dwellTime > 0) {
        dwellTimerRef.current = setTimeout(() => {
          onTap(symbol);
        }, dwellTime);
        return;
      }

      // Show instant feedback (ripple + auditory preview) but delay the tap
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
    },
    [symbol, auditoryTouch, previewed, speakPreview, dwellTime],
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (dwellTimerRef.current) {
      clearTimeout(dwellTimerRef.current);
      dwellTimerRef.current = null;
      return; // Dwell mode — tap already fired or cancelled
    }

    // Check if pointer moved more than 10px (scroll guard)
    const start = pointerStartRef.current;
    if (start) {
      const dx = Math.abs(e.clientX - start.x);
      const dy = Math.abs(e.clientY - start.y);
      if (dx > 10 || dy > 10) {
        return; // Treat as scroll — don't fire the tap
      }
    }

    // True tap — fire the action
    onTap(symbol);
  }, [symbol, onTap]);

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
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      aria-label={symbol.isCategory ? `${symbol.label} category` : `Speak ${symbol.phrase}`}
      role="button"
    >
      {symbol.isCategory && (
        <span className="symbol-card-nav-indicator" aria-hidden="true">▶</span>
      )}

      {labelPosition === 'above' && labelEl}

      {hasImage && isCustomSymbol ? (
        /* Custom symbol images — full bleed on dark card background */
        <img
          className="symbol-custom-img"
          src={resolvedUrl!}
          alt={symbol.label}
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
        />
      ) : hasImage && hasCharacterImage ? (
        /* Character sprite images — constrained with clip-path */
        <img
          className="symbol-character-img"
          src={resolvedUrl!}
          alt={symbol.label}
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
        />
      ) : hasImage ? (
        /* ARASAAC images — white symbol-window container */
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
