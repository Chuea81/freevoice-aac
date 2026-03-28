import { useState, useCallback } from 'react';
import { useSettingsStore, type LabelPosition, type ColorScheme, type SkinTone } from '../store/settingsStore';
import { useParentStore } from '../store/parentStore';
import { useBoardStore } from '../store/boardStore';
import { VoiceSelector } from '../components/VoiceSelector/VoiceSelector';
import { db } from '../db';

const SKIN_TONES: { value: SkinTone; label: string; swatch: string }[] = [
  { value: 'default', label: 'Default', swatch: '👋' },
  { value: 'light', label: 'Light', swatch: '👋🏻' },
  { value: 'medium-light', label: 'Med-Light', swatch: '👋🏼' },
  { value: 'medium', label: 'Medium', swatch: '👋🏽' },
  { value: 'medium-dark', label: 'Med-Dark', swatch: '👋🏾' },
  { value: 'dark', label: 'Dark', swatch: '👋🏿' },
];

export function Settings({ onBack }: { onBack: () => void }) {
  const settings = useSettingsStore();
  const parentStore = useParentStore();
  const boardStore = useBoardStore();

  // Pronunciation editor state
  const [pronWord, setPronWord] = useState('');
  const [pronPhonetic, setPronPhonetic] = useState('');

  // Create board state
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardEmoji, setNewBoardEmoji] = useState('📁');

  const handleExport = useCallback(async () => {
    const boards = await db.boards.toArray();
    const symbols = await db.symbols.toArray();
    const allSettings = await db.settings.toArray();
    const data = { version: 1, exportedAt: new Date().toISOString(), boards, symbols, settings: allSettings };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `freevoice-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const data = JSON.parse(await file.text());
        if (!data.boards || !data.symbols) { alert('Invalid file.'); return; }
        const replace = confirm('Replace all boards?\n\nOK = Replace\nCancel = Merge');
        await db.transaction('rw', db.boards, db.symbols, db.settings, async () => {
          if (replace) { await db.boards.clear(); await db.symbols.clear(); await db.settings.clear(); }
          await db.boards.bulkPut(data.boards);
          await db.symbols.bulkPut(data.symbols);
          if (data.settings) await db.settings.bulkPut(data.settings);
        });
        useSettingsStore.getState().loadFromDb();
        alert('Import successful!');
      } catch { alert('Failed to import.'); }
    };
    input.click();
  }, []);

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

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="settings-back-btn" onClick={onBack}>← Back</button>
        <h1 className="settings-title">Settings</h1>
        <button className="settings-lock-btn" onClick={() => parentStore.lock()}>🔒 Lock</button>
      </div>

      <div className="settings-scroll">

        {/* ── VOICE (3-tier system) ── */}
        <VoiceSelector />

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

        {/* ── DATA ── */}
        <section className="settings-section">
          <h2 className="settings-section-title">Data</h2>
          <div className="settings-row">
            <label>Export Boards</label>
            <button className="settings-action-btn" onClick={handleExport}>Export JSON</button>
          </div>
          <div className="settings-row">
            <label>Import Boards</label>
            <button className="settings-action-btn" onClick={handleImport}>Import JSON</button>
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

        {/* ── SECURITY ── */}
        <section className="settings-section">
          <h2 className="settings-section-title">Security</h2>
          <div className="settings-row">
            <label>Change PIN</label>
            <button className="settings-action-btn" onClick={() => parentStore.openPinModal('change')}>Change PIN</button>
          </div>
        </section>

        {/* ── ABOUT ── */}
        <section className="settings-section">
          <h2 className="settings-section-title">About</h2>
          <p className="settings-about"><strong>FreeVoice AAC</strong> — Free, open-source communication for every child.</p>
          <p className="settings-about">Shellcraft Labs LLC · MIT License · v1.0.0</p>
          <p className="settings-about" style={{ marginTop: 8 }}>Symbols: ARASAAC (CC BY-NC-SA 4.0) · Gobierno de Aragón</p>
        </section>

      </div>
    </div>
  );
}
