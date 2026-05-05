import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { db, type Symbol as DbSymbol } from '../../db';
import { EMOJI_CATEGORIES, EMOJI_DATA, type EmojiCategory, type EmojiEntry } from '../../data/emojiPickerData';
import { searchWebImages, downloadImageAsDataUrl, fileToButtonImage, fileToSquareDataUrl, type WebImage } from '../../utils/imageSearch';

export type ImageMode = 'emoji' | 'symbols' | 'web' | 'upload' | 'none';

export interface PickerSelection {
  mode: ImageMode;
  emoji: string;
  imageUrl?: string;
}

interface Props {
  value: PickerSelection;
  onChange: (s: PickerSelection) => void;
  // What category to show first when there's no search term in Emoji mode.
  defaultEmojiCategory?: EmojiCategory;
}

const TABS: { id: ImageMode; icon: string; label: string }[] = [
  { id: 'emoji',   icon: '😀', label: 'Emoji' },
  { id: 'symbols', icon: '🔍', label: 'Symbols' },
  { id: 'web',     icon: '🌐', label: 'Web' },
  { id: 'upload',  icon: '📷', label: 'Upload' },
  { id: 'none',    icon: 'Aa', label: 'None' },
];

const WEB_DEBOUNCE_MS = 350;

export function ImageSourcePicker({ value, onChange, defaultEmojiCategory = 'people' }: Props) {
  // ── Internal UI-only state (does NOT bubble up). The parent only sees
  //    {mode, emoji, imageUrl} via onChange.
  const [emojiCategory, setEmojiCategory] = useState<EmojiCategory>(defaultEmojiCategory);
  const [emojiQuery, setEmojiQuery] = useState('');

  const [symbolQuery, setSymbolQuery] = useState('');
  const [symbolCandidates, setSymbolCandidates] = useState<DbSymbol[]>([]);

  const [webQuery, setWebQuery] = useState('');
  const [webResults, setWebResults] = useState<WebImage[]>([]);
  const [webStatus, setWebStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [webError, setWebError] = useState<string | null>(null);
  const [webDownloadingId, setWebDownloadingId] = useState<string | null>(null);

  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Online/offline listeners — controls whether the Web tab is usable.
  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Symbols tab — query default-* symbols from Dexie. Same logic as Phase 1
  // had inline; lifted here so both modals share one path.
  useEffect(() => {
    if (value.mode !== 'symbols') return;
    const q = symbolQuery.trim().toLowerCase();
    let cancelled = false;
    (async () => {
      const all = await db.symbols.toArray();
      if (cancelled) return;
      const matches = all
        .filter((s) => !s.isCategory && s.id.startsWith('default-'))
        .filter((s) => (q ? s.label.toLowerCase().includes(q) : true))
        .slice(0, 80);
      setSymbolCandidates(matches);
    })();
    return () => { cancelled = true; };
  }, [value.mode, symbolQuery]);

  // Web tab — debounced search via Wikimedia Commons.
  useEffect(() => {
    if (value.mode !== 'web' || !online) return;
    const q = webQuery.trim();
    if (!q) {
      setWebResults([]);
      setWebStatus('idle');
      setWebError(null);
      return;
    }
    const ctl = new AbortController();
    const timer = window.setTimeout(async () => {
      setWebStatus('loading');
      setWebError(null);
      try {
        const results = await searchWebImages(q, ctl.signal);
        setWebResults(results);
        setWebStatus('idle');
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setWebStatus('error');
        setWebError(err instanceof Error ? err.message : 'Search failed');
      }
    }, WEB_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      ctl.abort();
    };
  }, [value.mode, webQuery, online]);

  const visibleEmojis = useMemo(() => {
    const q = emojiQuery.trim().toLowerCase();
    if (q) {
      const all = (Object.values(EMOJI_DATA) as EmojiEntry[][]).flat();
      return all.filter((e) => e.keywords.includes(q));
    }
    return EMOJI_DATA[emojiCategory];
  }, [emojiQuery, emojiCategory]);

  // Mode switching — keep the existing image/emoji where possible so the
  // user can re-tab without losing their selection.
  const switchMode = useCallback((nextMode: ImageMode) => {
    if (nextMode === value.mode) return;
    if (nextMode === 'emoji') {
      onChange({ mode: 'emoji', emoji: value.emoji || '⭐' });
    } else if (nextMode === 'none') {
      onChange({ mode: 'none', emoji: '' });
    } else if (nextMode === 'symbols' || nextMode === 'web' || nextMode === 'upload') {
      // Preserve existing imageUrl so users can flip between image-source tabs
      // without re-picking. Switching to a different image-mode resets only
      // when there's no existing image-url to keep.
      onChange({ mode: nextMode, emoji: value.emoji, imageUrl: value.imageUrl });
    }
  }, [value, onChange]);

  // Picking handlers — each tab knows how to commit a selection.
  const pickEmoji = useCallback((char: string) => {
    onChange({ mode: 'emoji', emoji: char });
  }, [onChange]);

  const pickSymbol = useCallback((s: DbSymbol) => {
    onChange({ mode: 'symbols', emoji: s.emoji, imageUrl: s.imageUrl });
  }, [onChange]);

  const pickWebResult = useCallback(async (img: WebImage) => {
    setWebDownloadingId(img.id);
    setWebError(null);
    try {
      const dataUrl = await downloadImageAsDataUrl(img.fullUrl, 512);
      onChange({ mode: 'web', emoji: '', imageUrl: dataUrl });
    } catch (err) {
      setWebStatus('error');
      setWebError(err instanceof Error ? err.message : 'Could not download image');
    } finally {
      setWebDownloadingId(null);
    }
  }, [onChange]);

  const handleFileChosen = useCallback(async (file: File | null, square: boolean) => {
    if (!file) return;
    setUploadStatus('processing');
    setUploadError(null);
    try {
      const dataUrl = square
        ? await fileToSquareDataUrl(file, 512)
        : await fileToButtonImage(file, 512);
      onChange({ mode: 'upload', emoji: '', imageUrl: dataUrl });
      setUploadStatus('idle');
    } catch (err) {
      setUploadStatus('error');
      setUploadError(err instanceof Error ? err.message : 'Could not load image');
    }
  }, [onChange]);

  return (
    <div className="image-picker">
      <div className="cbm-mode-tabs" role="tablist" aria-label="Image source">
        {TABS.map((t) => {
          const disabled = t.id === 'web' && !online;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={value.mode === t.id}
              className={`cbm-mode-tab${value.mode === t.id ? ' active' : ''}`}
              onClick={() => switchMode(t.id)}
              disabled={disabled}
              title={disabled ? 'Web search requires an internet connection' : t.label}
            >
              <span aria-hidden="true">{t.icon}</span>
              <span className="cbm-mode-tab-label">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Emoji tab ── */}
      {value.mode === 'emoji' && (
        <div className="cbm-image-panel">
          <input
            type="search"
            placeholder="Search emojis (e.g. happy, dog, food)"
            className="cbm-search-input"
            value={emojiQuery}
            onChange={(e) => setEmojiQuery(e.target.value)}
          />
          {!emojiQuery.trim() && (
            <div className="cbm-emoji-cats" role="tablist" aria-label="Emoji category">
              {EMOJI_CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={emojiCategory === c.id}
                  aria-label={c.label}
                  title={c.label}
                  className={`cbm-emoji-cat${emojiCategory === c.id ? ' active' : ''}`}
                  onClick={() => setEmojiCategory(c.id)}
                >
                  {c.icon}
                </button>
              ))}
            </div>
          )}
          <div className="cbm-emoji-grid">
            {visibleEmojis.length === 0 ? (
              <div className="cbm-empty">No emojis match "{emojiQuery}".</div>
            ) : (
              visibleEmojis.map((e, i) => (
                <button
                  key={`${e.char}-${i}`}
                  type="button"
                  className={`cbm-emoji-cell${e.char === value.emoji ? ' selected' : ''}`}
                  onClick={() => pickEmoji(e.char)}
                  aria-label={e.keywords.split(' ')[0]}
                  title={e.keywords}
                >
                  {e.char}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Symbols tab ── */}
      {value.mode === 'symbols' && (
        <div className="cbm-image-panel">
          <input
            type="search"
            placeholder="Search existing buttons (e.g. happy, water, school)"
            className="cbm-search-input"
            value={symbolQuery}
            onChange={(e) => setSymbolQuery(e.target.value)}
          />
          <div className="cbm-image-grid">
            {symbolCandidates.length === 0 ? (
              <div className="cbm-empty">
                {symbolQuery ? `No matches for "${symbolQuery}".` : 'Type to search the existing button library.'}
              </div>
            ) : (
              symbolCandidates.map((s) => {
                const selected = value.imageUrl === s.imageUrl && value.emoji === s.emoji;
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`cbm-image-cell${selected ? ' selected' : ''}`}
                    onClick={() => pickSymbol(s)}
                    title={s.label}
                  >
                    {s.imageUrl ? (
                      <img src={s.imageUrl} alt={s.label} />
                    ) : (
                      <span className="cbm-image-cell-emoji">{s.emoji}</span>
                    )}
                    <span className="cbm-image-cell-label">{s.label}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ── Web tab ── */}
      {value.mode === 'web' && (
        <div className="cbm-image-panel">
          {!online ? (
            <div className="cbm-empty cbm-offline-notice">
              📡 Web search requires an internet connection.
            </div>
          ) : (
            <>
              <input
                type="search"
                placeholder="Search the web (e.g. ceiling fan, school bus)"
                className="cbm-search-input"
                value={webQuery}
                onChange={(e) => setWebQuery(e.target.value)}
              />
              <div className="cbm-image-grid">
                {webStatus === 'loading' ? (
                  <div className="cbm-empty">Searching the web…</div>
                ) : webStatus === 'error' ? (
                  <div className="cbm-empty cbm-error">{webError || 'Search failed.'}</div>
                ) : webResults.length === 0 ? (
                  <div className="cbm-empty">
                    {webQuery.trim() ? `No images found for "${webQuery}".` : 'Type to search Wikimedia Commons.'}
                  </div>
                ) : (
                  webResults.map((img) => {
                    const selected = value.imageUrl !== undefined && value.mode === 'web' && webDownloadingId !== img.id;
                    const downloading = webDownloadingId === img.id;
                    return (
                      <button
                        key={img.id}
                        type="button"
                        className={`cbm-image-cell${selected && img.fullUrl ? '' : ''}${downloading ? ' downloading' : ''}`}
                        onClick={() => pickWebResult(img)}
                        title={img.title}
                        disabled={!!webDownloadingId}
                      >
                        <img src={img.thumbUrl} alt={img.title} loading="lazy" />
                        <span className="cbm-image-cell-label">{img.title}</span>
                        {downloading && <span className="cbm-cell-downloading" aria-hidden="true">…</span>}
                      </button>
                    );
                  })
                )}
              </div>
              <p className="cbm-web-note">
                Images from the web may be subject to copyright. Saved images are stored on this device only.
              </p>
            </>
          )}
        </div>
      )}

      {/* ── Upload tab ── */}
      {value.mode === 'upload' && (
        <div className="cbm-image-panel cbm-upload-panel">
          <div className="cbm-upload-actions">
            <button
              type="button"
              className="cbm-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadStatus === 'processing'}
            >
              📁 Choose from Device
            </button>
            <button
              type="button"
              className="cbm-upload-btn"
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploadStatus === 'processing'}
            >
              📷 Take Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/*"
              hidden
              onChange={(e) => handleFileChosen(e.target.files?.[0] ?? null, true)}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => handleFileChosen(e.target.files?.[0] ?? null, true)}
            />
          </div>

          {uploadStatus === 'processing' && (
            <div className="cbm-empty">Processing image…</div>
          )}
          {uploadStatus === 'error' && uploadError && (
            <div className="cbm-empty cbm-error">{uploadError}</div>
          )}
          {value.imageUrl && uploadStatus !== 'processing' && (
            <div className="cbm-upload-preview">
              <img src={value.imageUrl} alt="Uploaded preview" />
              <p className="cbm-field-hint">
                Cropped to a square and resized for storage. Tap "Choose from Device" or "Take Photo" again to replace.
              </p>
            </div>
          )}
          {!value.imageUrl && uploadStatus === 'idle' && (
            <p className="cbm-field-hint">
              PNG, JPG, GIF, or WEBP up to ~10 MB. Larger images are automatically compressed.
            </p>
          )}
        </div>
      )}

      {/* ── No image tab ── */}
      {value.mode === 'none' && (
        <div className="cbm-image-panel cbm-image-panel-none">
          <p>Text-only — the button will show its name with no image or emoji.</p>
        </div>
      )}
    </div>
  );
}
