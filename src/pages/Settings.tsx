import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore, type LabelPosition, type ColorScheme, type SkinTone } from '../store/settingsStore';
import { useParentStore } from '../store/parentStore';
import { useBoardStore } from '../store/boardStore';
import { useFirstThenStore } from '../store/firstThenStore';
import { useCharacterStore } from '../store/characterStore';
import { VoiceSelector } from '../components/VoiceSelector/VoiceSelector';
import { CharacterPicker } from '../components/CharacterPicker/CharacterPicker';
import { Avatar } from '../components/Avatar/Avatar';
import { db } from '../db';
import { exportProfile, importProfile, mergeImport, shareBoardAsUrl } from '../utils/backup';
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, LANGUAGE_FLAGS, SPRINT_2_LANGUAGES } from '../i18n/index';
import { TOUCH_DELAY_STEPS, formatTouchDelay } from '../hooks/useTouchDelay';

const SKIN_TONES: { value: SkinTone; label: string; swatch: string }[] = [
  { value: 'default', label: 'Default', swatch: '👋' },
  { value: 'light', label: 'Light', swatch: '👋🏻' },
  { value: 'medium-light', label: 'Med-Light', swatch: '👋🏼' },
  { value: 'medium', label: 'Medium', swatch: '👋🏽' },
  { value: 'medium-dark', label: 'Med-Dark', swatch: '👋🏾' },
  { value: 'dark', label: 'Dark', swatch: '👋🏿' },
];

export function Settings({ onBack }: { onBack: () => void }) {
  const { t, i18n } = useTranslation();
  const settings = useSettingsStore();
  const parentStore = useParentStore();
  const boardStore = useBoardStore();
  const firstThenMode = useFirstThenStore((s) => s.mode);
  const setFirstThenMode = useFirstThenStore((s) => s.setMode);
  const selectedCharacterId = useCharacterStore((s) => s.selectedCharacterId);
  const characters = useCharacterStore((s) => s.characters);
  const setSelectedCharacter = useCharacterStore((s) => s.setSelectedCharacter);
  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId) ?? null;
  const [showCharacterPicker, setShowCharacterPicker] = useState(false);

  // Re-read PIN state whenever Settings mounts so the PIN Lock toggle always
  // reflects what's actually stored (e.g. after a factory reset or an import).
  useEffect(() => {
    parentStore.checkPinSet();
  }, [parentStore]);

  // PIN Lock toggle: OFF → ON opens the 'set' flow (create + confirm); ON →
  // OFF opens the 'remove' flow which requires the current PIN before
  // clearing. The toggle is only considered "ON" when a PIN has been saved
  // AND enabled, so the UI reflects the real gate state.
  const handleTogglePinLock = useCallback(() => {
    if (parentStore.pinEnabled) {
      parentStore.openPinModal('remove');
    } else {
      parentStore.openPinModal('set');
    }
  }, [parentStore]);

  // Pronunciation editor state
  const [pronWord, setPronWord] = useState('');
  const [pronPhonetic, setPronPhonetic] = useState('');

  // Create board state
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardEmoji, setNewBoardEmoji] = useState('📁');

  const handleExport = useCallback(async () => {
    await exportProfile();
  }, []);

  const handleImportReplace = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (!confirm('This will replace ALL your boards and settings.\nYour current data will be backed up first.\n\nContinue?')) return;
      const result = await importProfile(file);
      if (result.success) {
        useSettingsStore.getState().loadFromDb();
        alert('Import successful! A backup of your previous data was saved.');
        window.location.reload();
      } else {
        alert(result.error || 'Import failed.');
      }
    };
    input.click();
  }, []);

  const handleImportMerge = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const result = await mergeImport(file);
      if (result.success) {
        alert(`Merged ${result.count} symbols into your boards.`);
        window.location.reload();
      } else {
        alert(result.error || 'Merge failed.');
      }
    };
    input.click();
  }, []);

  const handleShareBoard = useCallback(async () => {
    const url = await shareBoardAsUrl(boardStore.currentBoardId);
    if (!url) { alert('Could not share this board.'); return; }
    if (navigator.share) {
      navigator.share({ title: 'FreeVoice Board', url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      alert('Board share link copied to clipboard!');
    }
  }, [boardStore]);

  const handleCreateBoard = useCallback(async () => {
    if (!newBoardName.trim()) return;
    await boardStore.createBoard(newBoardName.trim(), newBoardEmoji, null);
    setNewBoardName('');
    alert(`Board "${newBoardName.trim()}" created!`);
  }, [newBoardName, newBoardEmoji, boardStore]);

  const handleSortCurrentBoard = useCallback(async () => {
    await boardStore.sortBoardAlphabetically(boardStore.currentBoardId);
    alert('Board sorted alphabetically!');
  }, [boardStore]);

  const handleAddPronunciation = useCallback(async () => {
    if (!pronWord.trim() || !pronPhonetic.trim()) return;
    await boardStore.setPronunciation(pronWord.trim(), pronPhonetic.trim());
    setPronWord('');
    setPronPhonetic('');
  }, [pronWord, pronPhonetic, boardStore]);

  const handleFactoryReset = useCallback(async () => {
    if (!confirm('⚠️ Factory Reset will:\n\n• Delete ALL custom boards and symbols\n• Delete ALL settings and preferences\n• Clear all caches\n• Delete the AI voice model\n\nYou will start with a fresh app.\n\nThis CANNOT be undone. Continue?')) {
      return;
    }
    if (!confirm('Are you absolutely sure? This will delete everything.')) {
      return;
    }
    try {
      // Clear all databases
      await db.boards.clear();
      await db.symbols.clear();
      await db.settings.clear();
      await db.symbolCache.clear();

      // Reset all stores to defaults
      useSettingsStore.setState({
        gridColumns: 0,
        symbolSize: 'medium',
        cardStyle: 'colors',
        autoSpeak: true,
        labelPosition: 'below',
        colorScheme: 'default',
        skinTone: 'default',
        auditoryTouch: false,
        dwellTime: 0,
        touchDelay: 0,
        showFastPhrases: true,
        showCoreWords: true,
        onboardingDone: false,
        androidInstallDismissed: false,
      });

      // Delete AI voice model
      try {
        const cacheNames = await caches.keys();
        const tfCacheName = cacheNames.find(n => n.includes('transformers'));
        if (tfCacheName) {
          const cache = await caches.open(tfCacheName);
          const keys = await cache.keys();
          const kokoroKeys = keys.filter(req => req.url.includes('Kokoro'));
          for (const req of kokoroKeys) {
            await cache.delete(req);
          }
        }
      } catch {
        // Non-fatal if cache deletion fails
      }

      // Clear IndexedDB model cache
      try {
        const idbNames = await indexedDB.databases?.() || [];
        for (const idbDb of idbNames) {
          if (!idbDb.name) continue;
          const req = indexedDB.deleteDatabase(idbDb.name);
          await new Promise((resolve, reject) => {
            req.onsuccess = () => resolve(null);
            req.onerror = () => reject(req.error);
          });
        }
      } catch {
        // Non-fatal if IDB deletion fails
      }

      // Clear localStorage except language preference
      const savedLanguage = localStorage.getItem('fv_language');
      localStorage.clear();
      if (savedLanguage) {
        localStorage.setItem('fv_language', savedLanguage);
      }

      // Reload the app (default data will load from symbols.json)
      window.location.reload();
    } catch (err) {
      console.error('Factory reset error:', err);
      alert('An error occurred during factory reset. Please try again.');
    }
  }, []);

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="settings-back-btn" onClick={onBack}>← Back</button>
        <h1 className="settings-title">Settings</h1>
        {parentStore.pinEnabled ? (
          <button className="settings-lock-btn" onClick={() => parentStore.lock()}>🔒 Lock</button>
        ) : (
          <div />
        )}
      </div>

      <div className="settings-scroll">

        {/* ── VOICE (3-tier system) ── */}
        <VoiceSelector />

        {/* ── YOUR CHARACTER ── */}
        <section className="settings-section">
          <h2 className="settings-section-title">Your Character</h2>
          <div className="settings-avatar-display">
            {selectedCharacterId ? (
              <>
                <div className="settings-avatar-frame">
                  <Avatar
                    characterId={selectedCharacterId}
                    size={80}
                    aria-label={selectedCharacter?.name ?? 'Selected avatar'}
                  />
                </div>
                <div className="settings-avatar-name">{selectedCharacter?.name ?? 'Custom'}</div>
              </>
            ) : (
              <p className="settings-hint" style={{ margin: 0 }}>Using standard emoji symbols</p>
            )}
            <button
              type="button"
              className="settings-avatar-change-btn"
              onClick={() => setShowCharacterPicker((v) => !v)}
              aria-expanded={showCharacterPicker}
            >
              {showCharacterPicker ? 'Done' : 'Change Avatar'}
            </button>
          </div>
          {showCharacterPicker && (
            <div className="settings-avatar-picker">
              <CharacterPicker
                onSelect={(id) => {
                  setSelectedCharacter(id === 'none' ? null : id);
                  setShowCharacterPicker(false);
                }}
                showSkipOption={true}
              />
            </div>
          )}
        </section>

        {/* ── AUTO-SPEAK ── */}
        <section className="settings-section">
          <h2 className="settings-section-title">Behavior</h2>
          <div className="settings-row">
            <label>Auto-speak on tap</label>
            <button className={`settings-toggle${settings.autoSpeak ? ' on' : ''}`} onClick={() => settings.setAutoSpeak(!settings.autoSpeak)}>
              {settings.autoSpeak ? 'ON' : 'OFF'}
            </button>
          </div>
        </section>

        {/* ── COMMUNICATION MODE ── */}
        <section className="settings-section">
          <h2 className="settings-section-title">Communication Mode</h2>
          <div className="settings-row">
            <label>First, Then Mode</label>
            <button
              className={`settings-toggle${firstThenMode ? ' on' : ''}`}
              onClick={() => setFirstThenMode(!firstThenMode)}
              aria-pressed={firstThenMode}
            >
              {firstThenMode ? 'ON' : 'OFF'}
            </button>
          </div>
          <p className="settings-hint">Build sentences using a FIRST/THEN structure. A two-slot panel replaces the speech box and auto-speaks "First X, then Y".</p>
        </section>

        {/* ── PRONUNCIATION EXCEPTIONS ── */}
        <section className="settings-section">
          <h2 className="settings-section-title">Pronunciation</h2>
          <p className="settings-hint">Override how specific words are spoken (e.g. names).</p>
          <div className="settings-row">
            <input className="settings-input-sm" type="text" placeholder="Word" value={pronWord} onChange={(e) => setPronWord(e.target.value)} />
            <input className="settings-input-sm" type="text" placeholder="Sounds like..." value={pronPhonetic} onChange={(e) => setPronPhonetic(e.target.value)} />
            <button className="settings-action-btn" onClick={handleAddPronunciation}>Add</button>
          </div>
          {boardStore.pronunciations.size > 0 && (
            <div className="settings-pron-list">
              {Array.from(boardStore.pronunciations).map(([word, phonetic]) => (
                <div key={word} className="settings-pron-item">
                  <span><strong>{word}</strong> → {phonetic}</span>
                  <button className="settings-pron-del" onClick={() => boardStore.deletePronunciation(word)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── DISPLAY ── */}
        <section className="settings-section">
          <h2 className="settings-section-title">Display</h2>
          <div className="settings-row">
            <label>Grid Columns</label>
            <div className="settings-btn-group">
              {[0, 3, 4, 5, 6, 7, 8].map((n) => (
                <button key={n} className={`settings-btn-option${settings.gridColumns === n ? ' active' : ''}`} onClick={() => settings.setGridColumns(n)}>
                  {n === 0 ? 'Auto' : n}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-row">
            <label>Symbol Size</label>
            <div className="settings-btn-group">
              {(['small', 'medium', 'large'] as const).map((s) => (
                <button key={s} className={`settings-btn-option${settings.symbolSize === s ? ' active' : ''}`} onClick={() => settings.setSymbolSize(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-row">
            <label>Card Style</label>
            <div className="settings-btn-group">
              {([{ value: 'colors', label: 'Colors' }, { value: 'pastel', label: 'Pastel' }, { value: 'high-contrast', label: 'High Contrast' }] as const).map((s) => (
                <button key={s.value} className={`settings-btn-option${settings.cardStyle === s.value ? ' active' : ''}`} onClick={() => settings.setCardStyle(s.value)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-row">
            <label>Label Position</label>
            <div className="settings-btn-group">
              {([{ value: 'below', label: 'Below' }, { value: 'above', label: 'Above' }, { value: 'hidden', label: 'Hidden' }] as const).map((s) => (
                <button key={s.value} className={`settings-btn-option${settings.labelPosition === (s.value as LabelPosition) ? ' active' : ''}`} onClick={() => settings.setLabelPosition(s.value as LabelPosition)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-row">
            <label>Color Scheme</label>
            <div className="settings-btn-group">
              {([{ value: 'default', label: 'Default' }, { value: 'fitzgerald', label: 'Fitzgerald Key' }] as const).map((s) => (
                <button key={s.value} className={`settings-btn-option${settings.colorScheme === (s.value as ColorScheme) ? ' active' : ''}`} onClick={() => settings.setColorScheme(s.value as ColorScheme)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-row">
            <label>Skin Tone</label>
            <div className="settings-btn-group">
              {SKIN_TONES.map((t) => (
                <button key={t.value} className={`settings-btn-option skin-tone-btn${settings.skinTone === t.value ? ' active' : ''}`} onClick={() => settings.setSkinTone(t.value)}>
                  {t.swatch}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-row">
            <label>Show Fast Phrases Strip</label>
            <button className={`settings-toggle${settings.showFastPhrases ? ' on' : ''}`} onClick={() => settings.setShowFastPhrases(!settings.showFastPhrases)}>
              {settings.showFastPhrases ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="settings-row">
            <label>Show Core Words Bar</label>
            <button className={`settings-toggle${settings.showCoreWords ? ' on' : ''}`} onClick={() => settings.setShowCoreWords(!settings.showCoreWords)}>
              {settings.showCoreWords ? 'ON' : 'OFF'}
            </button>
          </div>
        </section>

        {/* ── ACCESSIBILITY ── */}
        <section className="settings-section">
          <h2 className="settings-section-title">Accessibility</h2>
          <div className="settings-row">
            <label>Auditory Touch</label>
            <button className={`settings-toggle${settings.auditoryTouch ? ' on' : ''}`} onClick={() => settings.setAuditoryTouch(!settings.auditoryTouch)}>
              {settings.auditoryTouch ? 'ON' : 'OFF'}
            </button>
          </div>
          <p className="settings-hint">First tap speaks the label. Second tap activates.</p>
          <div className="settings-row">
            <label>Dwell Time: {settings.dwellTime === 0 ? 'Off' : `${settings.dwellTime}ms`}</label>
            <input type="range" min="0" max="2000" step="100" value={settings.dwellTime} onChange={(e) => settings.setDwellTime(parseInt(e.target.value))} />
          </div>
          <p className="settings-hint">Hold to activate instead of tap. For users with motor tremors.</p>
          <div className="settings-row">
            <label>Touch Delay: {formatTouchDelay(settings.touchDelay)}</label>
            <input
              type="range"
              min={TOUCH_DELAY_STEPS[0]}
              max={TOUCH_DELAY_STEPS[TOUCH_DELAY_STEPS.length - 1]}
              step={250}
              value={settings.touchDelay}
              onChange={(e) => settings.setTouchDelay(parseInt(e.target.value))}
              aria-label="Touch delay duration"
            />
          </div>
          <p className="settings-hint">Press and hold every button for the selected duration before it activates. Helps slow down rapid tapping.</p>
        </section>

        {/* ── BOARD MANAGEMENT ── */}
        <section className="settings-section">
          <h2 className="settings-section-title">Board Management</h2>
          <div className="settings-row">
            <label>Sort Current Board</label>
            <button className="settings-action-btn" onClick={handleSortCurrentBoard}>Sort A-Z</button>
          </div>
          <div className="settings-row">
            <label>Create New Board</label>
          </div>
          <div className="settings-row">
            <input className="settings-input-sm" type="text" placeholder="Board name" value={newBoardName} onChange={(e) => setNewBoardName(e.target.value)} />
            <input className="settings-input-sm" type="text" placeholder="Emoji" value={newBoardEmoji} onChange={(e) => setNewBoardEmoji(e.target.value)} maxLength={2} style={{ width: 50 }} />
            <button className="settings-action-btn" onClick={handleCreateBoard}>Create</button>
          </div>
        </section>

        {/* ── BACKUP & RESTORE ── */}
        <section className="settings-section">
          <h2 className="settings-section-title">Backup & Restore</h2>
          <div className="settings-row">
            <label>Export All Data</label>
            <button className="settings-action-btn" onClick={handleExport}>Export JSON</button>
          </div>
          <div className="settings-row">
            <label>Import (Replace All)</label>
            <button className="settings-action-btn" onClick={handleImportReplace}>Import JSON</button>
          </div>
          <div className="settings-row">
            <label>Import (Merge)</label>
            <button className="settings-action-btn" onClick={handleImportMerge}>Merge JSON</button>
          </div>
          <div className="settings-row">
            <label>Share Current Board</label>
            <button className="settings-action-btn" onClick={handleShareBoard}>Share Link</button>
          </div>
          <div className="settings-row">
            <label>Reset Symbol Images</label>
            <button className="settings-action-btn" onClick={async () => {
              await db.symbolCache.clear();
              await db.symbols.toCollection().modify((sym) => {
                if (sym.imageUrl && !sym.imageUrl.startsWith('data:') && !sym.imageUrl.startsWith('blob:')) {
                  sym.imageUrl = undefined;
                }
              });
              window.location.reload();
            }}>Reset & Reload</button>
          </div>
        </section>

        {/* ── LANGUAGE ── */}
        <section className="settings-section">
          <h2 className="settings-section-title">{t('settings.language')}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
            {SUPPORTED_LANGUAGES.map(lang => (
              <button
                key={lang}
                onClick={() => { i18n.changeLanguage(lang); localStorage.setItem('fv_language', lang); }}
                className={`voice-option${i18n.language === lang ? ' active' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{LANGUAGE_FLAGS[lang]}</span>
                  <span className="voice-option-name">{LANGUAGE_NAMES[lang]}</span>
                  {SPRINT_2_LANGUAGES.includes(lang) && (
                    <span style={{ fontSize: 9, fontWeight: 900, background: 'rgba(79,195,247,0.15)', color: '#7DD3FC', padding: '2px 6px', borderRadius: 4, marginLeft: 'auto' }}>BETA</span>
                  )}
                </div>
              </button>
            ))}
          </div>
          <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Want to help translate FreeVoice into your language?{' '}
            <a
              href="https://github.com/Chuea81/freevoice-aac/blob/main/TRANSLATING.md"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'var(--accent-color, #43A047)',
                textDecoration: 'underline',
                fontWeight: 600,
              }}
            >
              See the translation guide on GitHub
            </a>
          </p>
        </section>

        {/* ── PIN LOCK ── */}
        <section className="settings-section">
          <h2 className="settings-section-title">PIN Lock</h2>
          <div className="settings-row">
            <label>Require PIN to access Settings</label>
            <button
              className={`settings-toggle${parentStore.pinEnabled ? ' on' : ''}`}
              onClick={handleTogglePinLock}
              aria-pressed={parentStore.pinEnabled}
            >
              {parentStore.pinEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <p className="settings-hint">
            When on, tapping the Settings button will ask for a 4-digit PIN. Leave off to keep Settings open for everyone.
          </p>
          {parentStore.pinEnabled && (
            <>
              <div className="settings-row">
                <label>Change PIN</label>
                <button className="settings-action-btn" onClick={() => parentStore.openPinModal('change')}>
                  Change PIN
                </button>
              </div>
              <div className="settings-row">
                <label>Remove PIN</label>
                <button className="settings-action-btn" onClick={() => parentStore.openPinModal('remove')}>
                  Remove PIN
                </button>
              </div>
              <p className="settings-hint">
                ⚠️ If you forget your PIN, you will need to clear the app data to reset it — there is no recovery.
              </p>
            </>
          )}
        </section>

        {/* ── SECURITY ── */}
        <section className="settings-section">
          <h2 className="settings-section-title">{t('settings.security')}</h2>
          <div className="settings-row">
            <label>Factory Reset</label>
            <button className="settings-action-btn" style={{ background: '#ef4444', color: 'white' }} onClick={handleFactoryReset}>
              ⚠️ Reset Everything
            </button>
          </div>
          <p className="settings-hint">Deletes all boards, symbols, settings, and AI voices. Keeps language preference. Cannot be undone.</p>
        </section>

        {/* ── ABOUT ── */}
        <section className="settings-section">
          <h2 className="settings-section-title">About</h2>
          <p className="settings-about"><strong>FreeVoice AAC</strong> — Free, open-source communication for every child.</p>
          <p className="settings-about">Shellcraft Labs LLC · MIT License · v1.2.1</p>
          <p className="settings-about" style={{ marginTop: 8 }}>Symbols: ARASAAC (CC BY-NC-SA 4.0) · Gobierno de Aragón</p>
          <p className="settings-about" style={{ marginTop: 12, fontSize: '11px', color: 'rgba(0,0,0,0.35)', fontFamily: 'monospace' }}>Data v9 · App cached</p>
          <p className="settings-about" style={{ marginTop: 8, fontSize: '11px', color: 'rgba(0,0,0,0.35)', fontFamily: 'monospace' }}>Running from: {window.location.href}</p>
          <p style={{fontSize: '10px', opacity: 0.4, fontFamily: 'monospace'}}>
            Running from: {window.location.href}
          </p>
        </section>

      </div>
    </div>
  );
}
